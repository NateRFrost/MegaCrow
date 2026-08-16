import { describe, expect, it } from "vitest";
import {
  LOCALE_TO_STRING_TABLE_LANGUAGE,
  pickStringTableText,
  stringTableLanguageForLocale,
  stringTableLanguageIndex,
} from "../src/localization/string-table-locale";

describe("string-table locale mapper", () => {
  it("maps known UI locales to string-table languages", () => {
    expect(stringTableLanguageForLocale("en")).toBe("english");
    expect(stringTableLanguageForLocale("ja")).toBe("japanese");
    expect(LOCALE_TO_STRING_TABLE_LANGUAGE.ja).toBe("japanese");
  });

  it("falls back to english for unknown locales", () => {
    expect(stringTableLanguageForLocale("de")).toBe("english");
  });

  it("returns language indices matching STRING_TABLE_LANGUAGES order", () => {
    expect(stringTableLanguageIndex("english")).toBe(0);
    expect(stringTableLanguageIndex("japanese")).toBe(1);
  });

  it("prefers the locale language when present", () => {
    expect(
      pickStringTableText({ english: "Assault", japanese: "アサルト" }, "ja")
    ).toBe("アサルト");
    expect(
      pickStringTableText({ english: "Assault", japanese: "アサルト" }, "en")
    ).toBe("Assault");
  });

  it("falls back to english when preferred language is empty", () => {
    expect(
      pickStringTableText({ english: "Assault", japanese: "" }, "ja")
    ).toBe("Assault");
    expect(pickStringTableText({ english: "Assault" }, "ja")).toBe("Assault");
  });

  it("falls back to any non-empty language after english", () => {
    expect(
      pickStringTableText({ german: "Angriff", french: "Assaut" }, "ja")
    ).toBe("Angriff");
  });
});
