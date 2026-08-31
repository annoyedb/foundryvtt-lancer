// see llp-index for how keys are stored
import type { LancerActor, LancerDEPLOYABLE } from "../../actor/lancer-actor";
import { LANCER } from "../../config";
import type {
  LancerFRAME,
  LancerItem,
  LancerMECH_WEAPON,
  LancerNPC_FEATURE,
  LancerTALENT,
} from "../../item/lancer-item";
import type { ActionData } from "../../models/bits/action";
import type { CounterData } from "../../models/bits/counter";
import { slugify } from "../lid";
import { hasTranslations, hasTranslationsFor, lookupTranslation, rebuildLLPIndex } from "./llp-index";
import { EntryType } from "../../enums";
import { get_pack_id } from "../doc";

const lp = LANCER.log_prefix + " LLP |";
interface ApplicationV2 extends foundry.applications.api.ApplicationV2 {}

//---

const stats = {
  applied: 0,
  documents: new Set<string>(),
  missed: new Set<string>(),
};

const reportStats = foundry.utils.debounce(() => {
  console.log(
    `${lp} Applied ${stats.applied} translations across ${stats.documents.size} documents; ${stats.missed.size} fields of translated LIDs matched no key.`
  );
  if (stats.missed.size) {
    console.groupCollapsed(`${lp} ${stats.missed.size} fields with no matching key`);
    for (const miss of [...stats.missed].sort()) {
      console.debug(miss);
    }
    console.groupEnd();
  }
  stats.applied = 0;
  stats.documents.clear();
  stats.missed.clear();
}, 2000);

//---

/**
 * Attempts to find a translation hit against given paths/subpaths and applies it to the object given at the target field.
 * @param lid
 * @param obj
 * @param field - System's field name
 * @param paths - CC's path(s)
 */
function apply(lid: string, obj: unknown, field: string, paths: string[]): void {
  const target = obj as Record<string, unknown>;
  if (typeof target?.[field] !== "string") return;
  for (const path of paths) {
    const hit = lookupTranslation(lid, path);
    if (!hit) continue;
    target[field] = hit;
    stats.applied++;
    stats.documents.add(lid);
    return;
  }
  if (hasTranslationsFor(lid)) {
    stats.missed.add(`${lid} :: ${paths.join(" | ")}`);
  }
}

/**
 * Builds string segments of array items in CC's syntax
 * @param container
 * @param name
 * @param index
 * @return Normalized slug candidate(s) of a container; name and index
 * @remarks for CC's `action_0` syntax, where anything with a _0 and its siblings are actually an array item
 */
function entrySegments(container: string, name: string | undefined, index: number): string[] {
  const segments: string[] = [];
  if (name) segments.push(`${container}_${slugify(name)}`);
  segments.push(`${container}_${index}`);
  return segments;
}

/**
 * Joins every parent prefix with every segment
 * @param parents
 * @param segments
 * @return Cross product of every parent with every segment; "" on either side yields the other side alone at that level
 */
function join(parents: string[], segments: string[]): string[] {
  return parents.flatMap(parent =>
    segments.map(segment => (parent && segment ? `${parent}.${segment}` : parent || segment))
  );
}

//---

/**
 * Applies translations for `LancerItem`s
 * @param item
 */
export function translateItem(item: LancerItem): void {
  if (!hasTranslations()) return;
  const lid = (item.system as { lid?: string }).lid;
  if (!lid) return;

  translateCommon(lid, item);

  if (item.is_frame()) {
    translateFrame(lid, item);
  } else if (item.is_talent()) {
    translateTalent(lid, item);
  } else if (item.is_mech_weapon()) {
    translateMechWeapon(lid, item);
  } //else if (item.is_npc_feature()) { TODO when beeftime extracts npc locales out
  //translateNPCFeature(lid, item);
  //}

  reportStats();
}

/**
 * Applies translations to common leaf nodes that all items share
 * @param lid
 * @param item
 */
function translateCommon(lid: string, item: LancerItem): void {
  const sys = item.system as Record<string, unknown>;
  apply(lid, item, "name", ["name"]);
  apply(lid, sys, "description", ["description"]);
  apply(lid, sys, "effect", ["effect"]);
  apply(lid, sys, "detail", ["detail"]); // Skills
  apply(lid, sys, "terse", ["terse"]); // Talents
  apply(lid, sys, "effects", ["effects"]); // Statuses
  apply(lid, sys, "mounted_effect", ["mounted_effect"]); // Core bonuses
  translateActions(lid, [""], sys.actions as ActionData[] | undefined);
  translateSynergies(lid, [""], sys.synergies as { detail: string }[] | undefined);
  translateCounters(sys.counters as CounterData[] | undefined);
}

/**
 *
 * @param lid
 * @param item
 */
function translateFrame(lid: string, item: LancerFRAME) {
  const cs = item.system.core_system;
  apply(lid, cs, "name", ["core_system.name"]);
  apply(lid, cs, "description", ["core_system.description"]);
  apply(lid, cs, "active_name", ["core_system.active_name"]);
  apply(lid, cs, "active_effect", ["core_system.active_effect"]);
  apply(lid, cs, "passive_name", ["core_system.passive_name"]);
  apply(lid, cs, "passive_effect", ["core_system.passive_effect"]);
  translateActions(lid, ["core_system"], cs.active_actions, ["action", "active_effect", "active"]);
  translateActions(lid, ["core_system"], cs.passive_actions, ["action", "passive_effect", "passive"]);
  // @ts-ignore TODO remove when types aren't borked
  translateSynergies(lid, ["core_system"], cs.active_synergies);
  // @ts-ignore TODO remove when types aren't borked
  translateSynergies(lid, ["core_system"], cs.passive_synergies);
  translateCounters(cs.counters);
  item.system.traits.forEach((trait, index) => {
    const prefixes = entrySegments("trait", trait.name, index);
    apply(lid, trait, "name", join(prefixes, ["name"]));
    apply(lid, trait, "description", join(prefixes, ["description"]));
    translateActions(lid, prefixes, trait.actions);
    // @ts-ignore TODO remove when types aren't borked
    translateSynergies(lid, prefixes, trait.synergies);
    translateCounters(trait.counters);
  });
}

/**
 *
 * @param lid
 * @param item
 */
function translateTalent(lid: string, item: LancerTALENT): void {
  item.system.ranks.forEach((rank, index) => {
    const prefixes = entrySegments("rank", rank.name, index);
    apply(lid, rank, "name", join(prefixes, ["name"]));
    apply(lid, rank, "description", join(prefixes, ["description"]));
    translateActions(lid, prefixes, rank.actions, ["action", "active_effect"]);
    // @ts-ignore TODO remove when types aren't borked
    translateSynergies(lid, prefixes, rank.synergies);
    translateCounters(rank.counters);
  });
}

// TODO test
function translateSynergies(lid: string, parents: string[], synergies: { detail: string }[] | undefined): void {
  synergies?.forEach((synergy, index) => {
    apply(lid, synergy, "detail", join(parents, [`synergy_${index}.detail`]));
  });
}

/**
 *
 * @param counters
 * @remarks keyed by their own top-level LID
 */
// TODO test
function translateCounters(counters: CounterData[] | undefined): void {
  for (const counter of counters ?? []) {
    if (counter.lid) apply(counter.lid, counter, "name", ["name"]);
  }
}

/**
 * Builds the prefixes with `parents` to given `actions` and applies translations to each action
 * @param lid
 * @param parents
 * @param actions
 * @param containers
 * @remarks Named array entries are singularized slugged elements (`action_[slug of source name]`) of the system ones (`actions[i]`),
 * with a positional fallback (`action_[i]`) for unnamed entries like system actions (`ms_aceso_stabilizer.action_[i]`.
 */
// TODO test
function translateActions(
  lid: string,
  parents: string[],
  actions: ActionData[] | undefined,
  containers = ["action"]
): void {
  actions?.forEach((action, index) => {
    const prefixes = join(
      parents,
      containers.flatMap(container => entrySegments(container, action.name, index))
    );
    apply(lid, action, "name", join(prefixes, ["name"]));
    apply(lid, action, "detail", join(prefixes, ["detail"]));
    apply(lid, action, "trigger", join(prefixes, ["trigger"]));
    apply(lid, action, "terse", join(prefixes, ["terse"]));
  });
}

/**
 *
 * @param lid
 * @param item
 */
function translateMechWeapon(lid: string, item: LancerMECH_WEAPON): void {
  item.system.profiles.forEach((profile, index) => {
    const prefixes = [...entrySegments("profile", profile.name, index), ""];
    apply(lid, profile, "name", join(prefixes, ["name"]));
    apply(lid, profile, "description", join(prefixes, ["description"]));
    apply(lid, profile, "effect", join(prefixes, ["effect"]));
    apply(lid, profile, "on_attack", join(prefixes, ["on_attack.detail"]));
    apply(lid, profile, "on_hit", join(prefixes, ["on_hit.detail"]));
    apply(lid, profile, "on_crit", join(prefixes, ["on_crit.detail"]));
    translateActions(lid, prefixes, profile.actions);
    // @ts-ignore TODO remove when types aren't borked
    translateSynergies(lid, prefixes, profile.synergies);
    translateCounters(profile.counters);
  });
}

// TODO when beeftime extracts npc locales out also test
function translateNPCFeature(lid: string, item: LancerNPC_FEATURE): void {
  const sys = item.system as unknown as Record<string, unknown>;
  apply(lid, sys, "trigger", ["trigger"]);
  apply(lid, sys, "on_hit", ["on_hit.detail"]);
}

/**
 * Applies translations on `LancerActor`s
 * @param actor
 */
export function translateActor(actor: LancerActor): void {
  if (!hasTranslations()) return;
  const lid = actor.system.lid;
  if (!lid) return;
  if (actor.is_deployable()) {
    translateDeployable(lid, actor);
  }

  reportStats();
}

/**
 * Applies translations from all the indexing built in llp-index onto Deployables
 * @param lid
 * @param actor
 * @remarks Deployables don't get their direct translations from their own LID, instead resolved through `aliasDeployableSubtrees`
 */
function translateDeployable(lid: string, actor: LancerDEPLOYABLE): void {
  apply(lid, actor, "name", ["name"]);
  apply(lid, actor.system, "detail", ["detail"]);
  translateActions(lid, [""], actor.system.actions);
  // @ts-ignore TODO remove when types aren't borked
  translateSynergies(lid, [""], actor.system.synergies);
  translateCounters(actor.system.counters);
}

/**
 * Rewrites entry names in a rendered compendium listing through HTML DOM replacement
 * @param app
 * @param html
 * @remarks DOM replacement so that the actual compendium source isn't being written over
 */
export function translateCompendiumNames(app: ApplicationV2, html: HTMLElement): void {
  if (!hasTranslations()) return;
  const collection = (app as { collection?: foundry.documents.collections.CompendiumCollection.Any }).collection;
  if (!collection) return;
  const index = collection.index;

  let applied = 0;
  for (const li of html.querySelectorAll<HTMLElement>("li[data-entry-id]")) {
    const entry = index.get(li.dataset.entryId!) as { system?: { lid?: string } } | undefined;
    const lid = entry?.system?.lid;
    if (!lid) continue;
    const hit = lookupTranslation(lid, "name");
    if (!hit) continue;

    const nameElement = li.querySelector(".entry-name a") ?? li.querySelector(".entry-name");
    if (nameElement) {
      nameElement.textContent = hit;
      applied++;
    }
  }
  if (applied) console.log(`${lp} Renamed ${applied} entries in compendium '${collection.metadata.label}'.`);
}

/**
 * Rebuilds the LLP index and rerenders open Foundry documents.
 *
 * Run every time documents need to swap translations.
 * @remarks
 */
export async function refreshLLPTranslations(): Promise<void> {
  await rebuildLLPIndex();

  const start = performance.now();
  let reset = 0;
  // Reset the actors and items
  for (const item of game.items ?? []) {
    item.reset();
    reset++;
  }
  for (const actor of game.actors ?? []) {
    actor.reset();
    reset++;
  }

  // Reset compendium entries; `game.packs`/compendium entries are lazy loaded
  for (const id of new Set(Object.values(EntryType).map(get_pack_id))) {
    const pack = game.packs.get(id);
    for (const doc of pack?.contents ?? []) {
      doc.reset();
      reset++;
    }
  }

  // Rerender open documents
  let rendered = 0;
  for (const app of foundry.applications.instances.values()) {
    // ApplicationV2
    await app.render();
    rendered++;
  }
  for (const app of Object.values(ui.windows)) {
    // ApplicationV1
    app.render(false);
    rendered++;
  }

  console.log(
    `${lp} Reset ${reset} documents and re-rendered ${rendered} windows in
    ${(performance.now() - start).toFixed(0)}ms.`
  );
}

// ---
