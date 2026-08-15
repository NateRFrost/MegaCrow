import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const readUtf16le = (path: string): string => {
  const buf = readFileSync(path);
  const text = buf.toString("utf16le");
  return text.charCodeAt(0) === 0xfe_ff ? text.slice(1) : text;
};

describe("delete_object completion", () => {
  it("suggests objects after incomplete delete_object before end", async () => {
    const source = `variables global
\tnetworked object the_flag none
end
trigger initialization
\taction delete_object 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 4;
    const character = (source.split(/\n/)[line] ?? "").length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.statement.name.value).toBe("delete_object");
      expect(ctx.slotIndex).toBe(0);
      expect(ctx.statement.parameters).toHaveLength(0);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("the_flag");
    expect(labels).toContain("none");
    expect(labels).toContain("target_object");
  });

  it("suggests objects when next line is another action", async () => {
    const source = `variables global
\tnetworked object the_flag none
end
trigger initialization
\taction delete_object 
\taction object_set_invincibility the_flag 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 4;
    const character = (source.split(/\n/)[line] ?? "").length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );

    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(0);
      expect(ctx.statement.name.value).toBe("delete_object");
      expect(ctx.statement.parameters).toHaveLength(0);
    }
    expect(labels).toContain("the_flag");
  });

  it("suggests at EOF after delete_object without crashing parse", async () => {
    const source = `variables global
\tnetworked object the_flag none
end
trigger initialization
\taction delete_object `;
    const snapshot = await analyzeDocument(source, { version });
    const line = 4;
    const character = (source.split(/\n/)[line] ?? "").length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(ctx.kind).toBe("action-operands");
    expect(labels).toContain("the_flag");
  });

  it("suggests objects in 3nvasion_spire after delete_object", async () => {
    const spirePath =
      "C:/Program Files (x86)/Steam/steamapps/common/HREK/data/multiplayer/megalo/3nvasion_spire.txt";
    const original = readUtf16le(spirePath);
    const lines = original.split(/\r?\n/);
    const insertAt = lines.findIndex((line) =>
      line.includes("object_set_invincibility")
    );
    expect(insertAt).toBeGreaterThan(0);
    const needle = "\taction delete_object ";
    lines.splice(insertAt, 0, needle);
    const source = lines.join("\n");
    const line = insertAt;
    const character = needle.length;

    const snapshot = await analyzeDocument(source, { version });
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );

    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(0);
      expect(ctx.statement.name.value).toBe("delete_object");
    }
    expect(labels).toContain("the_flag");
    expect(labels).toContain("none");
    expect(labels).toContain("current_object");
  });
});
