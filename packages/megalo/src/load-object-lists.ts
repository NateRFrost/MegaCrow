import type { ObjectLists } from "src/frontend/object-lists";
import objectListsHaloReachAlphaDefault from "src/object-lists/haloreach/alpha/default/index";
import objectListsHaloReachBetaDefault from "src/object-lists/haloreach/beta/default/index";
import objectListsHaloReachReleaseDefault from "src/object-lists/haloreach/release/default/index";
import objectListsHaloReachMccDefault from "src/object-lists/haloreach_mcc/default/index";
import type { SupportedMegaloVersion } from "src/version";

/** Bundled object lists for a Megalo compile target. */
export const loadObjectListsForVersion = (
  version: SupportedMegaloVersion
): ObjectLists => {
  if (version.version === 107 && version.flavour === "mcc") {
    return objectListsHaloReachMccDefault;
  }

  // TU1 (107) did not change object lists from Release (106).
  if (version.version === 107 || version.version === 106) {
    return objectListsHaloReachReleaseDefault;
  }

  if (version.version === 73) {
    return objectListsHaloReachBetaDefault;
  }

  if (version.version === 49) {
    return objectListsHaloReachAlphaDefault;
  }

  return {};
};
