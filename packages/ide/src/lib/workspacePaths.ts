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
