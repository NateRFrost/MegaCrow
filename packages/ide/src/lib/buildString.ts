/** Matches CI build tags: `{seq}.{yy}.{mm}.{dd}.{hhmm}.{branch}` */
export const BUILD_TAG_RE = /^(\d+)\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{4})\.(.+)$/;

export function parseBuildSeq(buildString: string): number | null {
  if (buildString === "untracked version") {
    return null;
  }
  const match = BUILD_TAG_RE.exec(buildString.trim());
  if (!match) {
    return null;
  }
  const seq = Number.parseInt(match[1], 10);
  return Number.isFinite(seq) ? seq : null;
}

export function isNewerBuild(
  candidateTag: string,
  currentBuildString: string
): boolean {
  const candidate = parseBuildSeq(candidateTag);
  const current = parseBuildSeq(currentBuildString);
  if (candidate === null || current === null) {
    return false;
  }
  return candidate > current;
}
