import { LANCER } from "../config";
import { type PackedLanguagePatchWrapper } from "./unpacking/packed-types";

/**
 * Summary of an LLP's contents, for use in the LCP Manager app.
 * @param target - LCP the patch translates
 * @param lang
 * @param translator
 * @param translationVersion
 * @param lines - Number of entries under the patch's `data` key
 * @remarks Kept separate so that attribution, target, etc can be preserved in aggregate summaries
 */
export type LLPSummaryEntry = {
  target: string;
  lang: string;
  translator: string;
  translationVersion: string;
  lines: number;
};

/**
 * Summary wrapper for LCP Language Patches, for use in the LCP Manager app.
 * @param aggregate - True when this rolls up more than one patch, in which case `entries` carries the breakdown
 * @param targetVersion - Version range of the LCP the translation was written against
 * @param lastUpdate
 * @param website
 * @param entries
 */
export type LLPSummary = LLPSummaryEntry & {
  aggregate: boolean;
  targetVersion: string;
  lastUpdate: string;
  website: string;
  entries: LLPSummaryEntry[];
};

/**
 * The bare minimum for usability is `lang` (the language), `target` (LCP target), and `data` (translation content)
 * @param obj
 */
export function isValidLanguagePatch(obj: unknown): obj is PackedLanguagePatchWrapper {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "lang" in obj &&
    typeof obj.lang === "string" &&
    "target" in obj &&
    typeof obj.target === "string" &&
    "data" in obj &&
    typeof obj.data === "object" &&
    obj.data !== null
  );
}

/**
 * Normalizes potential BCP 47 (Foundry) to ISO locale (e.g. `en-CA` -> `en`)
 * @param lang
 */
export function normalizeLanguageCode(lang: string): string {
  return lang.toLowerCase().split("-")[0];
}

/**
 *
 * @param patch
 * @return Returns the number of locale strings included in the LLP
 */
export function countPatchLines(patch: PackedLanguagePatchWrapper): number {
  return Object.keys(patch.data).length;
}

/**
 *
 * @param patch
 * @return Returns a generated `LLPSummary` for the LCP Manager app
 */
export function generateLLPSummary(patch: PackedLanguagePatchWrapper): LLPSummary {
  return {
    aggregate: false,
    target: patch.target,
    lang: normalizeLanguageCode(patch.lang),
    translator: patch.translator,
    translationVersion: patch.translation_version,
    targetVersion: patch.target_version,
    lastUpdate: patch.last_update,
    lines: countPatchLines(patch),
    website: patch.website,
    entries: [],
  };
}

/**
 *
 * @param patches
 * @return Returns a generated `LLPSummary` for the LCP Manager app for multiple LLPs.
 */
export function generateMultiLLPSummary(patches: PackedLanguagePatchWrapper[]): LLPSummary {
  const languages = [...new Set(patches.map(patch => normalizeLanguageCode(patch.lang)))].sort();
  const translators = [...new Set(patches.map(patch => patch.translator))];
  return {
    aggregate: true,
    target: game.i18n.localize("lancer.lcpManager.header.selectedLlps.label"),
    lang: languages.join(", "),
    translator: translators.length === 1 ? translators[0] : game.i18n.localize("lancer.lcpManager.various.label"),
    translationVersion: "",
    targetVersion: "",
    lastUpdate: "",
    lines: patches.reduce((total, patch) => total + countPatchLines(patch), 0),
    website: "",
    entries: patches.map(patch => ({
      target: patch.target,
      lang: normalizeLanguageCode(patch.lang),
      translator: patch.translator,
      translationVersion: patch.translation_version,
      lines: countPatchLines(patch),
    })),
  };
}

/**
 * Summarizes `PackedLanguagePatchWrapper`s staged for import via official sources (table) and unofficial sources (patches)
 * @param official - LCP Language Patches from the checked rows of the official content table
 * @param patches - LCP Language Patches read from the file selector
 * @return Returns a combined summary, or null when nothing is staged
 * TODO: official stuff (packaged inside the LCPs themselves (I think (maybe)))
 */
export function summarizeStagedLanguagePatches(
  official: PackedLanguagePatchWrapper[],
  patches: PackedLanguagePatchWrapper[]
) {}

/**
 *
 * @param patches
 * @return Returns an aggregate content summary of the given array of `PackedLanguagePatchWrapper`s or a single content summary if only one is given
 */
export function summarizeLanguagePatches(patches: PackedLanguagePatchWrapper[]): LLPSummary | null {
  if (!patches.length) return null;
  return patches.length === 1 ? generateLLPSummary(patches[0]) : generateMultiLLPSummary(patches);
}

/**
 * Reads from an array of `File`s all assumed to be `.llp`s, returning `PackedLanguagePatchWrapper`s once read for use in the LCP Manager
 * @param files - Array of `.llp` `File` types; non-LLP files are dropped
 */
export async function readLanguagePatches(files: File[]): Promise<PackedLanguagePatchWrapper[]> {
  const patches = await Promise.all(files.map(file => readLanguagePatch(file)));
  return patches.filter(patch => patch !== null);
}

/**
 * Reads from a `File` assumed to be an `.llp`, returning a `PackedLanguagePatchWrapper` after parsing the format (which is just a JSON).
 * @param file - Blob of `.llp` `File` types; non-LLP files are dropped
 */
export async function readLanguagePatch(file: File): Promise<PackedLanguagePatchWrapper | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    ui.notifications?.error(game.i18n.format("lancer.lcpManager.error.llpParseFailed.label", { file: file.name }));
    return null;
  }
  if (!isValidLanguagePatch(parsed)) {
    ui.notifications?.error(game.i18n.format("lancer.lcpManager.error.invalidLlp.label", { file: file.name }));
    return null;
  }
  return parsed;
}

/**
 * Merges LLPs into the cached LLP map and persists it in the Foundry server's database. Overrides the current entry when overlapping keys are found.
 * @param patches
 * @remark Stored data object is keyed by language and then LCP target
 */
export async function cacheLanguagePatches(
  patches: PackedLanguagePatchWrapper[]
): Promise<{ stored: number; replaced: number }> {
  const llpMap = foundry.utils.deepClone(game.settings.get(game.system.id, LANCER.setting_localization_llp_map));
  let stored = 0;
  let replaced = 0;
  for (const patch of patches) {
    const packs = (llpMap[normalizeLanguageCode(patch.lang)] ??= {});
    if (patch.target in packs) replaced++;
    packs[patch.target] = patch;
    stored++;
  }
  if (stored) await game.settings.set(game.system.id, LANCER.setting_localization_llp_map, llpMap);
  return { stored, replaced };
}

/**
 * Checks a target version against the proposed range
 * @param version Version right now (e.g. `1.0.0`)
 * @param range Version minimum/required (e.g. `>=1.0.0`)
 * @remarks Not totally clear on what beef meant by 'semver range' in the documentation, so hopefully
 * he didn't literally mean 'range' as in `>= 1.0.0 < 2.0.0`, otherwise this functioned is cooked and needs to be
 * rewritten
 */
export function satisfiesTargetVersion(version: string, range: string): boolean {
  const match = /^(>=|<=|>|<|=)?\s*(.+)$/.exec(range.trim());
  if (!match) return false;
  const op = match[1] ?? "=";
  const target = match[2];

  const newer = foundry.utils.isNewerVersion(version, target); // version > target
  const older = foundry.utils.isNewerVersion(target, version); // version < target

  switch (op) {
    case ">":
      return newer;
    case ">=":
      return !older;
    case "<":
      return older;
    case "<=":
      return !newer;
    default:
      return !newer && !older;
  }
}

/**
 * Gets the `lid` and `target` path of the localization string
 * @param path
 */
export function getLocalizationTarget(path: string) {
  function splitFirst(str: string, sep: string): [string, string] {
    const idx = str.indexOf(sep);
    if (idx === -1) return [str, ""];
    return [str.slice(0, idx), str.slice(idx + sep.length)];
  }

  const split = splitFirst(path, ".");
  const lid = split[0];
  const dotPath = split[1];
  if (dotPath) {
    return { lid: lid, target: dotPath };
  } else {
    return null;
  }
}
