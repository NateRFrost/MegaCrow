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
    throw new Error(
      `needle not found: ${JSON.stringify(needle)} in ${JSON.stringify(lineText)}`
    );
  }
  return index + needle.length;
};

describe("engine_data name completion", () => {
  const source = `string_table
\tarena_slayer_title
\t\teng "Slayer"
\tend
\tarena_other_title
\t\teng "Other"
\tend
end
engine_data
\tname arena_slayer_title
\ticon k_engine_icon_slayer
\tcategory slayer
end
`;

  it("suggests strings when cursor is on an existing name value", async () => {
    const snapshot = await analyzeDocument(source, { version });
    const line = 9;
    const lineText = source.split(/\n/)[line]!;
    const valueStart = lineText.indexOf("arena_slayer_title");
    for (const character of [
      valueStart,
      valueStart + 5,
      valueStart + "arena_slayer_title".length,
    ]) {
      const ctx = resolveCompletionContext(snapshot, { line, character });
      expect(ctx.kind, `ch=${character}`).toBe("element");
      const labels = completionsAtPosition(snapshot, { line, character }).map(
        (item) => item.label
      );
      expect(
        labels,
        `ch=${character} labels=${JSON.stringify(labels)}`
      ).toContain("arena_other_title");
      expect(labels).toContain("arena_slayer_title");
    }
    const atEnd = valueStart + "arena_slayer_title".length;
    const endItems = completionsAtPosition(snapshot, {
      line,
      character: atEnd,
    });
    expect(
      endItems.every((item) => item.filterText === "arena_slayer_title")
    ).toBe(true);
  });

  it("suggests strings after name keyword", async () => {
    const emptyName = `string_table
\tarena_slayer_title
\t\teng "Slayer"
\tend
end
engine_data
\tname 
end
`;
    const snapshot = await analyzeDocument(emptyName, { version });
    const labels = completionsAtPosition(snapshot, {
      line: 6,
      character: afterOnLine(emptyName, 6, "name "),
    }).map((item) => item.label);
    expect(labels).toContain("arena_slayer_title");
  });
});
