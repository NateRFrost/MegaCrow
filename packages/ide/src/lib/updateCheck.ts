import { isNewerBuild, parseBuildSeq } from "./buildString";
import { MEGACROW_BUILD_STRING } from "./megaloShim";
import { isTauriRuntime } from "./tauriRuntime";

const GITHUB_REPO = "craftycodie/MegaCrow";
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/** Latest GitHub Release page (redirects to the newest non-prerelease). */
export const GITHUB_LATEST_RELEASE_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`;

export interface GithubReleaseInfo {
  htmlUrl: string;
  name: string;
  tagName: string;
}

interface GithubReleaseApiResponse {
  draft?: boolean;
  html_url?: string;
  name?: string | null;
  prerelease?: boolean;
  tag_name?: string;
}

export async function fetchLatestGithubRelease(): Promise<GithubReleaseInfo | null> {
  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as GithubReleaseApiResponse;
    if (!(data.tag_name && data.html_url) || data.draft) {
      return null;
    }
    return {
      tagName: data.tag_name,
      htmlUrl: data.html_url,
      name: data.name?.trim() || data.tag_name,
    };
  } catch {
    return null;
  }
}

export type UpdateCheckResult =
  | { kind: "available"; release: GithubReleaseInfo }
  | { kind: "none" };

/**
 * Returns an available update when running a tracked Tauri build and GitHub
 * has a newer release tag than the current build string.
 * Releases are published manually; CI only builds/tags and does not create them.
 */
export async function checkForAppUpdate(options: {
  currentBuildString?: string;
  skippedUpdateVersion?: string | null;
}): Promise<UpdateCheckResult> {
  if (!isTauriRuntime()) {
    return { kind: "none" };
  }

  const currentBuildString =
    options.currentBuildString ?? MEGACROW_BUILD_STRING;
  if (parseBuildSeq(currentBuildString) === null) {
    return { kind: "none" };
  }

  const release = await fetchLatestGithubRelease();
  if (!release) {
    return { kind: "none" };
  }

  if (options.skippedUpdateVersion === release.tagName) {
    return { kind: "none" };
  }

  if (!isNewerBuild(release.tagName, currentBuildString)) {
    return { kind: "none" };
  }

  return { kind: "available", release };
}
