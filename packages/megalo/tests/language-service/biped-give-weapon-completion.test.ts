import { describe, expect, it } from "vitest";
import { ObjectListType } from "../../src/frontend/object-lists";
import {
  analyzeDocument,
  completionsAtPosition,
  getSemanticTokens,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const afterOnLine = (source: string, line: number, needle: string): number => {
  const lineText = source.split(/\n/)[line] ?? "";
  const index = lineText.indexOf(needle);
  expect(index).toBeGreaterThanOrEqual(0);
  return index + needle.length;
};

describe("biped_give_weapon object list UX", () => {
  it("suggests weapons (not general objects) for the weapon slot", async () => {
    const source = `trigger player
\taction biped_give_weapon current_player 
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      objectLists: {
        [ObjectListType.Objects]: [
          "warthog",
          "shotgun",
          "plasma_turret_weapon",
        ],
        [ObjectListType.Weapons]: ["shotgun", "plasma_turret_weapon"],
      },
    });
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character: afterOnLine(source, 1, "current_player "),
    }).map((item) => item.label);

    expect(labels).toContain("shotgun");
    expect(labels).toContain("plasma_turret_weapon");
    expect(labels).not.toContain("warthog");
  });

  it("highlights a quoted weapon as enumMember", async () => {
    const source = `trigger player
\taction biped_give_weapon current_player "plasma_turret_weapon" force
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      objectLists: {
        [ObjectListType.Objects]: ["plasma_turret_weapon"],
        [ObjectListType.Weapons]: ["plasma_turret_weapon"],
      },
    });
    const tokens = getSemanticTokens(snapshot);
    const line = source.split(/\n/)[1] ?? "";
    const weapon = tokens.find(
      (token) =>
        token.line === 1 &&
        token.type === "enumMember" &&
        line.slice(token.startChar, token.startChar + token.length) ===
          '"plasma_turret_weapon"'
    );
    expect(weapon).toBeDefined();
  });
});
