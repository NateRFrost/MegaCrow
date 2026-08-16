import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("player trait value completion", () => {
  it("suggests trait options inside an empty override body", async () => {
    const source = `game_options
\toverride base_player_traits
\t\t
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const labels = completionsAtPosition(snapshot, {
      line: 2,
      character: source.split(/\n/)[2]!.length,
    }).map((item) => item.label);
    expect(labels).toContain("initial_primary_weapon");
    expect(labels).toContain("damage_resistance");
    expect(labels).not.toContain("override");
    expect(labels).not.toContain("option");
  });

  it("suggests weapons at the exclusive end of a partial weapon token", async () => {
    const source = `game_options
\toverride base_player_traits
\t\tinitial_primary_weapon dmr
\t\tinitial_primary_weapon ass
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 3;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("ass") + "ass".length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels, JSON.stringify({ lineText, character, labels })).toContain(
      "assault_rifle"
    );
    expect(labels).not.toContain("assassination_immunity");
  });
});
