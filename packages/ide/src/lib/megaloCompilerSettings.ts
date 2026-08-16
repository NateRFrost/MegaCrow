import {
  ALL_MEGACROW_EXTENSIONS,
  DEFAULT_MEGACROW_EXTENSIONS,
  type MegacrowExtensions,
} from "@megacrow/megalo";
import type { AppSettings, CompilerProfile, UiLocale } from "./appSettings";
import { normalizeCreatorGamertag } from "./megaloCompile";
import type { MegaloCompileOptions } from "./megaloIncludeScan";

export interface MegaCrowCompilerSettings {
  creatorGamertag: string;
  locale: UiLocale;
  megacrowExtensions: MegacrowExtensions;
  strictStringLiterals: boolean;
}

export function megacrowExtensionsForProfile(
  profile: CompilerProfile
): MegacrowExtensions {
  return profile === "megaloedit"
    ? DEFAULT_MEGACROW_EXTENSIONS
    : ALL_MEGACROW_EXTENSIONS;
}

export function compilerSettingsFromApp(
  settings: AppSettings
): MegaCrowCompilerSettings {
  return {
    creatorGamertag: normalizeCreatorGamertag(settings.gamertag) || "MegaCrow",
    locale: settings.locale,
    megacrowExtensions: megacrowExtensionsForProfile(settings.compilerProfile),
    strictStringLiterals: settings.compilerStrictness,
  };
}

const DEFAULT_COMPILER_SETTINGS: MegaCrowCompilerSettings =
  compilerSettingsFromApp({
    discordRichPresence: true,
    gamertag: "MegaCrow",
    compilerStrictness: false,
    compilerProfile: "megacrow",
    editorTheme: "megacrow-dark",
    editorWordWrap: true,
    locale: "en",
    skippedUpdateVersion: null,
  });

let appliedCompilerSettings: MegaCrowCompilerSettings = {
  ...DEFAULT_COMPILER_SETTINGS,
};

/** Remember the last synced compiler settings for main-thread compile paths. */
export function applyCompilerSettings(
  settings: MegaCrowCompilerSettings
): void {
  appliedCompilerSettings = settings;
}

export function getAppliedCompilerSettings(): MegaCrowCompilerSettings {
  return appliedCompilerSettings;
}

export function mergeMegaloCompileOptions(
  options: MegaloCompileOptions | undefined,
  compilerSettings?: MegaCrowCompilerSettings
): MegaloCompileOptions | undefined {
  if (!(compilerSettings || options)) {
    return;
  }
  return {
    ...options,
    creatorGamertag:
      normalizeCreatorGamertag(
        compilerSettings?.creatorGamertag ?? options?.creatorGamertag ?? ""
      ) || "MegaCrow",
    strictStringLiterals:
      compilerSettings?.strictStringLiterals ??
      options?.strictStringLiterals ??
      false,
  };
}
