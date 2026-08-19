import type { DeepPartial } from "fvtt-types/utils";
import { LANCER } from "../config";
import { LocalizationOptions } from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface RenderOptions extends foundry.applications.api.ApplicationV2.RenderOptions {
  loadDefault: boolean;
  loadEmpty: boolean;
}

interface Configuration extends foundry.applications.api.ApplicationV2.Configuration {}

export class LocalizationConfig extends HandlebarsApplicationMixin(ApplicationV2<{}, Configuration, RenderOptions>) {
  static override PARTS = {
    form: { template: "systems/lancer/templates/settings/localization-config.hbs" },
    footer: { template: "templates/generic/form-footer.hbs" },
  };

  static override DEFAULT_OPTIONS = {
    id: "lancer-localization-settings",
    tag: "form",
    window: {
      title: "lancer.setting.localization.menu.label",
      icon: "",
      contentClasses: ["standard-form"],
    },
    position: {
      width: 550,
    },
    form: {
      handler: LocalizationConfig.#formHandler,
      submitOnChange: false,
      closeOnSubmit: true,
    },
    actions: {
      onLoadEmpty: this.#loadEmpty,
      onReset: this.#onReset,
      clearLLPCache: LocalizationConfig.#clearLLPCacheHandler,
      deleteLLPEntry: LocalizationConfig.#deleteLLPEntryHandler,
    },
  };

  protected override async _prepareContext(opts: DeepPartial<RenderOptions>): Promise<{}> {
    super._prepareContext;
    const config = game.settings.get(game.system.id, LANCER.setting_localization);
    const blank = new LocalizationOptions();
    Object.keys(blank).forEach(k => ((<any>blank)[k] = false));
    const llpMap = game.settings.get(game.system.id, LANCER.setting_localization_llp_map);
    const cache = Object.entries(llpMap)
      .map(([locale, packs]) => ({ locale, packs: Object.keys(packs).sort() }))
      .filter(entry => entry.packs.length > 0)
      .sort((a, b) => a.locale.localeCompare(b.locale));
    const ctx = {
      config: opts.loadDefault ? new LocalizationOptions() : opts.loadEmpty ? blank : config,
      fields: config.schema.fields,
      cache,
      buttons: [
        { type: "submit", name: "submit", icon: "fas fa-save", label: "SETTINGS.Save" },
        { type: "button", name: "reset", icon: "fas fa-undo", label: "SETTINGS.Reset", action: "onReset" },
        { type: "button", name: "clear", icon: "fas fa-cancel", label: "Clear All", action: "onLoadEmpty" },
        {
          type: "button",
          name: "clearLLPCache",
          icon: "fas fa-trash",
          label: "lancer.setting.localization.clearCache.label",
          action: "clearLLPCache",
        },
      ],
    };
    opts.loadEmpty = false;
    opts.loadDefault = false;
    return ctx;
  }

  static async #formHandler(this: LocalizationConfig, _ev: unknown, _form: unknown, formData: any) {
    const res = formData.object;
    await game.settings.set(game.system.id, LANCER.setting_localization, res);
  }

  static async #onReset(this: LocalizationConfig) {
    this.render(false, { loadDefault: true });
  }

  static async #loadEmpty(this: LocalizationConfig) {
    this.render(false, { loadEmpty: true });
  }

  static async #clearLLPCacheHandler(this: LocalizationConfig, _ev: PointerEvent, _target: HTMLElement) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "lancer.setting.localization.clearCache.title" },
      content: game.i18n.localize("lancer.setting.localization.clearCache.confirm"),
      rejectClose: false,
    });
    if (!confirmed) return;
    await game.settings.set(game.system.id, LANCER.setting_localization_llp_map, {});
    ui.notifications?.info(game.i18n.localize("lancer.setting.localization.clearCache.done"));
    this.render();
  }

  static async #deleteLLPEntryHandler(this: LocalizationConfig, _ev: PointerEvent, target: HTMLElement) {
    const { locale, pack } = target.dataset;
    if (!locale || !pack) return;
    const llpMap = foundry.utils.deepClone(game.settings.get(game.system.id, LANCER.setting_localization_llp_map));
    const packs = llpMap[locale];
    if (!packs || !(pack in packs)) return;
    delete packs[pack];
    // Remove the key once its last LCP is gone
    if (!Object.keys(packs).length) delete llpMap[locale];
    await game.settings.set(game.system.id, LANCER.setting_localization_llp_map, llpMap);
    this.render();
  }
}
