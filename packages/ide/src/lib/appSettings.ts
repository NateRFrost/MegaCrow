import {
  DEFAULT_EDITOR_THEME_ID,
  normalizeEditorThemeId,
} from "../monaco/theme";

export interface AppSettings {
  compilerStrictness: boolean;
  discordRichPresence: boolean;
  editorTheme: string;
  gamertag: string;
  mccHotReload: boolean;
}

const STORAGE_KEY = "megacrow_settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  discordRichPresence: true,
  mccHotReload: true,
  gamertag: "",
  compilerStrictness: false,
  editorTheme: DEFAULT_EDITOR_THEME_ID,
};

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
