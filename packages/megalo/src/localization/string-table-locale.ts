import {
  STRING_TABLE_LANGUAGES,
  type StringTableLanguage,
} from "src/frontend/language-configuration/omni/strings";

/**
 * Maps UI / compiler locales (`en`, `ja`, …) to Megalo string-table language
 * slots. Extend this map when adding a new IDE locale that has a matching
 * string-table language.
 */
export const LOCALE_TO_STRING_TABLE_LANGUAGE = {
  en: "english",
  ja: "japanese",
} as const satisfies Record<string, StringTableLanguage>;

export type LocaleWithStringTable =
  keyof typeof LOCALE_TO_STRING_TABLE_LANGUAGE;

export const isLocaleWithStringTable = (
  locale: string
): locale is LocaleWithStringTable =>
  Object.hasOwn(LOCALE_TO_STRING_TABLE_LANGUAGE, locale);

/** Resolve the string-table language for a UI/compiler locale (default: english). */
export const stringTableLanguageForLocale = (
  locale: string
): StringTableLanguage =>
  isLocaleWithStringTable(locale)
    ? LOCALE_TO_STRING_TABLE_LANGUAGE[locale]
    : "english";

/** 0-based index into `STRING_TABLE_LANGUAGES` / BLF language rows. */
export const stringTableLanguageIndex = (
  language: StringTableLanguage
): number => STRING_TABLE_LANGUAGES.indexOf(language);

/**
 * Pick display text from a localized string-table entry.
 * Prefer the locale's language when non-empty, then english, then any other
 * non-empty language in table order.
 */
export const pickStringTableText = (
  entry: Partial<Record<StringTableLanguage, string>> | null | undefined,
  locale: string
): string => {
  if (!entry) {
    return "";
  }

  const preferred = stringTableLanguageForLocale(locale);
  const preferredText = entry[preferred]?.trim();
  if (preferredText) {
    return preferredText;
  }

  const english = entry.english?.trim();
  if (english) {
    return english;
  }

  for (const language of STRING_TABLE_LANGUAGES) {
    const text = entry[language]?.trim();
    if (text) {
      return text;
    }
  }

  return "";
};
