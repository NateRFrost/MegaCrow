/** True when a workspace-relative or absolute path is under `object_lists/`. */
export function isObjectListsPath(
  path: string | string[] | null | undefined
): boolean {
  if (!path) {
    return false;
  }
  const parts = Array.isArray(path)
    ? path
    : path.replace(/\\/g, "/").split("/");
  return parts.some((part) => part.toLowerCase() === "object_lists");
}

export function isObjectListsDirectoryName(name: string): boolean {
  return name.toLowerCase() === "object_lists";
}
