import { Compiler106 } from "src/backend/compile/106";
import { packMgloBytes as packMgloBytes106 } from "src/backend/compile/106/pack";
import { Compiler107 } from "src/backend/compile/107";
import { packMgloBytes as packMgloBytes107 } from "src/backend/compile/107/pack";
import { Compiler107MCC } from "src/backend/compile/107-mcc";
import { packMgloBytes as packMgloBytes107Mcc } from "src/backend/compile/107-mcc/pack";
import type {
  CompiledMegaloFileType,
  Compiler,
} from "src/backend/compile/compiler";
import type { SupportedMegaloVersion } from "src/version";

export {
  type CompiledMegaloFileType,
  type CompiledMegaloMetadata,
  Compiler,
  EngineIcon,
  type WriteMegaloFileOptions,
  type WriteMegaloFileResult,
} from "src/backend/compile/compiler";

export const getCompilerForVersion = ({
  version,
  flavour,
}: SupportedMegaloVersion): Compiler => {
  switch (version) {
    case 107: {
      switch (flavour) {
        case "mcc":
          return new Compiler107MCC();
        default:
          return new Compiler107();
      }
    }
    case 106:
      return new Compiler106();
  }

  throw new Error(`Unsupported version: ${version}`);
};

/** Re-wrap an already-compiled `.mglo` into `mpvr` or `gvar` for the version. */
export const packMgloBytesForVersion = (
  mgloBytes: Uint8Array,
  version: SupportedMegaloVersion,
  fileType: Exclude<CompiledMegaloFileType, "mglo">
): Uint8Array => {
  switch (version.version) {
    case 107:
      return version.flavour === "mcc"
        ? packMgloBytes107Mcc(mgloBytes, fileType)
        : packMgloBytes107(mgloBytes, fileType);
    case 106:
      return packMgloBytes106(mgloBytes, fileType);
    default:
      throw new Error(`Unsupported version: ${version.version}`);
  }
};
