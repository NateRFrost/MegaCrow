import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("element + temporary completion", () => {
  it("suggests team model values including by_designator", async () => {
    const source = `teams
\tmodel by_designator
\tteam
\t\tfireteam_count 3
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    // Empty prefix at start of the value token.
    const character = lineText.indexOf("by_designator");
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("element");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("by_designator");
    expect(labels).toContain("spartan");
    expect(labels).toContain("elite");
  });

  it("suggests teams block keys in the body", async () => {
    const source = `teams
\t
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character: 1,
    }).map((item) => item.label);
    expect(labels).toContain("model");
    expect(labels).toContain("designator_switch_type");
    expect(labels).toContain("team");
  });

  it("suggests temporary storage types after temporary keyword", async () => {
    const source = `trigger general
\ttemporary 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const character = "\ttemporary ".length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("temporary");
    if (ctx.kind === "temporary") {
      expect(ctx.slotIndex).toBe(0);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("number");
    expect(labels).toContain("player");
    expect(labels).toContain("object");
    expect(labels).toContain("team");
  });

  it("suggests typed initializers for temporary object", async () => {
    const source = `variables global
\tlocal object zone none
end
trigger object
\ttemporary object buy_zone current_object
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 4;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("current_object");
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("temporary");
    if (ctx.kind === "temporary") {
      expect(ctx.slotIndex).toBe(2);
    }
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("current_object");
    expect(labels).toContain("none");
    expect(labels).toContain("zone");
  });

  it("suggests hud widget positions", async () => {
    const source = `hud_widgets
\tproximity_warning high_center
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("high_center");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("high_center");
    expect(labels).toContain("top_left");
  });

  it("suggests variable scopes on the header line", async () => {
    const source = `variables global
\tlocal number score 0
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = "variables ".length;
    const labels = completionsAtPosition(snapshot, {
      line: 0,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("global");
    expect(labels).toContain("player");
    expect(labels).toContain("team");
    expect(labels).toContain("object");
  });

  it("suggests declared loadout palettes for override loadout_palette value", async () => {
    const source = `loadout_palette covy_bronze
\titem default_loadout
end
loadout_palette unsc_bronze
\titem default_loadout
end
loadout default_loadout
end
game_options
\toverride loadout_palette elite_tier1 covy_bronze
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = source
      .split(/\n/)
      .findIndex((l) => l.includes("override loadout_palette"));
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("covy_bronze");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("covy_bronze");
    expect(labels).toContain("unsc_bronze");
    expect(labels).not.toContain("elite_tier1");
    expect(labels).not.toContain("spartan_tier1");
  });

  it("suggests loadout palette tiers after override loadout_palette", async () => {
    const source = `game_options
\toverride loadout_palette elite_tier1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("elite_tier1");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("elite_tier1");
    expect(labels).toContain("spartan_tier1");
  });

  it("suggests weapon_set values after override weapon_set", async () => {
    const source = `game_options
\toverride weapon_set 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("none");
    expect(labels).toContain("default");
    expect(labels).toContain("random");
    expect(labels).toContain("slayer_pro");
    expect(labels).toContain("no_weapons");
    expect(labels).not.toContain("override");
    expect(labels).not.toContain("round_time_limit");
    expect(labels).not.toContain("assault_rifle");
  });

  it("suggests vehicle_set values after override vehicle_set", async () => {
    const source = `game_options
\toverride vehicle_set 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("none");
    expect(labels).toContain("mongoose_only");
    expect(labels).not.toContain("override");
    expect(labels).not.toContain("weapon_set");
  });
});
