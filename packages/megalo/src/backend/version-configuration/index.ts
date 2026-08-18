import { VersionConfiguration49 } from "src/backend/version-configuration/49";
import { VersionConfiguration73 } from "src/backend/version-configuration/73";
import { VersionConfiguration106 } from "src/backend/version-configuration/106";
import { VersionConfiguration107 } from "src/backend/version-configuration/107";
import { VersionConfiguration107MCC } from "src/backend/version-configuration/107-mcc";
import type { VersionConfiguration } from "src/backend/version-configuration/version_configuration";
import type { SupportedMegaloVersion } from "src/version";

export { VersionConfiguration49 } from "src/backend/version-configuration/49";
export { VersionConfiguration73 } from "src/backend/version-configuration/73";
export { VersionConfiguration106 } from "src/backend/version-configuration/106";
export { VersionConfiguration107 } from "src/backend/version-configuration/107";
export { VersionConfiguration107MCC } from "src/backend/version-configuration/107-mcc";
export type {
  Limits,
  VariableLimits,
} from "src/backend/version-configuration/version_configuration";
export { VersionConfiguration } from "src/backend/version-configuration/version_configuration";

export const getConfigurationForVersion = ({
  version,
  flavour,
}: SupportedMegaloVersion): VersionConfiguration => {
  switch (version) {
    case 107: {
      switch (flavour) {
        case "mcc":
          return new VersionConfiguration107MCC();
        default:
          return new VersionConfiguration107();
      }
    }
    case 106:
      return new VersionConfiguration106();
    case 73:
      return new VersionConfiguration73();
    case 49:
      return new VersionConfiguration49();
  }

  throw new Error(`Unsupported version: ${version}`);
};
