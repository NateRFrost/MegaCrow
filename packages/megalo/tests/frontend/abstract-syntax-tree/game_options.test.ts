import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import {
  ElementKind,
  GameOptionEntryKind,
  OverrideValueKind,
} from "../../../src/frontend/abstract-syntax-tree/elements";
import {
  SymbolKind,
  type SymbolTableGameOptionEntry,
} from "../../../src/frontend/symbol-table";
import { Lexer } from "../../../src/frontend/tokens";
import { loadObjectListsForVersion } from "../../../src/load-object-lists";
import { MEGALO_VERSIONS } from "../../../src/version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(
    tokens,
    diagnostics,
    loadObjectListsForVersion(version)
  );
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

const gameOptionSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableGameOptionEntry =>
      entry.kind === SymbolKind.GameOption
  );

describe("gameOptionsParser", () => {
  it("parses built-in overrides", () => {
    const source = `game_options
\toverride score_to_win_round 25
\toverride teams_enabled true
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.GAME_OPTIONS);
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries).toHaveLength(2);
    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.OVERRIDE,
      modifiers: { lock: false, hide: false },
      name: { identifier: "score_to_win_round" },
      value: {
        kind: OverrideValueKind.SIMPLE,
        value: { kind: SyntaxKind.INTEGER, value: 25 },
      },
    });
    expect(element.entries[1]).toMatchObject({
      kind: GameOptionEntryKind.OVERRIDE,
      modifiers: { lock: false, hide: false },
      name: { identifier: "teams_enabled" },
      value: {
        kind: OverrideValueKind.SIMPLE,
        value: { kind: SyntaxKind.REFERENCE, identifier: "true" },
      },
    });
  });

  it("parses lock override", () => {
    const source = `game_options
\tlock override teams_enabled true
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.OVERRIDE,
      modifiers: { lock: true, hide: false },
    });
  });

  it("parses a custom option and registers the symbol", () => {
    const source = `string_table english
\toption_name_kill_points "Kill Points"
\toption_description_kill_points "Kill Points Description"
\tneg_points_1 "-1"
\tpoints_0 "0"
\tpoints_1 "1"
end
game_options
\toption kill_points
\t\toption_name_kill_points
\t\toption_description_kill_points
\t\t1
\t\t-1 neg_points_1 ""
\t\t0 points_0 ""
\t\t1 points_1 ""
\tend
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.OPTION,
      name: { value: "kill_points" },
      defaultValue: { kind: SyntaxKind.INTEGER, value: 1 },
    });

    const option = element.entries[0];
    if (
      option.kind !== GameOptionEntryKind.OPTION &&
      option.kind !== GameOptionEntryKind.RANGED_OPTION
    ) {
      return;
    }

    expect(option.displayName).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "option_name_kill_points",
    });
    expect(option.description).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "option_description_kill_points",
    });
    expect(option.values).toHaveLength(3);
    expect(option.values[0]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: -1,
    });

    const killPoints = gameOptionSymbols(symbolTable).find(
      (entry) => entry.name === "kill_points"
    );
    expect(killPoints).toBeDefined();
  });

  it("warns when a duplicate option name is declared (first wins)", () => {
    const source = `string_table english
\tname_a "A"
\tname_b "B"
\tdesc ""
\tval "1"
end
game_options
\toption shared_opt
\t\tname_a
\t\tdesc
\t\t1
\t\t1 val ""
\tend
\toption shared_opt
\t\tname_b
\t\tdesc
\t\t1
\t\t1 val ""
\tend
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_opt");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    const shared = gameOptionSymbols(symbolTable).filter(
      (entry) => entry.name === "shared_opt"
    );
    expect(shared).toHaveLength(2);
    expect(shared[0]).toMatchObject({ index: 0 });
    expect(shared[1]).toMatchObject({ index: 1 });
  });

  it("parses a block ranged_option", () => {
    const source = `string_table english
\toption_name_float_time "Float Time"
\toption_description_float_time "Float Time Description"
end
game_options
\tranged_option float_time
\t\toption_name_float_time
\t\toption_description_float_time
\t\t7
\t\t3
\t\t16
\tend
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const entry = element.entries[0];
    if (entry.kind !== GameOptionEntryKind.RANGED_OPTION) {
      return;
    }

    expect(entry.defaultValue).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 7,
    });
    expect(entry.values).toHaveLength(2);
    expect(entry.values[0]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 3,
    });
    expect(entry.values[1]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 16,
    });

    expect(
      gameOptionSymbols(symbolTable).some(
        (symbol) => symbol.name === "float_time"
      )
    ).toBe(true);
  });

  it("parses an inline ranged_option", () => {
    const source = `string_table english
\toption_kill_points "Kill Points"
end
game_options
\tranged_option kill_points option_kill_points "" 1 -10 10 end
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const entry = element.entries[0];
    if (entry.kind !== GameOptionEntryKind.RANGED_OPTION) {
      return;
    }

    expect(entry.defaultValue).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 1,
    });
    expect(entry.values).toHaveLength(2);
    expect(entry.values[0]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: -10,
    });
    expect(entry.values[1]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 10,
    });
  });

  it("parses nested base_player_traits override", () => {
    const source = `game_options
\toverride base_player_traits
\t\tshield_multiplier 200
\t\tweapon_pickup 0
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const entry = element.entries[0];
    if (entry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(entry.name).toMatchObject({
      kind: "player_traits_override",
      option: "base_player_traits",
    });
    expect(entry.value).toMatchObject({
      kind: OverrideValueKind.NESTED,
      body: {
        options: [
          {
            identifier: "shield_multiplier",
            parameters: [{ kind: SyntaxKind.INTEGER, value: 200 }],
          },
          {
            identifier: "weapon_pickup",
            parameters: [{ kind: SyntaxKind.INTEGER, value: 0 }],
          },
        ],
      },
    });
  });

  it("parses weapon_set and vehicle_set as simple overrides", () => {
    const source = `game_options
\toverride weapon_set none
\toverride vehicle_set no_vehicles
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const weaponEntry = element.entries[0];
    if (weaponEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(weaponEntry.name).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "weapon_set",
    });
    expect(weaponEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: { kind: SyntaxKind.REFERENCE, identifier: "none" },
    });
    const vehicleEntry = element.entries[1];
    if (vehicleEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(vehicleEntry.name).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "vehicle_set",
    });
    expect(vehicleEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: {
        kind: SyntaxKind.REFERENCE,
        identifier: "no_vehicles",
      },
    });
  });

  it("resolves weapon_set and vehicle_set object-list values as references", () => {
    const source = `game_options
\toverride weapon_set slayer_pro
\toverride vehicle_set mongoose_only
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const weaponEntry = element.entries[0];
    if (weaponEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(weaponEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: {
        kind: SyntaxKind.REFERENCE,
        identifier: "slayer_pro",
      },
    });
    expect(
      (weaponEntry.value as { value: { symbolId?: number } }).value.symbolId
    ).toBeDefined();

    const vehicleEntry = element.entries[1];
    if (vehicleEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(vehicleEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: {
        kind: SyntaxKind.REFERENCE,
        identifier: "mongoose_only",
      },
    });
    expect(
      (vehicleEntry.value as { value: { symbolId?: number } }).value.symbolId
    ).toBeDefined();
  });

  it("parses loadout_palette override", () => {
    const source = `game_options
\toverride loadout_palette spartan_tier1 slayer_loadouts
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const paletteEntry = element.entries[0];
    if (paletteEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(paletteEntry.name).toMatchObject({
      kind: "loadout_palette",
    });
    expect(paletteEntry.value).toMatchObject({
      kind: OverrideValueKind.LOADOUT_PALETTE,
      tier: { value: "spartan_tier1" },
      palette: { value: "slayer_loadouts" },
    });
  });

  it("parses floating-point override values", () => {
    const source = `game_options
\toverride tu1_magnum_damage_multiplier 1.25
\toverride tu1_armor_lock_damage_to_energy_cap 0.5
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.getErrors().map((error) => error.message)).toEqual([]);
    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const firstEntry = element.entries[0];
    if (firstEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(firstEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: { kind: SyntaxKind.FLOATING_POINT, value: 1.25 },
    });
    const secondEntry = element.entries[1];
    if (secondEntry?.kind !== GameOptionEntryKind.OVERRIDE) {
      throw new Error("expected override entry");
    }
    expect(secondEntry.value).toMatchObject({
      kind: OverrideValueKind.SIMPLE,
      value: { kind: SyntaxKind.FLOATING_POINT, value: 0.5 },
    });
  });

  it("parses hide option with modifiers", () => {
    const source = `string_table english
\toption_hidden_gametype "Hidden Gametype"
\thidden_slayer "Slayer"
end
game_options
\thide option hidden_gametype
\t\toption_hidden_gametype
\t\t""
\t\t0
\t\t0 hidden_slayer ""
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.OPTION,
      modifiers: { hide: true, lock: false },
      name: { value: "hidden_gametype" },
    });
  });

  it("parses a player_traits block with trait options", () => {
    const source = `string_table english
\ttraits_name_vip_traits "VIP Traits"
\ttraits_description_vip_traits "VIP player traits"
end
game_options
\tplayer_traits vip_traits traits_name_vip_traits traits_description_vip_traits
\t\tweapon_pickup 0
\t\tvehicle_usage passenger
\t\tshield_multiplier 200
\t\tinitial_grenades 2 frag
\tend
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[1]!;
    expect(element.elementKind).toBe(ElementKind.GAME_OPTIONS);
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries).toHaveLength(1);
    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.PLAYER_TRAITS,
      modifiers: { lock: false, hide: false },
      name: { value: "vip_traits" },
      displayName: {
        kind: SyntaxKind.REFERENCE,
        identifier: "traits_name_vip_traits",
      },
      description: {
        kind: SyntaxKind.REFERENCE,
        identifier: "traits_description_vip_traits",
      },
    });

    expect(
      symbolTable.filter((entry) => entry.kind === SymbolKind.PlayerTraits)
    ).toEqual([
      expect.objectContaining({
        kind: SymbolKind.PlayerTraits,
        name: "vip_traits",
        index: 0,
      }),
    ]);

    const entry = element.entries[0];
    if (entry.kind !== GameOptionEntryKind.PLAYER_TRAITS) {
      return;
    }

    expect(entry.options).toHaveLength(4);
    expect(entry.options[0]).toMatchObject({
      identifier: "weapon_pickup",
      parameters: [{ kind: SyntaxKind.INTEGER, value: 0 }],
    });
    expect(entry.options[1]).toMatchObject({
      identifier: "vehicle_usage",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "passenger" }],
    });
    expect(entry.options[2]).toMatchObject({
      identifier: "shield_multiplier",
      parameters: [{ kind: SyntaxKind.INTEGER, value: 200 }],
    });
    expect(entry.options[3]).toMatchObject({
      identifier: "initial_grenades",
      parameters: [
        {
          kind: SyntaxKind.GRENADE_COUNT,
          form: "typed",
          count: { kind: SyntaxKind.INTEGER, value: 2 },
          grenadeType: { kind: SyntaxKind.KEYWORD, value: "frag" },
        },
      ],
    });
  });

  it("warns when a duplicate player_traits name is declared (first wins)", () => {
    const source = `string_table english
\ttraits_name_a "A"
\ttraits_name_b "B"
\ttraits_description ""
end
game_options
\tplayer_traits shared_traits traits_name_a traits_description
\tend
\tplayer_traits shared_traits traits_name_b traits_description
\tend
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_traits");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    const traits = symbolTable.filter(
      (entry) =>
        entry.kind === SymbolKind.PlayerTraits && entry.name === "shared_traits"
    );
    expect(traits).toHaveLength(2);
    expect(traits[0]).toMatchObject({ index: 0 });
    expect(traits[1]).toMatchObject({ index: 1 });
  });

  it("parses damage_resistance with a keyword or numeric alternate", () => {
    const source = `string_table english
\ttraits_name "Traits"
\ttraits_description "Traits"
end
game_options
\tplayer_traits test_traits traits_name traits_description
\t\tdamage_resistance invulnerable
\t\tdamage_resistance 100
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const entry = element.entries[0];
    if (entry.kind !== GameOptionEntryKind.PLAYER_TRAITS) {
      return;
    }

    expect(entry.options).toHaveLength(2);
    expect(entry.options[0]).toMatchObject({
      identifier: "damage_resistance",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "invulnerable" }],
    });
    expect(entry.options[1]).toMatchObject({
      identifier: "damage_resistance",
      parameters: [{ kind: SyntaxKind.INTEGER, value: 100 }],
    });
  });

  it("reports unknown player trait modifiers", () => {
    const source = `string_table english
\ttraits_name "Traits"
\ttraits_description "Traits"
end
game_options
\tplayer_traits test_traits traits_name traits_description
\t\tnot_a_real_trait 1
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain(
      "Expected player trait modifier"
    );
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_real_trait");

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    const entry = element.entries[0];
    if (entry.kind !== GameOptionEntryKind.PLAYER_TRAITS) {
      return;
    }

    expect(entry.options).toHaveLength(0);
  });

  it("parses player_traits override shorthand by name and index", () => {
    const source = `game_options
\tplayer_traits "VIP Traits"
\t\tspeed 150
\tend
\tplayer_traits 0
\t\tgravity 50
\tend
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.GAME_OPTIONS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      kind: GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE,
      target: { kind: "name", value: "VIP Traits" },
      options: [{ identifier: "speed" }],
    });
    expect(element.entries[1]).toMatchObject({
      kind: GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE,
      target: { kind: "index", value: 0 },
      options: [{ identifier: "gravity" }],
    });
  });
});
