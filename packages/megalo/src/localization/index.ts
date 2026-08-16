import rosetta from "rosetta";
import en from "src/localization/locales/en.json";
import ja from "src/localization/locales/ja.json";
import {
  type LocaleWithStringTable,
  pickStringTableText,
} from "src/localization/string-table-locale";

export type SupportedLocale = "en" | "ja";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "ja"];

// Keep SupportedLocale and the string-table locale map in lockstep.
type AssertLocaleMapComplete = SupportedLocale extends LocaleWithStringTable
  ? LocaleWithStringTable extends SupportedLocale
    ? true
    : never
  : never;
const _localeMapComplete: AssertLocaleMapComplete = true;
void _localeMapComplete;

type LocaleCatalog = typeof en;

const i18n = rosetta<LocaleCatalog>({ en, ja });
i18n.locale("en");

export const getLocale = (): SupportedLocale =>
  i18n.locale() as SupportedLocale;

export const setLocale = (locale: SupportedLocale): void => {
  i18n.locale(locale);
};

export const translate = (
  key: keyof LocaleCatalog,
  params?: Record<string, string | number>
): string => i18n.t(key, params);

export const formatAlternatives = (alternatives: readonly string[]): string => {
  if (alternatives.length === 0) {
    return "";
  }
  if (alternatives.length === 1) {
    return alternatives[0]!;
  }

  const locale = getLocale();
  const last = alternatives.at(-1)!;
  const rest = alternatives.slice(0, -1);

  if (locale === "ja") {
    return `${rest.join("、")}、または ${last}`;
  }

  if (alternatives.length === 2) {
    return `${rest[0]} or ${last}`;
  }

  return `${rest.join(", ")}, or ${last}`;
};

/** Prefer the active compiler/UI locale when reading a string-table entry. */
export const pickLocalizedStringTableText = (
  entry: Parameters<typeof pickStringTableText>[0]
): string => pickStringTableText(entry, getLocale());

export {
  isLocaleWithStringTable,
  LOCALE_TO_STRING_TABLE_LANGUAGE,
  type LocaleWithStringTable,
  pickStringTableText,
  stringTableLanguageForLocale,
  stringTableLanguageIndex,
} from "src/localization/string-table-locale";
