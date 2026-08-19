// Namespace configuration Values

import { ACTOR_TYPES, type LancerActorType } from "./actor/lancer-actor";
import { EntryType, NpcFeatureType } from "./enums";
import type { LancerItemType } from "./item/lancer-item";

const ASCII = `
╭╮╱╱╭━━━┳━╮╱╭┳━━━┳━━━┳━━━╮
┃┃╱╱┃╭━╮┃┃╰╮┃┃╭━╮┃╭━━┫╭━╮┃
┃┃╱╱┃┃╱┃┃╭╮╰╯┃┃╱╰┫╰━━┫╰━╯┃
┃┃╱╭┫╰━╯┃┃╰╮┃┃┃╱╭┫╭━━┫╭╮╭╯
┃╰━╯┃╭━╮┃┃╱┃┃┃╰━╯┃╰━━┫┃┃╰╮
╰━━━┻╯╱╰┻╯╱╰━┻━━━┻━━━┻╯╰━╯`;

export function WELCOME(): string {
  return `
  <div style="text-align: center;">
    <a href="https://massifpress.com/legal">
      <img style="max-width: 90%; border: none" src="https://massifpress.com/_next/image?url=%2Fimages%2Flegal%2Fpowered_by_Lancer-01.svg&w=640&q=75" alt="Powered by Lancer">
    </a>
  </div>

  <p><a href="https://github.com/Eranziel/foundryvtt-lancer/blob/master/CHANGELOG.md">CHANGELOG</a></p>

  <p>Check out the project wiki for
  <a href="https://github.com/Eranziel/foundryvtt-lancer/wiki/FAQ">FAQ</a>,
  <a href="https://github.com/Eranziel/foundryvtt-lancer/wiki/Resources">recommended modules</a>,
  and other information about how to use the system.</p>

  <p>@UUID[Compendium.lancer.lancer_info.JournalEntry.JDfVPzoWPOLyhCCa.JournalEntryPage.LVsmG9EfKH9VpVJX]{Legal & Acknowlegements}</p>
  <p>@UUID[Compendium.lancer.lancer_info.JournalEntry.JDfVPzoWPOLyhCCa.JournalEntryPage.gotpldNfOwLxauXi]{Migrating from Earlier Versions}</p>
  `;
}

export const LANCER = {
  ASCII,
  log_prefix: "LANCER |",
  setting_migration_version: "systemMigrationVersion",
  setting_core_data: "coreDataVersion",
  setting_lcps: "installedLCPs",
  setting_stock_icons: "keepStockIcons",
  // setting_welcome: "hideWelcome", // Deprecated as of v2.7.0
  setting_floating_damage_numbers: "floatingNumbers",
  setting_ui_theme: "uiTheme",
  setting_pause_icon: "pauseIcon",
  setting_compcon_login: "compconLogin",
  setting_status_icons: "statusIconConfig",
  setting_automation: "automationOptions",
  setting_automation_switch: "automationSwitch",
  setting_automation_attack: "attackSwitch", // Deprecated
  setting_scan_outputs: "scanOutputs",
  setting_actionTracker: "actionTracker",
  setting_combat_appearance: "combat-tracker-appearance",
  setting_combat_sort: "combat-tracker-sort",
  setting_pilot_oc_heat: "autoOCHeat",
  setting_overkill_heat: "autoOKillHeat",
  setting_auto_structure: "autoCalcStructure",
  setting_dsn_setup: "dsnSetup",
  setting_square_grid_diagonals: "squareGridDiagonals",
  setting_tag_config: "tagConfig",
  setting_simple_fonts: "simpleFonts",
  // setting_120: "warningFor120", // Old setting, currently unused.
  // setting_beta_warning: "warningForBeta", // Old setting, currently unused.
} as const;

// Convenience for mapping item/actor types to full names
const FRIENDLY_DOCUMENT_NAMES_SINGULAR = {
  [EntryType.CORE_BONUS]: game.i18n.localize("lancer.common.item.coreBonus.label"),
  [EntryType.DEPLOYABLE]: game.i18n.localize("lancer.common.actor.deployable.label"),
  [EntryType.FRAME]: game.i18n.localize("lancer.common.item.frame.label"),
  [EntryType.LICENSE]: game.i18n.localize("lancer.common.item.license.label"),
  [EntryType.MECH]: game.i18n.localize("lancer.common.actor.mech.label"),
  [EntryType.MECH_SYSTEM]: game.i18n.localize("lancer.common.item.mechSystem.label"),
  [EntryType.MECH_WEAPON]: game.i18n.localize("lancer.common.item.mechWeapon.label"),
  [EntryType.NPC]: game.i18n.localize("lancer.common.actor.npc.label"),
  [EntryType.NPC_CLASS]: game.i18n.localize("lancer.common.item.npcClass.label"),
  [EntryType.NPC_FEATURE]: game.i18n.localize("lancer.common.item.npcFeature.label"),
  [EntryType.NPC_TEMPLATE]: game.i18n.localize("lancer.common.item.npcTemplate.label"),
  [EntryType.ORGANIZATION]: game.i18n.localize("lancer.common.item.organization.label"),
  [EntryType.PILOT]: game.i18n.localize("lancer.common.actor.pilot.label"),
  [EntryType.PILOT_ARMOR]: game.i18n.localize("lancer.common.item.pilotArmor.label"),
  [EntryType.PILOT_GEAR]: game.i18n.localize("lancer.common.item.pilotGear.label"),
  [EntryType.PILOT_WEAPON]: game.i18n.localize("lancer.common.item.pilotWeapon.label"),
  [EntryType.RESERVE]: game.i18n.localize("lancer.common.item.reserve.label"),
  [EntryType.SKILL]: game.i18n.localize("lancer.common.item.skill.label"),
  [EntryType.STATUS]: game.i18n.localize("lancer.common.item.status.label"),
  [EntryType.TALENT]: game.i18n.localize("lancer.common.item.talent.label"),
  [EntryType.BOND]: game.i18n.localize("lancer.common.item.bond.label"),
  [EntryType.WEAPON_MOD]: game.i18n.localize("lancer.common.item.weaponMod.label"),
};
const FRIENDLY_DOCUMENT_NAMES_PLURAL = {
  [EntryType.CORE_BONUS]: game.i18n.localize("lancer.common.item.coreBonus.plural"),
  [EntryType.DEPLOYABLE]: game.i18n.localize("lancer.common.actor.deployable.plural"),
  [EntryType.FRAME]: game.i18n.localize("lancer.common.item.frame.plural"),
  [EntryType.LICENSE]: game.i18n.localize("lancer.common.item.license.plural"),
  [EntryType.MECH]: game.i18n.localize("lancer.common.actor.mech.plural"),
  [EntryType.MECH_SYSTEM]: game.i18n.localize("lancer.common.item.mechSystem.plural"),
  [EntryType.MECH_WEAPON]: game.i18n.localize("lancer.common.item.mechWeapon.plural"),
  [EntryType.NPC]: game.i18n.localize("lancer.common.actor.npc.plural"),
  [EntryType.NPC_CLASS]: game.i18n.localize("lancer.common.item.npcClass.plural"),
  [EntryType.NPC_FEATURE]: game.i18n.localize("lancer.common.item.npcFeature.plural"),
  [EntryType.NPC_TEMPLATE]: game.i18n.localize("lancer.common.item.npcTemplate.plural"),
  [EntryType.ORGANIZATION]: game.i18n.localize("lancer.common.item.organization.plural"),
  [EntryType.PILOT]: game.i18n.localize("lancer.common.actor.pilot.plural"),
  [EntryType.PILOT_ARMOR]: game.i18n.localize("lancer.common.item.pilotArmor.plural"),
  [EntryType.PILOT_GEAR]: game.i18n.localize("lancer.common.item.pilotGear.plural"),
  [EntryType.PILOT_WEAPON]: game.i18n.localize("lancer.common.item.pilotWeapon.plural"),
  [EntryType.RESERVE]: game.i18n.localize("lancer.common.item.reserve.plural"),
  [EntryType.SKILL]: game.i18n.localize("lancer.common.item.skill.plural"),
  [EntryType.STATUS]: game.i18n.localize("lancer.common.item.status.plural"),
  [EntryType.TALENT]: game.i18n.localize("lancer.common.item.talent.plural"),
  [EntryType.BOND]: game.i18n.localize("lancer.common.item.bond.plural"),
  [EntryType.WEAPON_MOD]: game.i18n.localize("lancer.common.item.weaponMod.plural"),
};

// Quick for single/plural
export function friendly_entrytype_name(type: LancerItemType | LancerActorType, count?: number): string {
  if ((count ?? 1) > 1) {
    return FRIENDLY_DOCUMENT_NAMES_PLURAL[type] ?? `Unknown <${type}>s`;
  } else {
    return FRIENDLY_DOCUMENT_NAMES_SINGULAR[type] ?? `Unknown <${type}>`;
  }
}

// TODO: const MACRO_ICONS

export function TypeIcon(type: EntryType, macro?: boolean): string {
  const docType = ACTOR_TYPES.includes(type) ? "Actor" : "Item";
  const img = getDocumentClass(docType).getDefaultArtwork({ type }).img;
  return img;
}

// A substitution method that replaces the first argument IFF it is an img that we don't think should be preserved, and if the trimmed replacement string is truthy
export function replaceDefaultResource(
  current: string | null | undefined,
  ...replacements: Array<string | null>
): string {
  if (!current?.trim() || current.includes("systems/lancer") || current == "icons/svg/mystery-man.svg") {
    for (let replacement of replacements) {
      // If no replacement, skip
      if (!replacement?.trim()) {
        continue;
      }

      // If empty or from system path or mystery man, replace
      return replacement;
    }
    return current || ""; // We've got nothing
  }

  // Otherwise keep as is
  return current;
}
