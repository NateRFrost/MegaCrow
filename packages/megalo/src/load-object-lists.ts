import type { ObjectLists } from "src/frontend/object-lists";
import objectListsHaloReachMccDefault from "src/object-lists/haloreach_mcc/default/index";
import type { SupportedMegaloVersion } from "src/version";

/** Bundled object lists for a Megalo compile target. */
export const loadObjectListsForVersion = (
  version: SupportedMegaloVersion
): ObjectLists => {
  if (version.version === 107 || version.version === 106) {
    return objectListsHaloReachMccDefault;
  }
  return {};
};
