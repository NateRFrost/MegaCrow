import { SupportedMegaloVersion } from "src/version";
import type { Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import { CompilerCapabilities } from "src/backend/compile/diagnostics/assertCompatibleIR";

export abstract class Compiler {
  public abstract dryRun(ir: IR, diagnostics: Diagnostics): void;
  public abstract writeMegaloFile(ir: IR, diagnostics: Diagnostics): Uint8Array;
  public abstract getCapabilities(): CompilerCapabilities;
  public abstract getMegaloVersion(): SupportedMegaloVersion;
}
