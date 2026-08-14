import type { CompilerCapabilities } from "src/backend/compile/diagnostics/assertCompatibleIR";
import type { Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import { StringTableLanguage } from "src/frontend/language-configuration/omni/strings";
import type { SupportedMegaloVersion } from "src/version";

export enum EngineIcon {
  CaptureTheFlag = 0,
  Slayer = 1,
  Oddball = 2,
  KingOfTheHill = 3,
  Juggernaut = 4,
  Territories = 5,
  Assault = 6,
  Infection = 7,
  VIP = 8,
  Invasion = 9,
  InvasionSlayer = 10,
  Stockpile = 11,
  ActionSack = 12,
  Race = 13,
  RocketRace = 14,
  Grifball = 15,
  Soccer = 16,
  Headhunter = 17,
  Crosshair = 18,
  Wheel = 19,
  Swirl = 20,
  Bunker = 21,
  Healthpack = 22,
  Towershield = 23,
  Return = 24,
  PreGameWarmUp = 25,
  Cartographer = 26,
  Eightball = 27,
  Spartan = 28,
  Elite = 29,
  Attack = 30,
}

export type CompiledMegaloMetadata = {
  name?: Record<StringTableLanguage, string>;
  description?: Record<StringTableLanguage, string>;
  engineIcon?: EngineIcon;
};

export abstract class Compiler {
  public abstract dryRun(
    ir: IR,
    diagnostics: Diagnostics
  ): { metadata: CompiledMegaloMetadata };
  public abstract writeMegaloFile(
    ir: IR,
    diagnostics: Diagnostics
  ): { data: Uint8Array; metadata: CompiledMegaloMetadata };
  public abstract getCapabilities(): CompilerCapabilities;
  public abstract getMegaloVersion(): SupportedMegaloVersion;
}
