import { LANCER } from "../../config";
import { EntryType } from "../../enums";
import { get_pack_id } from "../doc";
import { getInstalledPatches, normalizeLanguageCode } from "./llp-import";

const lp = LANCER.log_prefix + " LLP |";

/**
 * Every LID the world's Lancer compendiums hold, both verbatim and in normalized spelling, so patch keys can be pruned
 * against known LIDs instead of guessing where a LID ends.
 *
 * (`ms___scorpion_v70.1` is a single LID even though translations are dotpathed lol)
 */
type LIDIndex = {
  exact: Set<string>;
  normalized: Map<string, string>; // normalized LID -> exact LID
};

/**
 * Merged translations for the active language, keyed by normalized LID and then by normalized LLP subpath
 * (e.g. `action_area_denial.detail`). Every document resolves its text through this map via `lookupTranslation(lid, path)`;
 * anything that cannot be keyed by its own LID must be reshaped into that form during `rebuildLLPIndex`
 * (e.g. `aliasDeployableSubtrees`).
 */
let translations: Map<string, Map<string, string>> = new Map(); // normalized LID -> (normalized subpath -> translation)

/**
 * Collapses a slug/LID/path segment to lowercase `[a-z0-9]` strings joined by `_`, so spellings from the Lancer system's
 * `slugify` (the 'Deployable Shields' system) and from `compcon-locales`' unknown slugifier can be compared.
 *
 * I hate slugs.
 */
export function normalizeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normalizes each segment of an LLP subpath for storage/lookup
 */
function normalizePath(path: string): string {
  return path.split(".").map(normalizeSlug).join(".");
}

/**
 * Sweeps every Lancer compendium for the LIDs they hold. Relies on `system.lid` being in `compendiumIndexFields`.
 */
export async function buildLIDIndex(): Promise<LIDIndex> {
  const start = performance.now();
  const lids: LIDIndex = {
    exact: new Set(),
    normalized: new Map(),
  };

  const packIDs = new Set(Object.values(EntryType).map(get_pack_id));
  let sweptPacks = 0;
  for (const id of packIDs) {
    const pack = game.packs.get(id);
    if (!pack) continue;
    await pack.getIndex(); // Load compendium index so we can read it
    sweptPacks++;

    pack.index.forEach(entry => {
      const lid = (entry as { system?: { lid?: string } }).system?.lid; // Definitely there according to `compendiumIndexFields`
      if (lid) {
        lids.exact.add(lid);
        lids.normalized.set(normalizeSlug(lid), lid);
      }
    });
  }

  console.log(
    `${lp} Indexed ${lids.exact.size} compendium LIDs across ${sweptPacks}/${packIDs.size} packs in ${(
      performance.now() - start
    ).toFixed(0)}ms.`
  );
  return lids;
}

/**
 * Splits a patch key into its LID and subpath by pruning down from the full length against known LIDs.
 * @param key
 * @param lids
 * @return null when no head of the key is a known LID (target not installed, or a key like `GMS.name`/`act_*`, sitreps, etc)
 */
export function splitPatchKey(key: string, lids: LIDIndex): { lid: string; path: string } | null {
  const parts = key.split(".");
  // Thanks to shit like `ms___scorpion_v70.1` it is better to read the tail as the head
  for (let i = parts.length - 1; i > 0; i--) {
    const head = parts.slice(0, i).join(".");
    const lid = lids.exact.has(head) ? head : lids.normalized.get(normalizeSlug(head));
    if (lid) {
      return {
        lid: lid,
        path: parts.slice(i).join("."),
      };
    }
  }
  return null;
}

/**
 * Rebuilds the runtime translation index: merges every installed patch matching the user's language into the LID-keyed
 * store, then reshapes deployable subtrees into entries of their own. Called at `ready` and whenever the cached LLP map changes.
 */
export async function rebuildLLPIndex(): Promise<void> {
  const start = performance.now();
  translations = new Map();

  const lang = normalizeLanguageCode(game.i18n.lang);
  const installed = getInstalledPatches();
  const patches = installed.filter(patch => normalizeLanguageCode(patch.lang) === lang);
  console.log(
    `${lp} Rebuilding translation index for '${lang}': ${patches.length}/${installed.length} installed patches match.`
  );
  if (!patches.length) {
    console.log(`${lp} No patches for '${lang}'; compendium text will render untranslated.`);
    return;
  }

  const lids = await buildLIDIndex();

  let stored = 0;
  const discarded: string[] = [];
  for (const patch of patches) {
    for (const [key, value] of Object.entries(patch.data)) {
      const hit = splitPatchKey(key, lids);
      if (!hit) {
        discarded.push(key);
        continue;
      }
      storeTranslation(hit.lid, hit.path, value);
      stored++;
    }
  }

  const aliased = aliasDeployableSubtrees();

  console.log(
    `${lp} Stored ${stored} translations for ${translations.size} LIDs (${aliased} aliased for deployables) in ${(
      performance.now() - start
    ).toFixed(0)}ms; ${discarded.length} keys matched no LID.`
  );
  if (discarded.length) {
    console.groupCollapsed(`${lp} ${discarded.length} unmatched patch keys`);
    for (const key of discarded.sort()) console.debug(key);
    console.groupEnd();
  }
}

/**
 *
 * @param lid
 * @param path
 * @param value
 */
function storeTranslation(lid: string, path: string, value: string): void {
  const lidKey = normalizeSlug(lid);
  let paths = translations.get(lidKey);
  if (!paths) translations.set(lidKey, (paths = new Map()));
  paths.set(normalizePath(path), value);
}

/**
 * Special exception handler for aliasing deployables
 * @return Number of entries copied
 */
function aliasDeployableSubtrees(): number {
  const aliases: { lid: string; path: string; value: string }[] = [];
  /**
   * In CC deployable text nests under the owning item (`ms_assassin_drone.deployable_assassin_drone.name`) while the actor
   * is unpacked with `lid: "dep_" + slugify(name)`. Rather than special-casing lookups, copy every `deployable_<slug>` subtree
   * to an entry under `dep_<slug>`, so deployable actors resolve through the same `lookupTranslation` as everything else.
   */
  for (const paths of translations.values()) {
    for (const [path, value] of paths) {
      const parts = path.split(".");
      const at = parts.findIndex(part => part.startsWith("deployable_"));
      if (at === -1) continue;
      const rest = parts.slice(at + 1).join(".");
      if (!rest) continue; // Malformed key ending at the segment itself
      aliases.push({ lid: "dep_" + parts[at].slice("deployable_".length), path: rest, value });
    }
  }
  for (const alias of aliases) storeTranslation(alias.lid, alias.path, alias.value);
  return aliases.length;
}

/**
 * Looks up a translation for a document's LID and an LLP subpath (e.g. `name`, `description`). This function normalizes
 * both inputs.
 * @return undefined when no translation is installed for the active language
 * @param lid
 * @param path
 */
export function lookupTranslation(lid: string, path: string): string | undefined {
  return translations.get(normalizeSlug(lid))?.get(normalizePath(path));
}

/**
 * @return Whether any translations are loaded for the active language
 */
export function hasTranslations(): boolean {
  return translations.size > 0;
}
