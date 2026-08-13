import type { ObjectLists } from "../../src/frontend/object-lists";
import { loadObjectListsForVersion } from "../../src/load-object-lists";
import { MEGALO_VERSIONS } from "../../src/version";

/** @deprecated Prefer `loadObjectListsForVersion` from `@megacrow/megalo`. */
export const loadObjectLists = (versionId: string): ObjectLists => {
  const version =
    MEGALO_VERSIONS[versionId as keyof typeof MEGALO_VERSIONS];
  return version ? loadObjectListsForVersion(version) : {};
};
