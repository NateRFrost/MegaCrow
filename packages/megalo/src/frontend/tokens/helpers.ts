import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import type { Tokens } from "src/frontend/tokens";

/// <summary>
/// Returns the location of a span of tokens.
/// </summary>
/// <param name="tokens">The tokens to get the location of.</param>
/// <returns>The location of the span of tokens.</returns>
export const spanLocation = (tokens: Tokens): SourceCodeLocation => {
  const first = tokens[0];
  const last = tokens.at(-1);
  if (!(first && last)) {
    throw new Error("spanLocation requires a non-empty token list");
  }
  return {
    type: SourceLocationType.SOURCE_CODE,
    start: first.location.start,
    end: last.location.end,
  };
};
