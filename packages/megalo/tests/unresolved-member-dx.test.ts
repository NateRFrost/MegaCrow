import { describe, expect, it } from "vitest";
import { compileSource } from "../src/compile-source";
import { SourceLocationType } from "../src/diagnostics";
import { analyzeDocument, getSemanticTokens } from "../src/language-service";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const source = `variables player
\tnetworked object ride none
end
trigger player
\taction set ride.rider = current_player
\taction set ride.team = current_player.team
end
`;

describe("unresolved member DX and highlight", () => {
  it("puts the unresolved-identifier error on the member token only", async () => {
    const result = await compileSource(source, { version });
    const error = result.diagnostics.find((d) =>
      d.message.includes("ride.'rider'")
    );
    expect(error).toBeDefined();
    expect(error!.message).toContain("Unresolved identifier ride.'rider'");
    expect(error!.location.type).toBe(SourceLocationType.SOURCE_CODE);
    if (error!.location.type !== SourceLocationType.SOURCE_CODE) {
      return;
    }
    const span = source.slice(
      error!.location.start.localOffset,
      error!.location.end.localOffset
    );
    expect(span).toBe("rider");
  });

  it("does not property-highlight an unresolved member", async () => {
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const riderProperty = tokens.find(
      (token) =>
        token.type === "property" &&
        snapshot.source.slice(
          snapshot.lineStarts[token.line]! + token.startChar,
          snapshot.lineStarts[token.line]! + token.startChar + token.length
        ) === "rider"
    );
    expect(riderProperty).toBeUndefined();

    const teamProperty = tokens.find(
      (token) =>
        token.type === "property" &&
        snapshot.source.slice(
          snapshot.lineStarts[token.line]! + token.startChar,
          snapshot.lineStarts[token.line]! + token.startChar + token.length
        ) === "team"
    );
    expect(teamProperty).toBeDefined();
  });
});
