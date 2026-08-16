import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const labelsAt = async (
  source: string,
  line: number,
  character: number
): Promise<string[]> => {
  const snapshot = await analyzeDocument(source, { version });
  return completionsAtPosition(snapshot, { line, character }).map(
    (item) => item.label
  );
};

/** Character index just after `needle` on the given 0-based line. */
const afterOnLine = (source: string, line: number, needle: string): number => {
  const lineText = source.split(/\n/)[line] ?? "";
  const index = lineText.indexOf(needle);
  expect(index).toBeGreaterThanOrEqual(0);
  return index + needle.length;
};

describe("language-service completions", () => {
  it("suggests top-level element keywords", async () => {
    const labels = await labelsAt("\n", 0, 0);
    expect(labels).toContain("trigger");
    expect(labels).toContain("variables");
    expect(labels).toContain("game_options");
  });

  it("suggests trigger-body keywords inside a trigger", async () => {
    const source = `trigger initialization
\t
end
`;
    const labels = await labelsAt(source, 1, 1);
    expect(labels).toContain("action");
    expect(labels).toContain("condition");
    expect(labels).toContain("end");
  });

  it("suggests action names after action keyword", async () => {
    const source = `trigger initialization
\taction 
end
`;
    const labels = await labelsAt(source, 1, afterOnLine(source, 1, "action "));
    expect(labels).toContain("set_score");
    expect(labels).toContain("create_object");
  });

  it("suggests condition names after condition keyword", async () => {
    const source = `trigger initialization
\tcondition 
end
`;
    const labels = await labelsAt(
      source,
      1,
      afterOnLine(source, 1, "condition ")
    );
    expect(labels).toContain("if");
    expect(labels).toContain("player_died");
  });

  it("suggests set_score math operations", async () => {
    const source = `trigger initialization
\taction set_score add 1 everyone
end
`;
    const labels = await labelsAt(
      source,
      1,
      afterOnLine(source, 1, "set_score ")
    );
    expect(labels).toContain("add");
    expect(labels).toContain("set_to");
  });

  it("suggests team-or-player kinds for set_score target slot", async () => {
    // Complete enough to parse; cursor on the target keyword.
    const source = `trigger initialization
\taction set_score add 1 everyone
end
`;
    const labels = await labelsAt(source, 1, afterOnLine(source, 1, "1 "));
    expect(labels).toContain("everyone");
    expect(labels).toContain("player");
    expect(labels).toContain("team");
  });

  it("suggests quoted object-list names for create_object", async () => {
    const source = `trigger initialization
\taction create_object 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, "create_object ");
    const items = completionsAtPosition(snapshot, { line: 1, character });
    const warthog = items.find((item) => item.label === "warthog");
    expect(warthog).toBeDefined();
    expect(warthog?.insertText).toBe('"warthog"');
    expect(warthog?.kind).toBe("enumMember");
  });

  it("shows concrete type details for variables and hud widgets", async () => {
    const source = `variables global
\tlocal number hold_ms 0
\tlocal player owner none
end
hud_widgets
\tproximity_warning high_center
end
trigger player
\taction get_button_time 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const playerLine = 8;
    const character = afterOnLine(source, playerLine, "get_button_time ");
    const items = completionsAtPosition(snapshot, {
      line: playerLine,
      character,
    });
    expect(items.find((item) => item.label === "owner")?.detail).toBe("player");
    expect(items.find((item) => item.label === "current_player")?.detail).toBe(
      "player"
    );

    const outSource = `variables global
\tlocal number hold_ms 0
end
hud_widgets
\tproximity_warning high_center
end
trigger player
\taction hud_widget_set_text 
end
`;
    const outSnapshot = await analyzeDocument(outSource, { version });
    const widgetLine = 7;
    const outChar = afterOnLine(outSource, widgetLine, "hud_widget_set_text ");
    const outItems = completionsAtPosition(outSnapshot, {
      line: widgetLine,
      character: outChar,
    });
    expect(
      outItems.find((item) => item.label === "proximity_warning")?.detail
    ).toBe("hud widget");
    expect(outItems.find((item) => item.label === "hold_ms")).toBeUndefined();
  });

  it("suggests comparison operators for if conditions", async () => {
    const source = `variables global
\tlocal number score 0
end
trigger initialization
\tcondition if score 
end
`;
    const labels = await labelsAt(source, 4, afterOnLine(source, 4, "score "));
    expect(labels).toContain("equal_to");
    expect(labels).toContain("greater_than");
  });

  it("filters action names by prefix", async () => {
    const source = `trigger initialization
\taction set_
end
`;
    const labels = await labelsAt(source, 1, afterOnLine(source, 1, "set_"));
    expect(labels.length).toBeGreaterThan(0);
    expect(labels).toContain("set_score");
    expect(labels).not.toContain("create_object");
  });

  it("fuzzy-matches action names (set → hud_widget_set_text)", async () => {
    const source = `trigger initialization
\taction set
end
`;
    const labels = await labelsAt(source, 1, afterOnLine(source, 1, "set"));
    expect(labels).toContain("set_score");
    expect(labels).toContain("hud_widget_set_text");
    expect(labels).not.toContain("create_object");
    // Prefix / segment hits should rank above later substring matches.
    expect(labels.indexOf("set_score")).toBeLessThan(
      labels.indexOf("hud_widget_set_text")
    );
  });

  it("only suggests current_player inside the enclosing player trigger", async () => {
    const source = `trigger player
\taction apply_player_traits current_player none
end
trigger initialization
\taction apply_player_traits local_player none
end
`;
    const inPlayer = await labelsAt(
      source,
      1,
      afterOnLine(source, 1, "apply_player_traits ")
    );
    expect(inPlayer).toContain("current_player");

    const inInit = await labelsAt(
      source,
      4,
      afterOnLine(source, 4, "apply_player_traits ")
    );
    expect(inInit).not.toContain("current_player");
    expect(inInit).toContain("local_player");
  });

  it("suggests data members after current_player.", async () => {
    const source = `variables player
\tlocal number is_leader 0
end
trigger player
\tcondition if current_player.
end
`;
    const labels = await labelsAt(
      source,
      4,
      afterOnLine(source, 4, "current_player.")
    );
    expect(labels).toContain("score");
    expect(labels).toContain("is_leader");
    expect(labels).not.toContain("current_player");
  });
});
