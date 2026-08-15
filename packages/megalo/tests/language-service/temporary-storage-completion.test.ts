import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("temporary storage type completion", () => {
  it("suggests storage types when cursor is on an existing type", async () => {
    const source = `trigger general
\ttemporary player player_holding_bomb none
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const storageStart = lineText.indexOf("player ");
    expect(storageStart).toBeGreaterThan(-1);

    for (const character of [
      storageStart,
      storageStart + 3,
      storageStart + 6,
    ]) {
      const ctx = resolveCompletionContext(snapshot, { line, character });
      expect(ctx.kind).toBe("temporary");
      if (ctx.kind === "temporary") {
        expect(ctx.slotIndex).toBe(0);
      }
      const labels = completionsAtPosition(snapshot, { line, character }).map(
        (item) => item.label
      );
      expect(labels, `at character ${character}`).toEqual(
        expect.arrayContaining(["number", "player", "object", "team"])
      );
    }
  });

  it("suggests storage types while replacing a partial/invalid type", async () => {
    const source = `trigger general
\ttemporary pla player_holding_bomb none
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("pla") + 3;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("temporary");
    if (ctx.kind === "temporary") {
      expect(ctx.slotIndex).toBe(0);
    }
    const items = completionsAtPosition(snapshot, { line, character });
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining(["number", "player", "object", "team"])
    );
    expect(items.every((item) => item.filterText === "pla")).toBe(true);
  });
});
