import { describe, expect, it } from "vitest";
import { SymbolKind } from "../../src/frontend/symbol-table";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../../src/language-service";
import { resolveCompletionContext } from "../../src/language-service/completion/context";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("override loadout_palette last param", () => {
  it("suggests palettes after tier with trailing space (incomplete)", async () => {
    const source = `loadout_palette unsc_bronze
\titem default_loadout
end
loadout default_loadout
end
game_options
\toverride loadout_palette spartan_tier1 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = source
      .split(/\n/)
      .findIndex((l) => l.includes("override loadout_palette"));
    const character = source.split(/\n/)[line]!.length;
    const ctx = resolveCompletionContext(snapshot, { line, character });
    expect(ctx.kind).toBe("element");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("unsc_bronze");
    expect(labels).not.toContain("spartan_tier1");
  });

  it("suggests palettes when game_options comes before palette declarations", async () => {
    const source = `game_options
\toverride loadout_palette spartan_tier1 
end
loadout_palette unsc_bronze
\titem default_loadout
end
loadout default_loadout
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const character = source.split(/\n/)[line]!.length;
    const palettes = snapshot.ast.symbolTable
      .toArray()
      .filter((entry) => entry.kind === SymbolKind.LoadoutPalette);
    expect(palettes.map((entry) => entry.name)).toContain("unsc_bronze");
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("unsc_bronze");
  });

  it("keeps sibling palettes visible while replacing an existing palette token", async () => {
    const source = `loadout_palette unsc_bronze
\titem default_loadout
end
loadout_palette covy_bronze
\titem default_loadout
end
loadout default_loadout
end
game_options
\toverride loadout_palette spartan_tier1 unsc_bronze
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = source
      .split(/\n/)
      .findIndex((l) => l.includes("override loadout_palette"));
    const lineText = source.split(/\n/)[line]!;
    const character = lineText.indexOf("unsc_bronze") + "unsc".length;
    const labels = completionsAtPosition(snapshot, { line, character }).map(
      (item) => item.label
    );
    expect(labels).toContain("unsc_bronze");
    expect(labels).toContain("covy_bronze");
  });

  it("does not consume game_options end as the palette name", async () => {
    const source = `game_options
\toverride loadout_palette spartan_tier1 
end
loadout_palette later_palette
\titem default_loadout
end
loadout default_loadout
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character: source.split(/\n/)[1]!.length,
    }).map((item) => item.label);
    // `end` must remain available so later_palette is declared and suggested.
    expect(labels).toContain("later_palette");
    expect(labels).not.toContain("spartan_tier1");
  });
});
