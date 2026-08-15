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

describe("completion gaps: trigger name + last operand", () => {
  it("suggests trigger kinds when editing the trigger name", async () => {
    const source = `trigger invasion_vehicle
\taction delete_object none
end
`;
    const snapshot = await analyzeDocument(source, { version });
    // Cursor at start of the name (replacing / Ctrl+Space on the kind)
    const line = 0;
    const character = "trigger ".length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(ctx.kind).toBe("trigger-name");
    expect(labels).toContain("player");
    expect(labels).toContain("initialization");
    expect(labels).toContain("object");
  });

  it("suggests trigger kinds after trigger keyword with empty name prefix", async () => {
    const source = "trigger ";
    const snapshot = await analyzeDocument(source, { version });
    const line = 0;
    const character = "trigger ".length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(ctx.kind).toBe("trigger-name");
    expect(labels).toContain("player");
  });

  it("suggests number vars when cursor is at end of last object_get_distance operand", async () => {
    const source = `variables global
\tlocal number distance_to_player 0
\tlocal number other_dist 0
end
trigger object
\taction object_get_distance current_object current_player distance_to_player
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 5;
    const lineText = source.split(/\n/)[line]!;
    // Cursor at end of the last operand — must stay on slot 2 (not "next" slot 3).
    const character = lineText.length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(2);
    }
    // Prefix is the full identifier; still get a typed match (not an empty list).
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("distance_to_player");

    // After deleting back to a shared prefix, both number vars appear.
    const partialChar =
      lineText.indexOf("distance_to_player") + "distance".length;
    const partialLabels = completionsAtPosition(snapshot, {
      line,
      character: partialChar,
    }).map((item) => item.label);
    expect(partialLabels).toContain("distance_to_player");
  });

  it("suggests when mid-edit of last operand in 3nvasion_spire", async () => {
    const spirePath =
      "C:/Program Files (x86)/Steam/steamapps/common/HREK/data/multiplayer/megalo/3nvasion_spire.txt";
    const source = readUtf16le(spirePath);
    const lines = source.split(/\r?\n/);
    const line = lines.findIndex((entry) =>
      entry.includes(
        "object_get_distance current_object current_player distance_to_player"
      )
    );
    expect(line).toBeGreaterThan(0);
    const lineText = lines[line]!;
    const needle = "distance_to_player";
    const character = lineText.indexOf(needle) + needle.length;
    const snapshot = await analyzeDocument(source, { version });
    const ctx = resolveCompletionContext(snapshot, { line, character });
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(2);
    }
    expect(labels).toContain("distance_to_player");
  });

  it("suggests string ids for DynamicString last operand of hud_widget_set_text", async () => {
    const source = `string_table english
\thud_proximity_warning "Proximity warning"
\tother_hud_text "Other"
end
hud_widgets
\tproximity_warning high_center
end
trigger general
\taction hud_widget_set_text proximity_warning hud_proximity_warning
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 8;
    const lineText = source.split(/\n/)[line]!;
    const partialChar =
      lineText.indexOf("hud_proximity_warning") + "hud_".length;
    const ctx = resolveCompletionContext(snapshot, {
      line,
      character: partialChar,
    });
    expect(ctx.kind).toBe("action-operands");
    if (ctx.kind === "action-operands") {
      expect(ctx.slotIndex).toBe(1);
    }
    const labels = completionsAtPosition(snapshot, {
      line,
      character: partialChar,
    }).map((item) => item.label);
    expect(labels).toContain("hud_proximity_warning");
    expect(labels).not.toContain("other_hud_text");

    const emptyPrefixChar = lineText.indexOf("hud_proximity_warning");
    const allLabels = completionsAtPosition(snapshot, {
      line,
      character: emptyPrefixChar,
    }).map((item) => item.label);
    expect(allLabels).toContain("hud_proximity_warning");
    expect(allLabels).toContain("other_hud_text");
  });
});
