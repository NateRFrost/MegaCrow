import type { SupportedMegaloVersion } from "../version";
import {
  resolveCompilerSettings,
  type CompilerSettings,
} from "./compiler-settings";
import {
  resolveMegacrowExtensions,
  type MegacrowExtensions,
} from "./megacrow-extensions";
import {
  getConfigurationForVersion,
  type VersionConfiguration,
} from "./version-configuration";

export class FrontendContext {
  public readonly megaloVersion: SupportedMegaloVersion;
  public readonly versionConfiguration: VersionConfiguration;
  private _megacrowExtensions: MegacrowExtensions;
  private _compilerSettings: CompilerSettings;

  public constructor(
    megaloVersion: SupportedMegaloVersion,
    megacrowExtensions?: Partial<MegacrowExtensions>,
    compilerSettings?: Partial<CompilerSettings>
  ) {
    this.megaloVersion = megaloVersion;
    this.versionConfiguration = getConfigurationForVersion(megaloVersion);
    this._megacrowExtensions = resolveMegacrowExtensions(megacrowExtensions);
    this._compilerSettings = resolveCompilerSettings(compilerSettings);
  }

  public get megacrowExtensions(): MegacrowExtensions {
    return this._megacrowExtensions;
  }

  public setMegacrowExtensions(
    megacrowExtensions?: Partial<MegacrowExtensions>
  ): void {
    this._megacrowExtensions = resolveMegacrowExtensions(megacrowExtensions);
  }

  public get compilerSettings(): CompilerSettings {
    return this._compilerSettings;
  }

  public setCompilerSettings(
    compilerSettings?: Partial<CompilerSettings>
  ): void {
    this._compilerSettings = resolveCompilerSettings(compilerSettings);
  }
}
