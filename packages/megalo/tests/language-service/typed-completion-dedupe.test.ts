import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("typed completion dedupe", () => {
  it("lists local_player only once when Player and Object slots are unioned", async () => {
    const source = `trigger player
\taction set 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character: "\taction set ".length,
    }).map((item) => item.label);
    expect(labels.filter((label) => label === "local_player")).toHaveLength(1);
    expect(labels.filter((label) => label === "current_player")).toHaveLength(
      1
    );
    expect(labels.filter((label) => label === "none")).toHaveLength(1);
  });
});
