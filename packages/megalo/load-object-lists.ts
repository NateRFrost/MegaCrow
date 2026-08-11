import type { ObjectLists } from "./frontend/object-lists";
import objectListsHaloReachMccDefault from "./object-lists/haloreach_mcc/default/index";
import type { SupportedMegaloVersion } from "./version";

/** Bundled object lists for a Megalo compile target. */
export const loadObjectListsForVersion = (
  version: SupportedMegaloVersion
): ObjectLists => {
  if (version.version === 107 && version.flavour === "mcc") {
    return objectListsHaloReachMccDefault;
  }
  return {};
};
