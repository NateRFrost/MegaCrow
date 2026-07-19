import { isAstErrorNode, SyntaxKind } from "../../abstract-syntax-tree";
import type { NumericInitialValue } from "../../abstract-syntax-tree/elements/constants";
import {
  GameOptionEntryKind,
  type GameOptionEntryNode,
  type GameOptionsElementNode,
  type OverrideEntryNode,
  OverrideValueKind,
  type UserDefinedOptionNode,
  type UserDefinedOptionValueNode,
} from "../../abstract-syntax-tree/elements/game_options";
import type { PlayerTraitsElementNode } from "../../abstract-syntax-tree/elements/game_options/player_traits";
import type { Diagnostics, SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { SymbolKind, type SymbolTable } from "../../symbol-table";
import { ObjectListType } from "../../object-lists";
import type { ElementLowerer } from ".";
import { type IR, type ValueWithLocation, valueWithLocation } from "..";
import { dxAssertionScope } from "../diagnostics";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { assertSymbolKind } from "../diagnostics/assertSymbolKind";
import { markCurrentValueUnused } from "../diagnostics/markCurrentValueUnused";
import { LowerError } from "../error";
import type { PlayerTraits } from "../game/game_engine_player_traits";
import type { PlayerTraitOption } from "../game/game_engine_traits";
import type {
  SelectUserDefinedOption,
  RangedUserDefinedOption,
  UserDefinedOptionValue,
} from "../game/megalogamengine/megalogamengine_user_defined_options";
import type { BuiltInGameOptionFlags } from "../game/parameters";
import { resolveScriptStringTableReference } from "../parameters/resolveScriptStringTableReference";

/** `override weapon_set none` / `override vehicle_set none` */
const MAP_RESTRICTION_SET_NONE = -1;
/** `default` — use the map's built-in restriction. */
const MAP_RESTRICTION_SET_DEFAULT = -2;
/** `random` — pick a random named preset from the list. */
const MAP_RESTRICTION_SET_RANDOM = -3;
const emptyPlayerTraits = (): PlayerTraits => ({
  shieldVitality: {},
  weapons: {},
  movement: {},
  appearance: {},
  sensors: {},
});

// maps Megalo game option names to BuiltInGameOptionFlags keys for lock/hide flags
const BUILTIN_LOCK_FLAG = new Map<string, keyof BuiltInGameOptionFlags>([
  ["score_to_win_round", "gameMiscScoreToWinRound"],
  ["teams_enabled", "gameMiscTeams"],
  ["round_time_limit", "gameMiscRoundTimeLimit"],
  ["sudden_death_time_limit", "gameMiscSuddenDeathTimeLimit"],
  ["perfection_enabled", "gameMiscPerfectionEnabled"],
  ["round_count", "gameMiscRoundLimit"],
  ["early_victory_win_count", "gameMiscEarlyWinCount"],
  ["lives_per_round", "gameRespawnLivesPerRound"],
  ["team_lives_per_round", "gameRespawnTeamLivesPerRound"],
  ["respawn_time", "gameRespawnRespawnTime"],
  ["suicide_respawn_penalty", "gameRespawnSuicidePenalty"],
  ["betrayal_respawn_penalty", "gameRespawnBetrayalPenalty"],
  ["respawn_time_growth", "gameRespawnGrowth"],
  ["loadout_selection_time", "gameRespawnInitialLoadoutSelectionTime"],
  ["respawn_traits_duration", "gameRespawnTraitsDuration"],
  ["friendly_fire_enabled", "gameSocialFriendlyFire"],
  ["betrayal_booting_enabled", "gameSocialBetrayalBooting"],
  ["enemy_voice_enabled", "gameSocialEnemyVoice"],
  ["open_channel_voice_enabled", "gameSocialOpenChannelVoice"],
  ["dead_player_voice_enabled", "gameSocialDeadPlayerVoice"],
  ["grenades_on_map", "gameMapGrenades"],
  ["equipment_on_map", "gameMapEquipment"],
  ["turrets_on_map", "gameMapTurrets"],
  ["shortcuts_on_map", "gameMapShortcuts"],
  ["powerups_on_map", "gameMapPowerups"],
  ["indestructible_vehicles", "gameMapIndestructibleVehicles"],
  ["weapon_set", "gameMapWeaponSet"],
  ["vehicle_set", "gameMapVehicleSet"],
  ["red_powerup_duration", "gameMapRedPowerupDuration"],
  ["blue_powerup_duration", "gameMapBluePowerupDuration"],
  ["yellow_powerup_duration", "gameMapYellowPowerupDuration"],
]);

const unwrapNumber = (value: ValueWithLocation<number>): number =>
  Number(value);

const resolveNumericValue = (
  node: NumericInitialValue,
  symbolTable: SymbolTable
): ValueWithLocation<number> => {
  assertSyntaxKind(node, [SyntaxKind.INTEGER, SyntaxKind.REFERENCE]);
  if (node.kind === SyntaxKind.INTEGER) {
    return valueWithLocation(node.value, node.location);
  }
  const symbol = symbolTable.getSymbol(node.symbolId);
  assertSymbolKind(symbol, SymbolKind.Constant);
  return valueWithLocation(symbol.value, node.location);
};

const resolveSimpleNumber = (
  node: OverrideEntryNode["value"],
  symbolTable: SymbolTable
): ValueWithLocation<number> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("number", ""),
      (node as { location: SourceCodeLocation }).location
    );
  }
  assertSyntaxKind(node.value, [SyntaxKind.INTEGER, SyntaxKind.REFERENCE]);
  return resolveNumericValue(node.value, symbolTable);
};

const resolveRestrictionSetIndex = (
  node: OverrideEntryNode["value"],
  symbolTable: SymbolTable,
  objectType: ObjectListType.WeaponSets | ObjectListType.VehicleSets
): ValueWithLocation<number> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, ""),
      (node as { location: SourceCodeLocation }).location
    );
  }
  assertSyntaxKind(node.value, [SyntaxKind.KEYWORD, SyntaxKind.REFERENCE]);
  const name =
    node.value.kind === SyntaxKind.KEYWORD
      ? node.value.value
      : node.value.identifier;
  const { location } = node.value;

  if (name === "none") {
    return valueWithLocation(MAP_RESTRICTION_SET_NONE, location);
  }
  if (name === "default") {
    return valueWithLocation(MAP_RESTRICTION_SET_DEFAULT, location);
  }
  if (name === "random") {
    return valueWithLocation(MAP_RESTRICTION_SET_RANDOM, location);
  }

  if (node.value.kind === SyntaxKind.REFERENCE) {
    const symbol = symbolTable.getSymbol(node.value.symbolId);
    if (
      symbol?.kind === SymbolKind.ObjectListItem &&
      symbol.objectType === objectType
    ) {
      return valueWithLocation(symbol.index, location);
    }
  }

  const match = symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === name
    );
  if (match === undefined || match.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, name),
      location
    );
  }
  return valueWithLocation(match.index, location);
};

const applyBuiltinLockHide = (
  ir: IR,
  diagnostics: Diagnostics,
  optionName: string,
  modifiers: { lock: boolean; hide: boolean },
  location: SourceCodeLocation
) => {
  const flag = BUILTIN_LOCK_FLAG.get(optionName);
  if (flag === undefined) {
    return;
  }
  if (modifiers.lock) {
    markCurrentValueUnused(
      ir.gameVariant.baseVariantParametersLocked[flag],
      diagnostics
    );
    ir.gameVariant.baseVariantParametersLocked[flag] = valueWithLocation(
      true,
      location
    );
  }
  if (modifiers.hide) {
    markCurrentValueUnused(
      ir.gameVariant.baseVariantParametersHidden[flag],
      diagnostics
    );
    ir.gameVariant.baseVariantParametersHidden[flag] = valueWithLocation(
      true,
      location
    );
  }
};

const overrideNameString = (entry: OverrideEntryNode): string | undefined => {
  const { name } = entry;
  if (name.kind === SyntaxKind.INVALID) {
    return undefined;
  }
  if (name.kind === SyntaxKind.REFERENCE) {
    return name.identifier;
  }
  if (name.kind === SyntaxKind.KEYWORD) {
    return name.value;
  }
  return undefined;
};

const lowerOverride = (
  entry: OverrideEntryNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
    const optionName = overrideNameString(entry);
    if (optionName === undefined) {
      return;
    }

    applyBuiltinLockHide(
      ir,
      diagnostics,
      optionName,
      entry.modifiers,
      entry.location
    );

    if (entry.value.kind === OverrideValueKind.LOADOUT_PALETTE) {
      // Requires object-list / loadout palette resolution; deferred to compile.
      return;
    }

    if (entry.value.kind === OverrideValueKind.NESTED) {
      const traits = valueWithLocation(emptyPlayerTraits(), entry.location);
      const map = ir.gameVariant.baseVariant.mapOverrideOptions;
      const respawn = ir.gameVariant.baseVariant.respawnOptions;
      switch (optionName) {
        case "base_player_traits":
          map.basePlayerTraits = traits;
          break;
        case "red_powerup_traits":
          map.redPowerupTraits = traits;
          break;
        case "blue_powerup_traits":
          map.bluePowerupTraits = traits;
          break;
        case "yellow_powerup_traits":
          map.yellowPowerupTraits = traits;
          break;
        case "respawn_traits":
          respawn.respawnPlayerTraits = [traits];
          break;
        default:
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "player traits override",
              optionName
            ),
            entry.location
          );
      }
      // Nested trait field lowering is NYI.
      return;
    }

    if (entry.value.kind === SyntaxKind.INVALID) {
      return;
    }

    const base = ir.gameVariant.baseVariant;
    const misc = base.miscellaneousOptions;
    const map = base.mapOverrideOptions;
    const respawn = base.respawnOptions;
    const social = base.socialOptions;

    switch (optionName) {
      case "teams_enabled":
        markCurrentValueUnused(misc.teamsEnabled, diagnostics);
        misc.teamsEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "fire_teams_enabled":
        markCurrentValueUnused(ir.gameVariant.fireTeamsEnabled, diagnostics);
        ir.gameVariant.fireTeamsEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "score_to_win_round":
        markCurrentValueUnused(ir.gameVariant.scoreToWinRound, diagnostics);
        ir.gameVariant.scoreToWinRound = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "round_time_limit":
        markCurrentValueUnused(misc.roundTimeLimitMinutes, diagnostics);
        misc.roundTimeLimitMinutes = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "round_count":
        markCurrentValueUnused(misc.roundCount, diagnostics);
        misc.roundCount = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "early_victory_win_count":
        markCurrentValueUnused(misc.earlyVictoryWinCount, diagnostics);
        misc.earlyVictoryWinCount = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "sudden_death_time_limit":
        markCurrentValueUnused(misc.suddenDeathTimeLimitSeconds, diagnostics);
        misc.suddenDeathTimeLimitSeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "perfection_enabled":
        markCurrentValueUnused(misc.perfectionEnabled, diagnostics);
        misc.perfectionEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "grace_period_time_limit":
        markCurrentValueUnused(misc.gracePeriodTimeLimitSeconds, diagnostics);
        misc.gracePeriodTimeLimitSeconds = resolveSimpleNumber(
          entry.value,
          symbolTable
        );
        break;
      case "loadout_selection_time":
        markCurrentValueUnused(respawn.loadoutCamTime, diagnostics);
        respawn.loadoutCamTime = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "lives_per_round":
        markCurrentValueUnused(respawn.livesPerRound, diagnostics);
        respawn.livesPerRound = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "team_lives_per_round":
        markCurrentValueUnused(respawn.teamLivesPerRound, diagnostics);
        respawn.teamLivesPerRound = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "respawn_time":
        markCurrentValueUnused(respawn.respawnTimeSeconds, diagnostics);
        respawn.respawnTimeSeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "suicide_respawn_penalty":
        markCurrentValueUnused(respawn.suicidePenaltySeconds, diagnostics);
        respawn.suicidePenaltySeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "betrayal_respawn_penalty":
        markCurrentValueUnused(respawn.betrayalPenaltySeconds, diagnostics);
        respawn.betrayalPenaltySeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "respawn_time_growth":
        markCurrentValueUnused(respawn.respawnGrowthSeconds, diagnostics);
        respawn.respawnGrowthSeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "respawn_traits_duration":
        markCurrentValueUnused(
          respawn.respawnPlayerTraitsDurationSeconds,
          diagnostics
        );
        respawn.respawnPlayerTraitsDurationSeconds = resolveSimpleNumber(
          entry.value,
          symbolTable
        );
        break;
      case "friendly_fire_enabled":
        markCurrentValueUnused(social.friendlyFireEnabled, diagnostics);
        social.friendlyFireEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "betrayal_booting_enabled":
        markCurrentValueUnused(social.betrayalBootingEnabled, diagnostics);
        social.betrayalBootingEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "enemy_voice_enabled":
        markCurrentValueUnused(social.enemyVoiceEnabled, diagnostics);
        social.enemyVoiceEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "open_channel_voice_enabled":
        markCurrentValueUnused(social.openChannelVoiceEnabled, diagnostics);
        social.openChannelVoiceEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "dead_player_voice_enabled":
        markCurrentValueUnused(social.deadPlayerVoiceEnabled, diagnostics);
        social.deadPlayerVoiceEnabled = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "grenades_on_map":
        markCurrentValueUnused(map.grenadesOnMap, diagnostics);
        map.grenadesOnMap = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "indestructible_vehicles":
        markCurrentValueUnused(map.indestructibleVehicles, diagnostics);
        map.indestructibleVehicles = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "red_powerup_duration":
        markCurrentValueUnused(map.redPowerupDurationSeconds, diagnostics);
        map.redPowerupDurationSeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "blue_powerup_duration":
        markCurrentValueUnused(map.bluePowerupDurationSeconds, diagnostics);
        map.bluePowerupDurationSeconds = resolveSimpleNumber(entry.value, symbolTable);
        break;
      case "yellow_powerup_duration":
        markCurrentValueUnused(map.yellowPowerupDurationSeconds, diagnostics);
        map.yellowPowerupDurationSeconds = resolveSimpleNumber(
          entry.value,
          symbolTable
        );
        break;
      case "weapon_set":
        markCurrentValueUnused(map.weaponSetAbsoluteIndex, diagnostics);
        map.weaponSetAbsoluteIndex = resolveRestrictionSetIndex(
          entry.value,
          symbolTable,
          ObjectListType.WeaponSets
        );
        break;
      case "vehicle_set":
        markCurrentValueUnused(map.vehicleSetAbsoluteIndex, diagnostics);
        map.vehicleSetAbsoluteIndex = resolveRestrictionSetIndex(
          entry.value,
          symbolTable,
          ObjectListType.VehicleSets
        );
        break;
      default:
        break;
    }
  });
};

const lowerUserDefinedOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  symbolTable: SymbolTable,
  ir: IR,
  ranged: boolean
): ValueWithLocation<UserDefinedOptionValue> => {
  const value = resolveNumericValue(valueNode.value, symbolTable);
  if (ranged) {
    return valueWithLocation({ value }, valueNode.location);
  }
  const name =
    valueNode.name === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(
            valueNode.name,
            ir,
            symbolTable
          ),
          valueNode.name.location
        );
  const description =
    valueNode.description === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(
            valueNode.description,
            ir,
            symbolTable
          ),
          valueNode.description.location
        );
  return valueWithLocation({ value, name, description }, valueNode.location);
};

const lowerUserDefinedOption = (
  entry: UserDefinedOptionNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
    if (isAstErrorNode(entry.name)) {
      return;
    }

    const name = valueWithLocation(
      resolveScriptStringTableReference(
        entry.displayName,
        ir,
        symbolTable
      ),
      entry.displayName.location
    );
    const description = valueWithLocation(
      resolveScriptStringTableReference(
        entry.description,
        ir,
        symbolTable
      ),
      entry.description.location
    );
    const locked = entry.modifiers.lock
      ? valueWithLocation(true, entry.location)
      : undefined;
    const hidden = entry.modifiers.hide
      ? valueWithLocation(true, entry.location)
      : undefined;

    if (entry.kind === GameOptionEntryKind.RANGED_OPTION) {
      if (entry.values.length < 2) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "ranged min/max",
            String(entry.values.length)
          ),
          entry.location
        );
      }
      const minValue = lowerUserDefinedOptionValue(
        entry.values[0]!,
        symbolTable,
        ir,
        true
      );
      const maxValue = lowerUserDefinedOptionValue(
        entry.values[1]!,
        symbolTable,
        ir,
        true
      );
      const defaultNumeric = resolveNumericValue(entry.defaultValue, symbolTable);
      const defaultValue = valueWithLocation(
        { value: defaultNumeric },
        entry.defaultValue.location
      );
      const option: RangedUserDefinedOption = {
        name,
        description,
        locked,
        hidden,
        defaultValue,
        minValue,
        maxValue,
        currentValue: valueWithLocation(
          unwrapNumber(defaultNumeric),
          entry.defaultValue.location
        ),
      };
      ir.gameVariant.userDefinedOptions.push(option);
      return;
    }

    const values = entry.values.map((value) =>
      lowerUserDefinedOptionValue(value, symbolTable, ir, false)
    );
    const defaultNumber = unwrapNumber(
      resolveNumericValue(entry.defaultValue, symbolTable)
    );
    let defaultValueIndex = values.findIndex(
      (value) => unwrapNumber(value.value) === defaultNumber
    );
    if (defaultValueIndex < 0) {
      defaultValueIndex = 0;
    }

    const option: SelectUserDefinedOption = {
      name,
      description,
      locked,
      hidden,
      values,
      defaultValueIndex: valueWithLocation(
        defaultValueIndex,
        entry.defaultValue.location
      ),
      currentValueIndex: valueWithLocation(
        defaultValueIndex,
        entry.defaultValue.location
      ),
    };
    ir.gameVariant.userDefinedOptions.push(option);
  });
};

const lowerPlayerTraits = (
  entry: PlayerTraitsElementNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
    if (isAstErrorNode(entry.name)) {
      return;
    }
    const option: PlayerTraitOption = {
      name: valueWithLocation(
        resolveScriptStringTableReference(
          entry.displayName,
          ir,
          symbolTable
        ),
        entry.displayName.location
      ),
      description: valueWithLocation(
        resolveScriptStringTableReference(
          entry.description,
          ir,
          symbolTable
        ),
        entry.description.location
      ),
      traits: valueWithLocation(emptyPlayerTraits(), entry.location),
    };
    // Trait field mapping is NYI; lobby name/description are recorded.
    void entry.options;
    ir.gameVariant.playerTraits.push(option);
  });
};

const lowerEntry = (
  entry: GameOptionEntryNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  switch (entry.kind) {
    case GameOptionEntryKind.OVERRIDE:
      lowerOverride(entry, symbolTable, ir, diagnostics);
      break;
    case GameOptionEntryKind.OPTION:
    case GameOptionEntryKind.RANGED_OPTION:
      lowerUserDefinedOption(entry, symbolTable, ir, diagnostics);
      break;
    case GameOptionEntryKind.PLAYER_TRAITS:
      lowerPlayerTraits(entry, symbolTable, ir, diagnostics);
      break;
  }
};

export const gameOptionsLowerer: ElementLowerer<GameOptionsElementNode> = (
  element,
  symbolTable,
  ir,
  diagnostics
) => {
  for (const entry of element.entries) {
    lowerEntry(entry, symbolTable, ir, diagnostics);
  }
};
