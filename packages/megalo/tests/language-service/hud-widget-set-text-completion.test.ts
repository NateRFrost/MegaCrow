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
  const idx = lineText.indexOf(needle);
  if (idx < 0) {
    throw new Error(`needle not found on line ${line}: ${needle}`);
  }
  return idx + needle.length;
};

describe("hud_widget_set_text operand completion", () => {
  it("continues after HudWidget with space + suggest", async () => {
    const source = `string_table english
\twatermark_label "Watermark"
end
hud_widgets
\twatermark high_center
end
trigger player
\taction hud_widget_set_text 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 7;
    const character = afterOnLine(source, line, "hud_widget_set_text ");
    const items = completionsAtPosition(snapshot, { line, character });
    const watermark = items.find((item) => item.label === "watermark");
    expect(watermark).toBeDefined();
    expect(watermark?.insertText?.endsWith(" ")).toBe(true);
    expect(watermark?.triggerSuggestAfterAccept).toBe(true);
  });

  it("suggests strings after HudWidget and a trailing space", async () => {
    const source = `string_table english
\twatermark_label "Watermark"
end
hud_widgets
\twatermark high_center
end
trigger player
\taction hud_widget_set_text watermark 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 7;
    const character = afterOnLine(source, line, "watermark ");
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(1);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("watermark_label");
  });

  it("suggests strings after HudWidget when end is missing", async () => {
    const source = `string_table english
\twatermark_label "Watermark"
end
hud_widgets
\twatermark high_center
end
trigger player
\taction hud_widget_set_text watermark 
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 7;
    const character = afterOnLine(source, line, "watermark ");
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(1);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("watermark_label");
  });
});
