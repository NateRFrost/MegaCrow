import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("object_is_type completion", () => {
  it("suggests quoted object-list types for the type parameter", async () => {
    const source = `variables player
\tlocal object holding none
end
trigger player
\tcondition object_is_type local_player "
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 4;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.lastIndexOf('"') + 1;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("condition-operands");
    if (ctx.kind === "condition-operands") {
      expect(ctx.slotIndex).toBe(1);
      expect(ctx.prefix.quoted).toBe(true);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("spartan");
    expect(labels).toContain("elite");
    expect(labels.some((label) => label.startsWith("local_"))).toBe(false);
  });

  it("suggests object references for the first parameter", async () => {
    const source = `trigger player
\tcondition object_is_type 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const character = "\tcondition object_is_type ".length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("local_player");
    expect(labels).not.toContain("spartan");
  });
});
