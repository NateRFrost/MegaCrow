import type { AppSettings } from "./appSettings";
import {
  type MegaloCompileOptions,
  normalizeCreatorGamertag,
} from "./megaloShim";

export interface MegaCrowCompilerSettings {
  creatorGamertag: string;
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
