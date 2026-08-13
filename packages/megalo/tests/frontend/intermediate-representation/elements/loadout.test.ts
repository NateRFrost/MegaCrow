import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import { GrenadeCountSetting } from "../../../../frontend/intermediate-representation/game/game_engine_player_traits";
import { Lexer } from "../../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../../version";
import { FrontendContext } from "../../../../frontend/context";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new FrontendContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(
    ast,
    diagnostics,
    { objectLists }
  );
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
      initialGrenadeCountSetting: GrenadeCountSetting.Frag2,
    });
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
