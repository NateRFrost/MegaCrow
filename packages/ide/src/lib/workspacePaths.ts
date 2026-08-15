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

/** HREK install root when scripts path is `…/data/multiplayer/megalo`. */
export function guessHrekRootFromScripts(scriptsPath: string): string | null {
  const normalized = scriptsPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const marker = "/data/multiplayer/megalo";
  const lower = normalized.toLowerCase();
  const index = lower.lastIndexOf(marker);
  if (index < 0 || index + marker.length !== lower.length) {
    return null;
  }
  const root = normalized.slice(0, index);
  return scriptsPath.includes("\\") ? root.replace(/\//g, "\\") : root;
}

/**
 * Parse `displayName` (preferred) or `name` from an HREK `project.xml` body.
 */
export function parseProjectXmlDisplayName(xml: string): string | null {
  for (const attr of ["displayName", "name"] as const) {
    const match = new RegExp(`${attr}\\s*=\\s*"([^"]+)"`, "i").exec(xml);
    const value = match?.[1]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}
