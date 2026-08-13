import type { SupportedMegaloVersion } from "src/version";
import { VersionConfiguration107MCC } from "src/backend/version-configuration/107-mcc";
import { VersionConfiguration } from "src/backend/version-configuration/version_configuration";

export type { Limits, VariableLimits } from "src/backend/version-configuration/version_configuration";
export { VersionConfiguration } from "src/backend/version-configuration/version_configuration";
export { VersionConfiguration107MCC } from "src/backend/version-configuration/107-mcc";

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
          throw new Error(`Unsupported flavour: ${flavour}`);
      }
    }
  }

  throw new Error(`Unsupported version: ${version}`);
};
