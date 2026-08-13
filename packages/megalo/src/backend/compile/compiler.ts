import { SupportedMegaloVersion } from "../../version";
import type { Diagnostics } from "../../diagnostics";
import type { IR } from "../../frontend/intermediate-representation";
import { CompilerCapabilities } from "./diagnostics/assertCompatibleIR";

export abstract class Compiler {
  public abstract dryRun(ir: IR, diagnostics: Diagnostics): void;
  public abstract writeMegaloFile(ir: IR, diagnostics: Diagnostics): Uint8Array;
  public abstract getCapabilities(): CompilerCapabilities;
  public abstract getMegaloVersion(): SupportedMegaloVersion;
}
