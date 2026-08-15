import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const afterOnLine = (source: string, line: number, needle: string): number => {
  const lineText = source.split(/\n/)[line]!;
  const index = lineText.indexOf(needle);
  if (index < 0) {
    throw new Error(`needle not found: ${needle}`);
  }
  return index + needle.length;
};

describe("create_object completion past type", () => {
  it("suggests at/set after quoted object type", async () => {
    const source = `trigger initialization
\taction create_object "banshee" 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, '"banshee" ');
    const ctx = resolveCompletionContext(snapshot, { line: 1, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(1);
      expect(ctx.statement.parameters).toHaveLength(1);
      expect(ctx.prefix.quoted).toBe(false);
      expect(ctx.prefix.text).toBe("");
    }
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("at");
    expect(labels).toContain("set");
    expect(labels).toContain("never_garbage");
  });

  it("suggests object refs after at", async () => {
    const source = `variables global
\tlocal object ride none
end
trigger player
\taction create_object "banshee" at 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 4, "at ");
    const labels = completionsAtPosition(snapshot, {
      line: 4,
      character,
    }).map((item) => item.label);
    expect(labels, JSON.stringify(labels)).toContain("ride");
    expect(labels).toContain("current_player");
  });

  it("suggests keywords after full at clause", async () => {
    const source = `trigger player
\taction create_object "banshee" at current_player 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, "current_player ");
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("set");
    expect(labels).toContain("never_garbage");
  });

  it("still treats an open quote as a quoted prefix", async () => {
    const source = `trigger initialization
\taction create_object "ban
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, '"ban');
    const ctx = resolveCompletionContext(snapshot, { line: 1, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.prefix.quoted).toBe(true);
      expect(ctx.prefix.text).toBe("ban");
    }
  });
});
