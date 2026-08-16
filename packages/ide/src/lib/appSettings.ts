import {
  DEFAULT_EDITOR_THEME_ID,
  normalizeEditorThemeId,
} from "../monaco/theme";

export type UiLocale = "en" | "ja";

export interface AppSettings {
  compilerStrictness: boolean;
  discordRichPresence: boolean;
  editorTheme: string;
  /** When true, wrap long lines; when false, use horizontal scroll. */
  editorWordWrap: boolean;
  gamertag: string;
  /** Diagnostics / hover language (`en` or `ja`). */
  locale: UiLocale;
  mccHotReload: boolean;
  skippedUpdateVersion: string | null;
}

const STORAGE_KEY = "megacrow_settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  discordRichPresence: true,
  mccHotReload: true,
  gamertag: "",
  compilerStrictness: false,
  editorTheme: DEFAULT_EDITOR_THEME_ID,
  editorWordWrap: true,
  locale: "en",
  skippedUpdateVersion: null,
};

export function normalizeUiLocale(value: unknown): UiLocale {
  return value === "ja" ? "ja" : "en";
}

export function readLocalAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_APP_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      discordRichPresence:
        parsed.discordRichPresence ?? DEFAULT_APP_SETTINGS.discordRichPresence,
      mccHotReload: parsed.mccHotReload ?? DEFAULT_APP_SETTINGS.mccHotReload,
      gamertag:
        typeof parsed.gamertag === "string"
          ? parsed.gamertag.slice(0, 16)
          : DEFAULT_APP_SETTINGS.gamertag,
      compilerStrictness:
        parsed.compilerStrictness ?? DEFAULT_APP_SETTINGS.compilerStrictness,
      editorTheme: normalizeEditorThemeId(parsed.editorTheme),
      editorWordWrap:
        typeof parsed.editorWordWrap === "boolean"
          ? parsed.editorWordWrap
          : DEFAULT_APP_SETTINGS.editorWordWrap,
      locale: normalizeUiLocale(parsed.locale),
      skippedUpdateVersion:
        typeof parsed.skippedUpdateVersion === "string"
          ? parsed.skippedUpdateVersion
          : null,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function writeLocalAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
}

/** Sync browser helper; Tauri uses on-disk MegacrowSettings via megacrowSettings.ts. */
export function getAppSettings(): AppSettings {
  return readLocalAppSettings();
}

export function saveAppSettings(settings: AppSettings): void {
  writeLocalAppSettings(settings);
}
