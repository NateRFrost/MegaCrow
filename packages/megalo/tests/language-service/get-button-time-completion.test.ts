import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("get_button_time button slot completion", () => {
  it("suggests buttons after player with trailing space", async () => {
    const source = `trigger player
\taction get_button_time current_player 
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
    expect(labels).toContain("jump");
    expect(labels).toContain("melee_attack");
    expect(labels.length).toBeGreaterThanOrEqual(10);
  });
});
