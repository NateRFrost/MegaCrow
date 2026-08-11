import type { ObjectLists } from "../../frontend/object-lists";
import { loadObjectListsForVersion } from "../../load-object-lists";
import { MEGALO_VERSIONS } from "../../version";

/** @deprecated Prefer `loadObjectListsForVersion` from `@megacrow/megalo`. */
export const loadObjectLists = (versionId: string): ObjectLists => {
  const version =
    MEGALO_VERSIONS[versionId as keyof typeof MEGALO_VERSIONS];
  return version ? loadObjectListsForVersion(version) : {};
};
