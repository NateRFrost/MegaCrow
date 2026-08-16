import rosetta from "rosetta";
import { getLocale, type SupportedLocale } from "src/localization";
import en from "src/localization/locales/hover/en.json";
import ja from "src/localization/locales/hover/ja.json";

type HoverCatalog = typeof en;

const hoverI18n = rosetta<HoverCatalog>({ en, ja });

const lookup = (locale: SupportedLocale, key: string): string | undefined => {
  hoverI18n.locale(locale);
  const value = hoverI18n.t(key as never);
  if (typeof value !== "string" || value.length === 0 || value === key) {
    return;
  }
  return value;
};

/**
 * Translate hover copy from the dedicated hover locale catalogs
 * (`locales/hover/{en,ja}.json`). Falls back to English when the active
 * locale is missing a key.
 */
export const translateHover = (key: string): string => {
  const locale = getLocale() as SupportedLocale;
  return lookup(locale, key) ?? lookup("en", key) ?? key;
};

export const hoverMessageKey = (
  kind: string,
  id: string,
  leaf: "summary" | `params.${string}`
): string => `${kind}.${id}.${leaf}`;
