import { SyntaxKind } from "../../../../abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "../../../../abstract-syntax-tree/elements/game_options";
import type { Diagnostics, SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import {
  type BuiltInGameOptionName,
  isBuiltInGameOptionName,
} from "../../../../language-configuration/omni/game_options";
import { type IR, type Located, located } from "../../..";
import { assertSyntaxKind } from "../../../diagnostics/assertSyntaxKind";
import { LowerError } from "../../../error";
import { TeamScoringMethod } from "../../../game/game_engine_default";
import type { BuiltInGameOptionFlags } from "../../../game/parameters";
import type { ElementLowerContext } from "../../../parameters/context";
import { lowerConstantNumber } from "../../../parameters/constantNumber";
import { setField } from "../../../setField";

/** Maps Megalo game option names to BuiltInGameOptionFlags keys for lock/hide flags. */
export const BUILTIN_LOCK_FLAG = new Map<
  BuiltInGameOptionName,
  keyof BuiltInGameOptionFlags
>([
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

export const TEAM_SCORING_METHOD: Record<string, TeamScoringMethod> = {
  sum: TeamScoringMethod.Sum,
  minimum: TeamScoringMethod.Minimum,
  maximum: TeamScoringMethod.Maximum,
};

export const resolveSimpleNumber = (
  node: OverrideEntryNode["value"],
  ctx: ElementLowerContext
): Located<number> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("number", ""),
      (node as { location: SourceCodeLocation }).location
    );
  }
  assertSyntaxKind(node.value, [
    SyntaxKind.INTEGER,
    SyntaxKind.FLOATING_POINT,
    SyntaxKind.REFERENCE,
  ]);
  return lowerConstantNumber(node.value, ctx);
};

export const resolveSimpleBoolean = (
  node: OverrideEntryNode["value"],
  ctx: ElementLowerContext
): Located<boolean> => {
  const value = resolveSimpleNumber(node, ctx);
  return located(value.value !== 0, value.location);
};

export const resolveTeamScoringMode = (
  node: OverrideEntryNode["value"]
): Located<TeamScoringMethod> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("team_scoring_method", ""),
      (node as { location: SourceCodeLocation }).location
    );
  }
  assertSyntaxKind(node.value, [SyntaxKind.KEYWORD]);
  const method = TEAM_SCORING_METHOD[node.value.value];
  if (method === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "team_scoring_method",
        node.value.value
      ),
      node.value.location
    );
  }
  return located(method, node.value.location);
};

export const applyBuiltinLockHide = (
  ir: IR,
  diagnostics: Diagnostics,
  optionName: string,
  modifiers: { lock: boolean; hide: boolean },
  location: SourceCodeLocation
) => {
  if (!isBuiltInGameOptionName(optionName)) {
    return;
  }
  const flag = BUILTIN_LOCK_FLAG.get(optionName);
  if (flag === undefined) {
    return;
  }
  if (modifiers.lock) {
    setField(
      ir.locations,
      diagnostics,
      ir.gameVariant.baseVariantParametersLocked,
      flag,
      true,
      location
    );
  }
  if (modifiers.hide) {
    setField(
      ir.locations,
      diagnostics,
      ir.gameVariant.baseVariantParametersHidden,
      flag,
      true,
      location
    );
  }
};
