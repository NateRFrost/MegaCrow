import type { AppSettings, UiLocale } from "./appSettings";
import {
  type MegaloCompileOptions,
  normalizeCreatorGamertag,
} from "./megaloShim";

export interface MegaCrowCompilerSettings {
  creatorGamertag: string;
  locale: UiLocale;
  megacrowExtensions?: {
    targetTeam?: boolean;
  };
  strictStringLiterals: boolean;
}

export function compilerSettingsFromApp(
  settings: AppSettings
): MegaCrowCompilerSettings {
  return {
    creatorGamertag: normalizeCreatorGamertag(settings.gamertag),
    locale: settings.locale,
    strictStringLiterals: settings.compilerStrictness,
  };
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
    creatorGamertag: normalizeCreatorGamertag(
      compilerSettings?.creatorGamertag ?? options?.creatorGamertag ?? ""
    ),
  };
}
