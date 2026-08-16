import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("end keyword in open blocks", () => {
  it.each([
    {
      name: "trigger",
      source: `trigger player
\t
`,
    },
    {
      name: "game_options",
      source: `game_options
\t
`,
    },
    {
      name: "variables",
      source: `variables global
\t
`,
    },
    {
      name: "loadout_palette",
      source: `loadout_palette foo
\t
`,
    },
    {
      name: "begin",
      source: `trigger player
\tbegin
\t\t
end
`,
      line: 2,
      character: 2,
    },
  ])("suggests end inside open $name block", async ({
    source,
    line,
    character,
  }) => {
    const snapshot = await analyzeDocument(source, { version });
    const pos = {
      line: line ?? 1,
      character: character ?? 1,
    };
    const ctx = resolveCompletionContext(snapshot, pos);
    const labels = completionsAtPosition(snapshot, pos).map(
      (item) => item.label
    );
    expect(labels, `ctx=${ctx.kind}`).toContain("end");
  });

  it("does not keep a closed block open after end", async () => {
    const source = `trigger player
\taction set_score add 1 everyone
end

`;
    const snapshot = await analyzeDocument(source, { version });
    const pos = { line: 3, character: 0 };
    const ctx = resolveCompletionContext(snapshot, pos);
    expect(ctx.kind).toBe("top-level");
    const labels = completionsAtPosition(snapshot, pos).map(
      (item) => item.label
    );
    expect(labels).not.toContain("end");
  });
});
