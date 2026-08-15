import { invoke } from "@tauri-apps/api/core";
import { normalizeEditorThemeId } from "../monaco/theme";
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  readLocalAppSettings,
  writeLocalAppSettings,
} from "./appSettings";
import { isMegaloVersionId, type MegaloVersionId } from "./megaloShim";
import {
  isOpfsSupported,
  workspaceInputPath,
  workspaceOutputPath,
} from "./opfsStorage";
import { isTauriRuntime } from "./tauriRuntime";
import { isPathInWorkspaceInput, normalizePathKey } from "./workspacePaths";

export { isPathInWorkspaceInput } from "./workspacePaths";

export const MEGACROW_SETTINGS_VERSION = 3;

export interface StoredWorkspace {
  id: string;
  inputPath: string;
  /** Absolute path of the last opened source file in this workspace. */
  lastOpenFilePath: string | null;
  megaloVersion: MegaloVersionId;
  name: string;
  outputPath: string;
}

export interface MegacrowSettings extends AppSettings {
  activeWorkspaceId: string | null;
  version: number;
  workspaces: StoredWorkspace[];
}

export interface DiscoveredWorkspace {
  inputPath: string;
  megaloVersion: string;
  name: string;
  outputPath: string;
}

export function createWorkspaceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultMegacrowSettings(
  prefs: AppSettings = DEFAULT_APP_SETTINGS
): MegacrowSettings {
  return {
    version: MEGACROW_SETTINGS_VERSION,
    activeWorkspaceId: null,
    workspaces: [],
    ...prefs,
  };
}

export function appSettingsFromMegacrow(
  settings: MegacrowSettings
): AppSettings {
  return {
    discordRichPresence: settings.discordRichPresence,
    mccHotReload: settings.mccHotReload,
    gamertag: settings.gamertag,
    compilerStrictness: settings.compilerStrictness,
    editorTheme: normalizeEditorThemeId(settings.editorTheme),
    skippedUpdateVersion: settings.skippedUpdateVersion ?? null,
  };
}

export function mergeAppSettings(
  settings: MegacrowSettings,
  patch: Partial<AppSettings>
): MegacrowSettings {
  return {
    ...settings,
    ...patch,
    gamertag:
      typeof patch.gamertag === "string"
        ? patch.gamertag.slice(0, 16)
        : settings.gamertag,
    editorTheme:
      patch.editorTheme === undefined
        ? settings.editorTheme
        : normalizeEditorThemeId(patch.editorTheme),
    skippedUpdateVersion:
      patch.skippedUpdateVersion === undefined
        ? (settings.skippedUpdateVersion ?? null)
        : patch.skippedUpdateVersion,
  };
}

/** Add discovered workspaces that are not already registered by input path. */
export function mergeDiscoveredWorkspaces(
  existing: StoredWorkspace[],
  discovered: StoredWorkspace[]
): StoredWorkspace[] {
  const seen = new Set(
    existing.map((workspace) => normalizePathKey(workspace.inputPath))
  );
  const merged = [...existing];
  for (const entry of discovered) {
    const key = normalizePathKey(entry.inputPath);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(entry);
  }
  return merged;
}

function normalizeStoredWorkspace(
  raw: Partial<StoredWorkspace> & Record<string, unknown>
): StoredWorkspace | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.inputPath !== "string" ||
    typeof raw.outputPath !== "string"
  ) {
    return null;
  }
  const lastOpenFilePath =
    typeof raw.lastOpenFilePath === "string" && raw.lastOpenFilePath.length > 0
      ? raw.lastOpenFilePath
      : null;
  return {
    id: raw.id,
    name: raw.name,
    megaloVersion: isMegaloVersionId(String(raw.megaloVersion ?? ""))
      ? (raw.megaloVersion as MegaloVersionId)
      : "107-mcc",
    inputPath: raw.inputPath,
    outputPath: raw.outputPath,
    lastOpenFilePath:
      lastOpenFilePath &&
      isPathInWorkspaceInput(lastOpenFilePath, raw.inputPath)
        ? lastOpenFilePath
        : null,
  };
}

export function normalizeMegacrowSettings(
  raw: (Partial<MegacrowSettings> & Record<string, unknown>) | null | undefined
): MegacrowSettings {
  const prefs = {
    discordRichPresence:
      raw?.discordRichPresence ?? DEFAULT_APP_SETTINGS.discordRichPresence,
    mccHotReload: raw?.mccHotReload ?? DEFAULT_APP_SETTINGS.mccHotReload,
    gamertag:
      typeof raw?.gamertag === "string"
        ? raw.gamertag.slice(0, 16)
        : DEFAULT_APP_SETTINGS.gamertag,
    compilerStrictness:
      raw?.compilerStrictness ?? DEFAULT_APP_SETTINGS.compilerStrictness,
    editorTheme: normalizeEditorThemeId(raw?.editorTheme),
    skippedUpdateVersion:
      typeof raw?.skippedUpdateVersion === "string"
        ? raw.skippedUpdateVersion
        : null,
  };
  let workspaces = Array.isArray(raw?.workspaces)
    ? raw.workspaces
        .map((entry) =>
          normalizeStoredWorkspace(
            entry as Partial<StoredWorkspace> & Record<string, unknown>
          )
        )
        .filter((entry): entry is StoredWorkspace => entry !== null)
    : [];
  let activeWorkspaceId =
    typeof raw?.activeWorkspaceId === "string" ? raw.activeWorkspaceId : null;
  if (
    activeWorkspaceId &&
    !workspaces.some((workspace) => workspace.id === activeWorkspaceId)
  ) {
    activeWorkspaceId = null;
  }
  if (!activeWorkspaceId && workspaces.length > 0) {
    activeWorkspaceId = workspaces[0].id;
  }

  // Migrate legacy top-level lastOpenFilePath onto the active workspace once.
  const legacyPath =
    typeof raw?.lastOpenFilePath === "string" && raw.lastOpenFilePath.length > 0
      ? raw.lastOpenFilePath
      : null;
  if (legacyPath && activeWorkspaceId) {
    workspaces = workspaces.map((workspace) => {
      if (workspace.id !== activeWorkspaceId || workspace.lastOpenFilePath) {
        return workspace;
      }
      if (!isPathInWorkspaceInput(legacyPath, workspace.inputPath)) {
        return workspace;
      }
      return { ...workspace, lastOpenFilePath: legacyPath };
    });
  }

  return {
    version: MEGACROW_SETTINGS_VERSION,
    activeWorkspaceId,
    workspaces,
    ...prefs,
  };
}

export async function loadMegacrowSettingsFromDisk(): Promise<MegacrowSettings | null> {
  const raw = await invoke<MegacrowSettings | null>("load_megacrow_settings");
  if (!raw) {
    return null;
  }
  return normalizeMegacrowSettings(raw);
}

export async function saveMegacrowSettingsToDisk(
  settings: MegacrowSettings
): Promise<void> {
  await invoke("save_megacrow_settings", {
    settings: normalizeMegacrowSettings(settings),
  });
}

export async function discoverHrekWorkspaces(): Promise<DiscoveredWorkspace[]> {
  return invoke<DiscoveredWorkspace[]>("discover_hrek_workspaces");
}

export function discoveredToStored(
  discovered: DiscoveredWorkspace[]
): StoredWorkspace[] {
  return discovered.map((entry) => {
    const version = String(entry.megaloVersion ?? "");
    return {
      id: createWorkspaceId(),
      name: entry.name,
      megaloVersion: isMegaloVersionId(version) ? version : "107-mcc",
      inputPath: entry.inputPath,
      outputPath: entry.outputPath,
      lastOpenFilePath: null,
    };
  });
}

/** First-launch bootstrap for Tauri: load or discover and persist. */
export async function bootstrapMegacrowSettings(): Promise<{
  settings: MegacrowSettings;
  needsAddWorkspace: boolean;
}> {
  if (!isTauriRuntime()) {
    const settings = defaultMegacrowSettings(readLocalAppSettings());
    return { settings, needsAddWorkspace: false };
  }

  const raw = await invoke<MegacrowSettings | null>("load_megacrow_settings");
  if (raw) {
    const fileVersion = typeof raw.version === "number" ? raw.version : 0;
    let settings = normalizeMegacrowSettings(raw);
    const shouldRediscover =
      fileVersion < MEGACROW_SETTINGS_VERSION ||
      settings.workspaces.length === 0;
    if (shouldRediscover) {
      const discovered = discoveredToStored(await discoverHrekWorkspaces());
      settings = normalizeMegacrowSettings({
        ...settings,
        workspaces: mergeDiscoveredWorkspaces(settings.workspaces, discovered),
      });
      await saveMegacrowSettingsToDisk(settings);
    }
    return {
      settings,
      needsAddWorkspace: settings.workspaces.length === 0,
    };
  }

  const prefs = readLocalAppSettings();
  const discovered = discoveredToStored(await discoverHrekWorkspaces());
  const settings = normalizeMegacrowSettings({
    ...defaultMegacrowSettings(prefs),
    workspaces: discovered,
    activeWorkspaceId: discovered[0]?.id ?? null,
  });
  await saveMegacrowSettingsToDisk(settings);
  return {
    settings,
    needsAddWorkspace: settings.workspaces.length === 0,
  };
}

export function browserOpfsStoredWorkspace(): StoredWorkspace {
  return {
    id: "opfs",
    name: "Browser",
    megaloVersion: "107-mcc",
    inputPath: workspaceInputPath(),
    outputPath: workspaceOutputPath(),
    lastOpenFilePath: null,
  };
}

export function isBrowserWorkspaceAvailable(): boolean {
  return !isTauriRuntime() && isOpfsSupported();
}

/** Persist settings: disk on Tauri, localStorage prefs on browser. */
export async function persistMegacrowSettings(
  settings: MegacrowSettings
): Promise<void> {
  if (isTauriRuntime()) {
    await saveMegacrowSettingsToDisk(settings);
    return;
  }
  writeLocalAppSettings(appSettingsFromMegacrow(settings));
}
