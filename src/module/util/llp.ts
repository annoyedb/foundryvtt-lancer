import { type PackedLanguagePatchWrapper } from "./unpacking/packed-types";

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
