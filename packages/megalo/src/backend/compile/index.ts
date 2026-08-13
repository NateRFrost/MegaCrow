import type { SupportedMegaloVersion } from "src/version";
import { Compiler107MCC } from "src/backend/compile/107-mcc";
import type { Compiler } from "src/backend/compile/compiler";

export { Compiler } from "src/backend/compile/compiler";

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
          throw new Error(`Unsupported flavour: ${flavour}`);
      }
    }
  }

  throw new Error(`Unsupported version: ${version}`);
};
