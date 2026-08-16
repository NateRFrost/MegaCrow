import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("play_sound sound slot completion", () => {
  it("suggests megalo sounds after everyone with trailing space", async () => {
    const source = `trigger general
\taction play_sound everyone 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(1);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("infection");
    expect(labels).toContain("slayer");
    expect(labels).toContain("immediate");
  });

  it("filters megalo sounds by prefix when retyping", async () => {
    const source = `trigger general
\taction play_sound everyone inf
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("infection");
    expect(labels).not.toContain("slayer");
  });
});
