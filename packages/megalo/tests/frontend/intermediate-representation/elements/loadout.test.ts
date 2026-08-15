import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import { GrenadeCountSetting } from "../../../../src/frontend/intermediate-representation/game/game_engine_player_traits";
import { Lexer } from "../../../../src/frontend/tokens";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { MEGALO_VERSIONS } from "../../../../src/version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(ast, diagnostics, { objectLists });
  return { ir, diagnostics };
};

describe("loadout lowering", () => {
  it("applies palette overrides in source order", () => {
    const source = `loadout scout
\tname loadout_name_scout
\tprimary_weapon assault_rifle
\tbackpack_weapon magnum
\tequipment sprint_equipment
\tgrenades 2 frag
end
loadout_palette custom_palette
\titem scout
end
game_options
\toverride loadout_palette spartan_tier1 custom_palette
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    const traits = ir.gameVariant.baseVariant.loadoutTraits;
    expect(traits.spartanLoadoutsEnabled).toBe(true);
    expect(traits.eliteLoadoutsEnabled).toBe(true);
    expect(traits.loadoutPalettes?.[0]?.loadouts?.[0]).toMatchObject({
      name: 60,
      initialPrimaryWeaponAbsoluteIndex: 1,
      initialSecondaryWeaponAbsoluteIndex: 5,
      initialEquipmentAbsoluteIndex: 0,
      initialGrenadeCountSetting: GrenadeCountSetting["2 frag"],
    });
  });

  it("does not mark distinct loadout_palette tier overrides as unused", () => {
    const source = `loadout scout
\tname loadout_name_scout
end
loadout_palette unsc_bronze
\titem scout
end
loadout_palette unsc_silver
\titem scout
end
loadout_palette unsc_gold
\titem scout
end
loadout_palette covy_bronze
\titem scout
end
loadout_palette covy_silver
\titem scout
end
loadout_palette covy_gold
\titem scout
end
game_options
\toverride loadout_palette spartan_tier1 unsc_bronze
\toverride loadout_palette spartan_tier2 unsc_silver
\toverride loadout_palette spartan_tier3 unsc_gold
\toverride loadout_palette elite_tier1 covy_bronze
\toverride loadout_palette elite_tier2 covy_silver
\toverride loadout_palette elite_tier3 covy_gold
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(
      diagnostics
        .getWarnings()
        .filter((warning) => warning.message.toLowerCase().includes("unused"))
    ).toEqual([]);
    const palettes = ir.gameVariant.baseVariant.loadoutTraits.loadoutPalettes;
    expect(palettes?.[0]).toBeDefined();
    expect(palettes?.[1]).toBeDefined();
    expect(palettes?.[2]).toBeDefined();
    expect(palettes?.[3]).toBeDefined();
    expect(palettes?.[4]).toBeDefined();
    expect(palettes?.[5]).toBeDefined();
  });

  it("warns when the same loadout_palette tier is overridden twice", () => {
    const source = `loadout scout
\tname loadout_name_scout
end
loadout_palette first_palette
\titem scout
end
loadout_palette second_palette
\titem scout
end
game_options
\toverride loadout_palette spartan_tier1 first_palette
\toverride loadout_palette spartan_tier1 second_palette
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(
      diagnostics
        .getWarnings()
        .some((warning) => warning.message.toLowerCase().includes("unused"))
    ).toBe(true);
  });

  it("errors when a palette override appears before its declarations", () => {
    const source = `game_options
\toverride loadout_palette spartan_tier1 custom_palette
end
loadout_palette custom_palette
\titem scout
end
loadout scout
\tname loadout_name_scout
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("loadout palette");
    expect(ir.gameVariant.baseVariant.loadoutTraits.loadoutPalettes?.[0]).toBe(
      undefined
    );
  });
});
