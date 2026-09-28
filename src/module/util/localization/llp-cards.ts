import { lookupFoundryTranslation, translationsReady, type TranslationRef } from "./llp-map";

/**
 * Using the indexer, a tail/subpath, and LID, we can create a candidate to get the translation string via `lookupTranslation`
 *
 * @param lid - Everything else are paths from this LID
 * @param title - typically "name"
 * @param effect - typically "effect"
 * @param trigger - typically "trigger"
 * @remarks Expand the params as necessary since it's completely arbitrary anyway; we use hasOwnKey to actually verify existence
 */
export type LocaleFlag = {
  lid: string;
  title?: string | TranslationRef;
  effect?: string | TranslationRef;
  trigger?: string | TranslationRef;
  onAttack?: string | TranslationRef;
  onHit?: string | TranslationRef;
  onCrit?: string | TranslationRef;
};

/**
 * TypeScript's hasOwnProperty/hasOwn but narrows down `key` to `keyof typeof T` so that you can check if any `object` has `key` without TS screaming.
 * @param object
 * @param key
 */
export function hasOwnKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Applies (or restores) translations to chat cards through the `renderChatMessageHTML` hook
 * @param message
 * @param html
 * @param _context
 * @remarks Unlike the other translation functions, the source translation needs to be installed for cards to return to the source translation locale
 */
export async function translateChatCard(
  message: ChatMessage.Implementation,
  html: HTMLElement,
  _context: ChatMessage.MessageData
): Promise<void> {
  const data = message.getFlag("lancer", "localeData");
  if (!data) return;

  await translationsReady; // Hold function until index is built

  // LLP stuff
  const paths = html.querySelectorAll<HTMLElement>("[data-localize]");
  if (paths) {
    for (const path of paths) {
      const subPaths = path.querySelectorAll<HTMLElement>("[data-localize-subpath]");
      if (subPaths.length) {
        // Resolve cards with subpaths like NPC reactions
        // TODO: test NPC reactions
        for (const subPath of subPaths) {
          const localeKey = subPath.dataset.localizeSubpath;
          if (!localeKey || !hasOwnKey(data, localeKey)) continue;

          const translationPath = data[localeKey];
          if (!translationPath) continue;

          const translation = lookupFoundryTranslation(data.lid, translationPath);
          if (translation) subPath.innerHTML = translation;
          console.log("TRANSLATE", data, translation);
        }
      } else {
        // TODO turn into general func and reuse above after testing NPC reactions
        const localeKey = path.dataset.localize; // `data-localize`/`data-localize-subpath` value correlates to a key in `localeData`...
        if (!localeKey || !hasOwnKey(data, localeKey)) continue; // (which are optional)

        const translationPath = data[localeKey]; // ... when combined gives us the localization subpath...
        if (!translationPath) continue;

        const translation = lookupFoundryTranslation(data.lid, translationPath); // ... which we use with the localedata's LID to get the string
        if (translation) path.innerHTML = translation;
        console.log("TRANSLATE", data, localeKey, translationPath, translation);
      }
    }
  }

  // Foundry stuff
  const nativePaths = html.querySelectorAll<HTMLElement>("[data-localize-foundry]");
  if (nativePaths) {
    for (const element of nativePaths) {
      const localeKey = element.dataset.localizeFoundry;
      if (localeKey) element.textContent = game.i18n.localize(localeKey).toUpperCase();
    }
  }
}
