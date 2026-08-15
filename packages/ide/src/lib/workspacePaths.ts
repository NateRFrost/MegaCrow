/** Normalize path for case-insensitive Windows-friendly comparisons. */
export function normalizePathKey(path: string): string {
  return path.replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase();
}

/** True when `filePath` is under the workspace input root (or equal to it). */
export function isPathInWorkspaceInput(
  filePath: string,
  workspaceInputPath: string
): boolean {
  const file = normalizePathKey(filePath);
  const root = normalizePathKey(workspaceInputPath);
  return file === root || file.startsWith(`${root}\\`);
}

/** If scripts path is .../data/multiplayer/megalo, suggest sibling maps/megalo. */
export function guessOutputPathFromScripts(scriptsPath: string): string | null {
  const normalized = scriptsPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const marker = "/data/multiplayer/megalo";
  const lower = normalized.toLowerCase();
  const index = lower.lastIndexOf(marker);
  if (index < 0 || index + marker.length !== lower.length) {
    return null;
  }
  const root = normalized.slice(0, index);
  const suggested = `${root}/maps/megalo`;
  return scriptsPath.includes("\\")
    ? suggested.replace(/\//g, "\\")
    : suggested;
}
