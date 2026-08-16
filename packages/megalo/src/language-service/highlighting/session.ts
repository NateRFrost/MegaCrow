import type { SupportedMegaloVersion } from "src/version";

let highlightVersion: SupportedMegaloVersion | undefined;

/** Run `fn` with the analysis snapshot version available to highlight helpers. */
export const runWithHighlightVersion = <T>(
  version: SupportedMegaloVersion,
  fn: () => T
): T => {
  const previous = highlightVersion;
  highlightVersion = version;
  try {
    return fn();
  } finally {
    highlightVersion = previous;
  }
};

export const getHighlightVersion = (): SupportedMegaloVersion | undefined =>
  highlightVersion;
