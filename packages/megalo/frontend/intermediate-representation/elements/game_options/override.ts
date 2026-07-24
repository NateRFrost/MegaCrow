import { SyntaxKind } from "../../../abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { Diagnostics, SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import {
  type BuiltInGameOptionName,
  isBuiltInGameOptionName,
} from "../../../language-configuration/omni/game_options";
import { type IR, type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "../../diagnostics/assertSyntaxKind";
import { markCurrentValueUnused } from "../../diagnostics/markCurrentValueUnused";
import { LowerError } from "../../error";
import { TeamScoringMethod } from "../../game/game_engine_default";
import type { BuiltInGameOptionFlags } from "../../game/parameters";
import type { ElementLowerContext } from "../../parameters/context";
import { asParameterLoweringContext } from "../../parameters/context";
import { lowerConstantNumber } from "../../parameters/constantNumber";
import { lowerPlayerTraitOptions } from "./player_traits";
import { lowerVehicleSet } from "./vehicle_set";
import { lowerWeaponSet } from "./weapon_set";

// maps Megalo game option names to BuiltInGameOptionFlags keys for lock/hide flags
const BUILTIN_LOCK_FLAG = new Map<
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

const resolveSimpleNumber = (
  node: OverrideEntryNode["value"],
  ctx: ElementLowerContext
): ValueWithLocation<number> => {
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

const resolveSimpleBoolean = (
  node: OverrideEntryNode["value"],
  ctx: ElementLowerContext
): ValueWithLocation<boolean> => {
  const value = resolveSimpleNumber(node, ctx);
  return valueWithLocation(value.value !== 0, value.location);
};

const TEAM_SCORING_METHOD: Record<string, TeamScoringMethod> = {
  sum: TeamScoringMethod.Sum,
  minimum: TeamScoringMethod.Minimum,
  maximum: TeamScoringMethod.Maximum,
};

const LOADOUT_PALETTE_TIER_INDEX: Readonly<Record<string, number>> = {
  spartan_tier1: 0,
  elite_tier1: 1,
  spartan_tier2: 2,
  elite_tier2: 3,
  spartan_tier3: 4,
  elite_tier3: 5,
};

const lowerLoadoutPaletteOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  if (entry.value.kind !== OverrideValueKind.LOADOUT_PALETTE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette override", ""),
      entry.location
    );
  }
  const { tier, palette } = entry.value;
  assertNotErrorNode(tier);
  assertNotErrorNode(palette);
  const tierIndex = LOADOUT_PALETTE_TIER_INDEX[tier.value];
  if (tierIndex === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "loadout palette tier",
        tier.value
      ),
      tier.location
    );
  }
  const loweredPalette = ctx.loadoutPalettesByName.get(palette.value);
  if (loweredPalette === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette", palette.value),
      palette.location
    );
  }

  const loadoutTraits = ctx.ir.gameVariant.baseVariant.loadoutTraits;
  loadoutTraits.loadoutPalettes ??= [];
  loadoutTraits.loadoutPalettes[tierIndex] = loweredPalette;
  loadoutTraits.spartanLoadoutsEnabled = valueWithLocation(
    true,
    entry.location
  );
  loadoutTraits.eliteLoadoutsEnabled = valueWithLocation(true, entry.location);
};

const resolveTeamScoringMode = (
  node: OverrideEntryNode["value"]
): ValueWithLocation<TeamScoringMethod> => {
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
  return valueWithLocation(method, node.value.location);
};

const applyBuiltinLockHide = (
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

/**
 * @link https://blam-network.github.io/megalo/language/elements/game-options#override
 */
export const lowerOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  const { diagnostics, ir, symbolTable } = ctx;
  dxAssertionScope(diagnostics, () => {
    const { name } = entry;

    if (name.kind === SyntaxKind.INVALID) {
      return;
    }

    if (name.kind === "loadout_palette") {
      lowerLoadoutPaletteOverride(entry, ctx);
      return;
    }

    if (name.kind === "player_traits_override") {
      if (entry.value.kind !== OverrideValueKind.NESTED) {
        return;
      }
      const traits = lowerPlayerTraitOptions(
        entry.value.body.options,
        asParameterLoweringContext(ctx),
        entry.location
      );
      const map = ir.gameVariant.baseVariant.mapOverrideOptions;
      const respawn = ir.gameVariant.baseVariant.respawnOptions;
      switch (name.option) {
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
      }
      return;
    }

    const optionName = name.identifier;
    applyBuiltinLockHide(
      ir,
      diagnostics,
      optionName,
      entry.modifiers,
      entry.location
    );

    if (entry.value.kind === SyntaxKind.INVALID) {
      return;
    }

    if (entry.value.kind !== OverrideValueKind.SIMPLE) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("override value", ""),
        entry.location
      );
    }

    const base = ir.gameVariant.baseVariant;
    const misc = base.miscellaneousOptions;
    const map = base.mapOverrideOptions;
    const respawn = base.respawnOptions;
    const social = base.socialOptions;

    switch (optionName) {
      case "teams_enabled":
        markCurrentValueUnused(misc.teamsEnabled, diagnostics);
        misc.teamsEnabled = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "fire_teams_enabled":
        markCurrentValueUnused(ir.gameVariant.fireTeamsEnabled, diagnostics);
        ir.gameVariant.fireTeamsEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "score_to_win_round":
        markCurrentValueUnused(ir.gameVariant.scoreToWinRound, diagnostics);
        ir.gameVariant.scoreToWinRound = resolveSimpleNumber(entry.value, ctx);
        break;
      case "team_scoring_mode":
        markCurrentValueUnused(base.teamScoringMethod, diagnostics);
        base.teamScoringMethod = resolveTeamScoringMode(entry.value);
        break;
      case "round_time_limit":
        markCurrentValueUnused(misc.roundTimeLimitMinutes, diagnostics);
        misc.roundTimeLimitMinutes = resolveSimpleNumber(entry.value, ctx);
        break;
      case "round_count":
        markCurrentValueUnused(misc.roundCount, diagnostics);
        misc.roundCount = resolveSimpleNumber(entry.value, ctx);
        break;
      case "early_victory_win_count":
        markCurrentValueUnused(misc.earlyVictoryWinCount, diagnostics);
        misc.earlyVictoryWinCount = resolveSimpleNumber(entry.value, ctx);
        break;
      case "sudden_death_time_limit":
        markCurrentValueUnused(misc.suddenDeathTimeLimitSeconds, diagnostics);
        misc.suddenDeathTimeLimitSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "perfection_enabled":
        markCurrentValueUnused(misc.perfectionEnabled, diagnostics);
        misc.perfectionEnabled = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "grace_period_time_limit":
        markCurrentValueUnused(misc.gracePeriodTimeLimitSeconds, diagnostics);
        misc.gracePeriodTimeLimitSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "loadout_selection_time":
        markCurrentValueUnused(respawn.loadoutCamTime, diagnostics);
        respawn.loadoutCamTime = resolveSimpleNumber(entry.value, ctx);
        break;
      case "lives_per_round":
        markCurrentValueUnused(respawn.livesPerRound, diagnostics);
        respawn.livesPerRound = resolveSimpleNumber(entry.value, ctx);
        break;
      case "team_lives_per_round":
        markCurrentValueUnused(respawn.teamLivesPerRound, diagnostics);
        respawn.teamLivesPerRound = resolveSimpleNumber(entry.value, ctx);
        break;
      case "respawn_time":
        markCurrentValueUnused(respawn.respawnTimeSeconds, diagnostics);
        respawn.respawnTimeSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "suicide_respawn_penalty":
        markCurrentValueUnused(respawn.suicidePenaltySeconds, diagnostics);
        respawn.suicidePenaltySeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "betrayal_respawn_penalty":
        markCurrentValueUnused(respawn.betrayalPenaltySeconds, diagnostics);
        respawn.betrayalPenaltySeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "respawn_time_growth":
        markCurrentValueUnused(respawn.respawnGrowthSeconds, diagnostics);
        respawn.respawnGrowthSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "respawn_traits_duration":
        markCurrentValueUnused(
          respawn.respawnPlayerTraitsDurationSeconds,
          diagnostics
        );
        respawn.respawnPlayerTraitsDurationSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "friendly_fire_enabled":
        markCurrentValueUnused(social.friendlyFireEnabled, diagnostics);
        social.friendlyFireEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "betrayal_booting_enabled":
        markCurrentValueUnused(social.betrayalBootingEnabled, diagnostics);
        social.betrayalBootingEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "enemy_voice_enabled":
        markCurrentValueUnused(social.enemyVoiceEnabled, diagnostics);
        social.enemyVoiceEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "open_channel_voice_enabled":
        markCurrentValueUnused(social.openChannelVoiceEnabled, diagnostics);
        social.openChannelVoiceEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "dead_player_voice_enabled":
        markCurrentValueUnused(social.deadPlayerVoiceEnabled, diagnostics);
        social.deadPlayerVoiceEnabled = resolveSimpleNumber(entry.value, ctx);
        break;
      case "grenades_on_map":
        markCurrentValueUnused(map.grenadesOnMap, diagnostics);
        map.grenadesOnMap = resolveSimpleNumber(entry.value, ctx);
        break;
      case "shortcuts_on_map":
        markCurrentValueUnused(map.shortcutsOnMap, diagnostics);
        map.shortcutsOnMap = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "equipment_on_map":
        markCurrentValueUnused(map.equipmentOnMap, diagnostics);
        map.equipmentOnMap = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "powerups_on_map":
        markCurrentValueUnused(map.powerupsOnMap, diagnostics);
        map.powerupsOnMap = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "turrets_on_map":
        markCurrentValueUnused(map.turretsOnMap, diagnostics);
        map.turretsOnMap = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "indestructible_vehicles":
        markCurrentValueUnused(map.indestructibleVehicles, diagnostics);
        map.indestructibleVehicles = resolveSimpleNumber(entry.value, ctx);
        break;
      case "red_powerup_duration":
        markCurrentValueUnused(map.redPowerupDurationSeconds, diagnostics);
        map.redPowerupDurationSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "blue_powerup_duration":
        markCurrentValueUnused(map.bluePowerupDurationSeconds, diagnostics);
        map.bluePowerupDurationSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "yellow_powerup_duration":
        markCurrentValueUnused(map.yellowPowerupDurationSeconds, diagnostics);
        map.yellowPowerupDurationSeconds = resolveSimpleNumber(entry.value, ctx);
        break;
      case "weapon_set":
        markCurrentValueUnused(map.weaponSetAbsoluteIndex, diagnostics);
        map.weaponSetAbsoluteIndex = lowerWeaponSet(entry.value, symbolTable);
        break;
      case "vehicle_set":
        markCurrentValueUnused(map.vehicleSetAbsoluteIndex, diagnostics);
        map.vehicleSetAbsoluteIndex = lowerVehicleSet(entry.value, symbolTable);
        break;
      case "tu1_always_spillover_damage":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.alwaysSpilloverDamage,
          diagnostics
        );
        ir.gameVariant.tu1Settings.alwaysSpilloverDamage = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_armor_lock_stickies_remain":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.armorLockStickiesRemain,
          diagnostics
        );
        ir.gameVariant.tu1Settings.armorLockStickiesRemain =
          resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_attached_damage_bypass_shields":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.attachedDamageBypassShields,
          diagnostics
        );
        ir.gameVariant.tu1Settings.attachedDamageBypassShields =
          resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_active_camo_override_energy_curve":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.activeCamoOverrideEnergyCurve,
          diagnostics
        );
        ir.gameVariant.tu1Settings.activeCamoOverrideEnergyCurve =
          resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_sword_gun_clang_kills":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.swordGunClangKills,
          diagnostics
        );
        ir.gameVariant.tu1Settings.swordGunClangKills = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_magnum_is_automatic":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.magnumIsAutomatic,
          diagnostics
        );
        ir.gameVariant.tu1Settings.magnumIsAutomatic = resolveSimpleBoolean(entry.value, ctx);
        break;
      case "tu1_headshot_weapon_reticule_bloom_multiplier":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.precisionBloom,
          diagnostics
        );
        ir.gameVariant.tu1Settings.precisionBloom = resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_armor_lock_damage_to_energy_transfer":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.armorLockDamageDrain,
          diagnostics
        );
        ir.gameVariant.tu1Settings.armorLockDamageDrain = resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_armor_lock_damage_to_energy_cap":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.armorLockDamageDrainLimit,
          diagnostics
        );
        ir.gameVariant.tu1Settings.armorLockDamageDrainLimit =
          resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_active_camo_override_energy_curve_min":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.activeCamoEnergyCurveMin,
          diagnostics
        );
        ir.gameVariant.tu1Settings.activeCamoEnergyCurveMin =
          resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_active_camo_override_energy_curve_max":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.activeCamoEnergyCurveMax,
          diagnostics
        );
        ir.gameVariant.tu1Settings.activeCamoEnergyCurveMax =
          resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_magnum_damage_multiplier":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.magnumDamage,
          diagnostics
        );
        ir.gameVariant.tu1Settings.magnumDamage = resolveSimpleNumber(entry.value, ctx);
        break;
      case "tu1_magnum_fire_recovery_time_multiplier":
        markCurrentValueUnused(
          ir.gameVariant.tu1Settings.magnumFireDelay,
          diagnostics
        );
        ir.gameVariant.tu1Settings.magnumFireDelay = resolveSimpleNumber(entry.value, ctx);
        break;
      default:
        throw new LowerError(
          diagnosticMessages.unknownGameOptionOverride(optionName),
          entry.location
        );
    }
  });
};
