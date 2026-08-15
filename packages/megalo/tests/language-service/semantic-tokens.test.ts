import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  encodeSemanticTokens,
  getSemanticTokens,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("language-service semantic tokens", () => {
  it("classifies lexical tokens, keywords, and symbols", async () => {
    const source = `; intro
variables global
\tlocal number score 0
end
trigger initialization
\taction set score = 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    expect(tokens.some((token) => token.type === "comment")).toBe(true);
    expect(tokens.some((token) => token.type === "keyword")).toBe(true);
    expect(tokens.some((token) => token.type === "variable")).toBe(true);
    expect(tokens.some((token) => token.type === "function")).toBe(true);

    const encoded = encodeSemanticTokens(tokens);
    expect(encoded.length % 5).toBe(0);
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("highlights string_table language as enumMember", async () => {
    const source = `string_table english
\thello "Hello"
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const language = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "english".length
    );
    expect(language).toBeDefined();
  });

  it("highlights escapes and format placeholders inside quoted strings", async () => {
    const source = `string_table english
\tline "a\\nb%nc\\r"
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const escapes = tokens.filter((token) => token.type === "regexp");
    expect(escapes).toHaveLength(3);
    expect(escapes.every((token) => token.length === 2)).toBe(true);
  });

  it("treats empty action name recovery as keyword context", async () => {
    const source = `trigger initialization
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    expect(tokens.some((token) => token.type === "keyword")).toBe(true);
  });

  it("highlights include after expansion", async () => {
    const source = `include "shared.txt"
trigger initialization
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      resolveInclude: async () => ({
        text: "; from include\n",
        uri: "megalo://shared.txt",
      }),
    });
    const tokens = getSemanticTokens(snapshot);
    const includeKeyword = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.line === 0 &&
        token.startChar === 0 &&
        token.length === "include".length
    );
    expect(includeKeyword).toBeDefined();
  });

  it("highlights engine_data field slots as parameter", async () => {
    const source = `engine_data
\tname spire_name
\tdescription spire_description
\ticon k_engine_icon_invasion
\tcategory invasion
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const parameters = tokens.filter((token) => token.type === "parameter");
    expect(parameters).toHaveLength(4);
    expect(parameters.map((token) => token.length)).toEqual([
      "name".length,
      "description".length,
      "icon".length,
      "category".length,
    ]);
  });

  it("highlights map_permissions default and exception as parameter", async () => {
    const source = `map_permissions
\tdefault false
\texception k_map_id_boneyard
\texception k_map_id_spire
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const parameters = tokens.filter((token) => token.type === "parameter");
    const defaultValue = tokens.find(
      (token) => token.type === "enumMember" && token.length === "false".length
    );
    expect(parameters).toHaveLength(3);
    expect(parameters[0]?.length).toBe("default".length);
    expect(parameters[1]?.length).toBe("exception".length);
    expect(parameters[2]?.length).toBe("exception".length);
    expect(defaultValue).toBeDefined();
  });

  it("highlights teams model/fireteam_count as parameter and team as keyword", async () => {
    const source = `teams
\tmodel by_designator

\tteam
\t\tfireteam_count 3
\tend

\tteam
\t\tfireteam_count 3
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const parameters = tokens.filter((token) => token.type === "parameter");
    const teamKeywords = tokens.filter(
      (token) =>
        token.type === "keyword" &&
        token.length === "team".length &&
        token.line > 0
    );
    const modelValue = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "by_designator".length
    );
    expect(parameters.map((token) => token.length)).toEqual([
      "model".length,
      "fireteam_count".length,
      "fireteam_count".length,
    ]);
    expect(teamKeywords).toHaveLength(2);
    expect(modelValue).toBeDefined();
  });

  it("highlights map_object label as parameter", async () => {
    const source = `map_object invasion_stuff
\tlabel "invasion"
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const parameters = tokens.filter((token) => token.type === "parameter");
    expect(parameters).toHaveLength(1);
    expect(parameters[0]?.length).toBe("label".length);
  });

  it("highlights constants number as type and name as variable", async () => {
    const source = `constants
\tnumber k_gametype_ctf 1
\tnumber k_gametype_assault 2
\tnumber k_gametype_territories 3
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const types = tokens.filter((token) => token.type === "type");
    const variables = tokens.filter(
      (token) => token.type === "variable" && token.length > "number".length
    );
    expect(types).toHaveLength(3);
    expect(types.every((token) => token.length === "number".length)).toBe(true);
    expect(variables.map((token) => token.length)).toEqual([
      "k_gametype_ctf".length,
      "k_gametype_assault".length,
      "k_gametype_territories".length,
    ]);
  });

  it("highlights game_options hide as modifier and override as keyword", async () => {
    const source = `game_options
\thide\toverride teams_enabled true
\toverride fire_teams_enabled true
\thide\toverride round_time_limit 4
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const modifiers = tokens.filter((token) => token.type === "modifier");
    const overrideKeywords = tokens.filter(
      (token) =>
        token.type === "keyword" &&
        token.length === "override".length &&
        token.line > 0
    );
    expect(modifiers.map((token) => token.length)).toEqual([
      "hide".length,
      "hide".length,
    ]);
    expect(overrideKeywords).toHaveLength(3);
  });

  it("highlights weapon_set and vehicle_set object-list values as enumMember", async () => {
    const source = `game_options
\toverride weapon_set slayer_pro
\toverride vehicle_set mongoose_only
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const slayerPro = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "slayer_pro".length
    );
    const mongooseOnly = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "mongoose_only".length
    );
    expect(slayerPro).toBeDefined();
    expect(mongooseOnly).toBeDefined();
  });

  it("highlights nested base_player_traits override name as variable and fields as parameter", async () => {
    const source = `game_options
\toverride base_player_traits
\t\tgamertag_visibility off
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const parameters = tokens.filter((token) => token.type === "parameter");
    const overrideName = tokens.find(
      (token) =>
        token.type === "variable" &&
        token.length === "base_player_traits".length
    );
    const overrideKeyword = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.length === "override".length &&
        token.line > 0
    );
    const traitValue = tokens.find(
      (token) => token.type === "enumMember" && token.length === "off".length
    );
    expect(overrideKeyword).toBeDefined();
    expect(overrideName).toBeDefined();
    expect(parameters.map((token) => token.length)).toEqual([
      "gamertag_visibility".length,
    ]);
    expect(traitValue).toBeDefined();
  });

  it("highlights game_options option as keyword", async () => {
    const source = `string_table english
\toption_name_attacking_team "Attacking Team"
\toption_description_attacking_team "Who attacks"
\toption_spartans "Spartans"
\toption_elites "Elites"
end
constants
\tnumber k_spartans 0
\tnumber k_elites 1
end
game_options
\tlock option option_attacking_team
\t\toption_name_attacking_team
\t\toption_description_attacking_team
\t\tk_spartans
\t\tk_spartans option_spartans ""
\t\tk_elites option_elites ""
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const optionKeyword = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.length === "option".length &&
        token.line > 0
    );
    const lockModifier = tokens.find(
      (token) => token.type === "modifier" && token.length === "lock".length
    );
    expect(optionKeyword).toBeDefined();
    expect(lockModifier).toBeDefined();
  });

  it("highlights game_options ranged_option as keyword", async () => {
    const source = `string_table english
\toption_kill_points "Kill Points"
\toption_kill_points_desc "Points per kill"
end
game_options
\tranged_option kill_points option_kill_points option_kill_points_desc 1 -10 10 end
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const rangedOptionKeyword = tokens.find(
      (token) =>
        token.type === "keyword" && token.length === "ranged_option".length
    );
    expect(rangedOptionKeyword).toBeDefined();
  });

  it("highlights game_options player_traits as keyword", async () => {
    const source = `string_table english
\ttraits_name_flag_carrier_traits "Flag Carrier"
\ttraits_description_flag_carrier_traits "Flag carrier traits"
end
game_options
\tplayer_traits flag_carrier_traits
\t\ttraits_name_flag_carrier_traits
\t\ttraits_description_flag_carrier_traits
\t\tvehicle_usage passenger
\t\twaypoint allies
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const playerTraitsKeyword = tokens.find(
      (token) =>
        token.type === "keyword" && token.length === "player_traits".length
    );
    const vehicleUsageParameter = tokens.find(
      (token) =>
        token.type === "parameter" && token.length === "vehicle_usage".length
    );
    const passengerValue = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "passenger".length
    );
    const alliesValue = tokens.find(
      (token) => token.type === "enumMember" && token.length === "allies".length
    );
    expect(playerTraitsKeyword).toBeDefined();
    expect(vehicleUsageParameter).toBeDefined();
    expect(passengerValue).toBeDefined();
    expect(alliesValue).toBeDefined();
  });

  it("highlights variables scopes and types", async () => {
    const source = `variables team
\tnetworked object goal none
\tnetworked timer vehicle_refresh 30
end
variables global
\tlocal number score 0
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    const teamScope = tokens.find(
      (token) =>
        token.type === "type" &&
        token.line === 0 &&
        token.length === "team".length
    );
    const objectType = tokens.find(
      (token) => token.type === "type" && token.length === "object".length
    );
    const timerType = tokens.find(
      (token) => token.type === "type" && token.length === "timer".length
    );
    const globalScope = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.length === "global".length &&
        token.line > 0
    );
    const numberType = tokens.find(
      (token) => token.type === "type" && token.length === "number".length
    );
    const networkedModifier = tokens.find(
      (token) =>
        token.type === "modifier" && token.length === "networked".length
    );
    const localModifier = tokens.find(
      (token) => token.type === "modifier" && token.length === "local".length
    );

    expect(teamScope).toBeDefined();
    expect(objectType).toBeDefined();
    expect(timerType).toBeDefined();
    expect(globalScope).toBeDefined();
    expect(numberType).toBeDefined();
    expect(networkedModifier).toBeDefined();
    expect(localModifier).toBeDefined();
  });

  it("highlights action KeywordParameter args as enumMember", async () => {
    const source = `variables global
\tlocal object the_hill
end
trigger initialization
\taction navpoint_set_visible the_hill allies
\taction set_boundary the_hill sphere 5
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    const allies = tokens.find(
      (token) => token.type === "enumMember" && token.length === "allies".length
    );
    const sphere = tokens.find(
      (token) => token.type === "enumMember" && token.length === "sphere".length
    );
    const navpoint = tokens.find(
      (token) =>
        token.type === "function" &&
        token.length === "navpoint_set_visible".length
    );
    expect(allies).toBeDefined();
    expect(sphere).toBeDefined();
    expect(navpoint).toBeDefined();
  });

  it("highlights bare begin and action begin as keywords", async () => {
    const source = `trigger initialization
\taction end_round
\tbegin
\t\taction end_round
\tend
\taction begin
\t\taction end_round
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    const bareBegin = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.line === 2 &&
        token.startChar === 1 &&
        token.length === "begin".length
    );
    const actionBegin = tokens.find(
      (token) =>
        token.type === "keyword" &&
        token.line === 5 &&
        token.startChar === 1 &&
        token.length === "action begin".length
    );
    expect(bareBegin).toBeDefined();
    expect(actionBegin).toBeDefined();
  });

  it("does not enum-color unknown player-filter keywords", async () => {
    const source = `variables global
\tlocal object grid_object none
end
trigger initialization
\taction boundary_set_visible grid_object fuck
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const fuck = tokens.find(
      (token) => token.type === "enumMember" && token.length === "fuck".length
    );
    expect(fuck).toBeUndefined();
  });

  it("highlights action optional parameter markers as enumMember", async () => {
    const source = `variables global
\tlocal object the_hill
end
trigger initialization
\taction set_boundary the_hill box width 2 length 3 neg_height 1 pos_height 4
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const optionals = tokens.filter(
      (token) =>
        token.type === "enumMember" &&
        (token.length === "box".length ||
          token.length === "width".length ||
          token.length === "length".length ||
          token.length === "neg_height".length ||
          token.length === "pos_height".length)
    );
    expect(optionals.map((token) => token.length).sort()).toEqual(
      [
        "box".length,
        "width".length,
        "length".length,
        "neg_height".length,
        "pos_height".length,
      ].sort()
    );
  });

  it("highlights condition member accessors as property", async () => {
    const source = `variables player
\tlocal number temp_state_0 0
end
trigger player
\tcondition if current_player.temp_state_0 == false
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const member = tokens.find(
      (token) =>
        token.type === "property" && token.length === "temp_state_0".length
    );
    expect(member).toBeDefined();
  });

  it("highlights math operation parameters as operator", async () => {
    const source = `variables global
\tlocal number score 0
end
trigger initialization
\taction set score = 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const equals = tokens.find(
      (token) =>
        token.type === "operator" && token.length === 1 && token.line === 4
    );
    expect(equals).toBeDefined();
  });

  it("highlights word-form math operations as keyword", async () => {
    const source = `variables global
\tlocal number score 0
end
constants
\tnumber k_cost_ghost 1
end
trigger initialization
\taction set score set_to k_cost_ghost
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const setTo = tokens.find(
      (token) => token.type === "keyword" && token.length === "set_to".length
    );
    expect(setTo).toBeDefined();
  });

  it("highlights hud_widgets name as variable and position as enumMember", async () => {
    const source = `hud_widgets
\tproximity_warning high_center
\tarming_warning low_center
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    const proximityWarning = tokens.find(
      (token) =>
        token.type === "variable" && token.length === "proximity_warning".length
    );
    const armingWarning = tokens.find(
      (token) =>
        token.type === "variable" && token.length === "arming_warning".length
    );
    const highCenter = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "high_center".length
    );
    const lowCenter = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "low_center".length
    );

    expect(proximityWarning).toBeDefined();
    expect(armingWarning).toBeDefined();
    expect(highCenter).toBeDefined();
    expect(lowCenter).toBeDefined();
  });

  it("highlights legacy hud_widgets text prefix as enumMember", async () => {
    const source = `hud_widgets
\ttext proximity_warning high_center
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);

    const textKeyword = tokens.find(
      (token) =>
        token.type === "enumMember" &&
        token.length === "text".length &&
        token.line === 1
    );
    const name = tokens.find(
      (token) =>
        token.type === "variable" && token.length === "proximity_warning".length
    );
    const position = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "high_center".length
    );

    expect(textKeyword).toBeDefined();
    expect(name).toBeDefined();
    expect(position).toBeDefined();
  });

  it("highlights loadout item slots as parameter", async () => {
    const source = `loadout spartan_loadout
\tprimary_weapon assault_rifle
\tgrenades 2 2
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const primaryWeapon = tokens.find(
      (token) =>
        token.type === "parameter" && token.length === "primary_weapon".length
    );
    expect(primaryWeapon).toBeDefined();
  });

  it("highlights loadout_palette keyword as type and item as parameter", async () => {
    const source = `loadout loadout_scout
\tname scout
end
loadout_palette slayer_loadouts
\titem loadout_scout
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const paletteKeyword = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "loadout_palette".length &&
        token.line === 3
    );
    const itemKeyword = tokens.find(
      (token) =>
        token.type === "parameter" &&
        token.length === "item".length &&
        token.line === 4
    );
    expect(paletteKeyword).toBeDefined();
    expect(itemKeyword).toBeDefined();
  });

  it("highlights override loadout_palette name as type", async () => {
    const source = `loadout loadout_scout
\tname scout
end
loadout_palette covy_bronze
\titem loadout_scout
end
game_options
\toverride loadout_palette elite_tier1 covy_bronze
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const overridePaletteType = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "loadout_palette".length &&
        token.line === 7
    );
    expect(overridePaletteType).toBeDefined();
  });

  it("highlights game_stats entry name as variable, type as type, label as variable, grouping as enumMember", async () => {
    const source = `string_table english
\tstat_kills "Kills"
end
game_stats
\tkills number stat_kills none 0
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const name = tokens.find(
      (token) =>
        token.type === "variable" &&
        token.length === "kills".length &&
        token.line === 4
    );
    const type = tokens.find(
      (token) => token.type === "type" && token.length === "number".length
    );
    const label = tokens.find(
      (token) =>
        token.type === "variable" &&
        token.length === "stat_kills".length &&
        token.modifiers.includes("readonly")
    );
    const grouping = tokens.find(
      (token) => token.type === "enumMember" && token.length === "none".length
    );
    expect(name).toBeDefined();
    expect(type).toBeDefined();
    expect(label).toBeDefined();
    expect(grouping).toBeDefined();
  });

  it("does not highlight unresolved game_stats label identifiers", async () => {
    const source = `game_stats
\trating_stat number rating_stat_text none 0
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const label = tokens.find(
      (token) => token.length === "rating_stat_text".length && token.line === 1
    );
    expect(label).toBeUndefined();
  });

  it("highlights hud_post_message sound keywords", async () => {
    const source = `string_table english
\tgun_game_hud_final_tier_message "Final tier"
end
trigger initialization
\taction hud_post_message everyone sudden_death gun_game_hud_final_tier_message current_player
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const suddenDeath = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "sudden_death".length
    );
    const everyone = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "everyone".length
    );
    expect(suddenDeath).toBeDefined();
    expect(everyone).toBeDefined();
  });

  it("highlights set_score team-or-player target after op and value", async () => {
    const source = `trigger player
\taction set_score add 1 player killing_player
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const playerTarget = tokens.find(
      (token) =>
        token.type === "parameter" &&
        token.length === "player".length &&
        token.line === 1
    );
    const addOp = tokens.find(
      (token) => token.type === "keyword" && token.length === "add".length
    );
    expect(playerTarget).toBeDefined();
    expect(addOp).toBeDefined();
  });

  it("highlights player_died killer type keywords", async () => {
    const source = `trigger player
\tcondition player_died current_player enemy
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const enemy = tokens.find(
      (token) => token.type === "enumMember" && token.length === "enemy".length
    );
    expect(enemy).toBeDefined();
  });

  it("highlights variable-type trigger kinds as type", async () => {
    const source = `trigger player
end
trigger team
end
trigger initialization
end
trigger fuck
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const playerKind = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "player".length &&
        token.line === 0
    );
    const teamKind = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "team".length &&
        token.line === 2
    );
    const initKind = tokens.find(
      (token) =>
        token.type === "enumMember" && token.length === "initialization".length
    );
    const unknown = tokens.find(
      (token) => token.type === "enumMember" && token.length === "fuck".length
    );
    expect(playerKind).toBeDefined();
    expect(teamKind).toBeDefined();
    expect(initKind).toBeDefined();
    expect(unknown).toBeUndefined();
  });

  it("highlights for_each targets with the same kind styling as triggers", async () => {
    const source = `map_object invasion_objective
end
trigger initialization
\taction for_each player
\tend
\taction for_each team
\tend
\taction for_each general
\tend
\taction for_each invasion_objective
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const playerTarget = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "player".length &&
        token.line === 3
    );
    const teamTarget = tokens.find(
      (token) =>
        token.type === "type" &&
        token.length === "team".length &&
        token.line === 5
    );
    const generalTarget = tokens.find(
      (token) =>
        token.type === "enumMember" &&
        token.length === "general".length &&
        token.line === 7
    );
    const filterTarget = tokens.find(
      (token) =>
        token.type === "variable" &&
        token.length === "invasion_objective".length &&
        token.line === 9
    );
    expect(playerTarget).toBeDefined();
    expect(teamTarget).toBeDefined();
    expect(generalTarget).toBeDefined();
    expect(filterTarget).toBeDefined();
  });

  it("highlights quoted object-list names as enumMember", async () => {
    const source = `variables global
\tlocal object created_object none
end
map_object invasion_stuff
\ttype "warthog"
end
trigger initialization
\taction create_object "warthog" at current_player never_garbage
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const tokens = getSemanticTokens(snapshot);
    const quoted = tokens.filter(
      (token) =>
        token.type === "enumMember" && token.length === '"warthog"'.length
    );
    expect(quoted.length).toBeGreaterThanOrEqual(2);
    expect(
      tokens.some(
        (token) =>
          token.type === "string" && token.length === '"warthog"'.length
      )
    ).toBe(false);
  });
});
