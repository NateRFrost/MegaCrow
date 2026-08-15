import type {
  GrenadeCountSetting,
  PlayerTraits,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import type {
  StringTableEntry,
  StringTableReference,
} from "src/frontend/intermediate-representation/game/string_table";
import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";
import type { ContentItemMetadata } from "src/frontend/intermediate-representation/saved_games/saved_game_files";

export type GameEngineMiscellaneousOptions = Partial<{
  teamsEnabled: boolean;
  roundResetPlayers: boolean;
  roundResetMap: boolean;
  perfectionEnabled: boolean;
  roundTimeLimitMinutes: number;
  roundCount: number;
  earlyVictoryWinCount: number;
  suddenDeathTimeLimitSeconds: number;
  gracePeriodTimeLimitSeconds: number;
}>;

export type GameEngineRespawnOptions = Partial<{
  inheritRespawnTime: boolean;
  respawnWithTeammate: boolean;
  respawnAtLocation: boolean;
  respawnOnKills: boolean;
  livesPerRound: number;
  teamLivesPerRound: number;
  respawnTimeSeconds: number;
  suicidePenaltySeconds: number;
  betrayalPenaltySeconds: number;
  respawnGrowthSeconds: number;
  loadoutCamTime: number;
  respawnPlayerTraitsDurationSeconds: number;
  respawnPlayerTraits: PlayerTraits[];
}>;

export const teamScoringMethod = megaloEnum([
  "sum",
  "minimum",
  "maximum",
] as const);
export const TeamScoringMethod = teamScoringMethod.enum;
export type TeamScoringMethod = MegaloEnumNames<typeof teamScoringMethod>;

export type GameEngineSocialOptions = Partial<{
  friendlyFireEnabled: number;
  betrayalBootingEnabled: number;
  enemyVoiceEnabled: number;
  openChannelVoiceEnabled: number;
  deadPlayerVoiceEnabled: number;
}>;

export type WeaponSet = "none" | "default" | "random" | number;
export type VehicleSet = "none" | "default" | "random" | number;

export type GameEngineMapOverrideOptions = Partial<{
  grenadesOnMap: number;
  shortcutsOnMap: boolean;
  equipmentOnMap: boolean;
  powerupsOnMap: boolean;
  turretsOnMap: boolean;
  indestructibleVehicles: number;
  basePlayerTraits: PlayerTraits;
  weaponSetAbsoluteIndex: WeaponSet; // object_lists/weapon_sets.txt
  vehicleSetAbsoluteIndex: VehicleSet; // object_lists/vehicle_sets.txt
  redPowerupTraits: PlayerTraits;
  bluePowerupTraits: PlayerTraits;
  yellowPowerupTraits: PlayerTraits;
  redPowerupDurationSeconds: number;
  bluePowerupDurationSeconds: number;
  yellowPowerupDurationSeconds: number;
}>;

export const multiplayerTeamDesignator = megaloEnum([
  "none",
  "defenders",
  "attackers",
  "third_party",
  "fourth_party",
  "fifth_party",
  "sixth_party",
  "seventh_party",
  "eighth_party",
  "neutral",
] as const);
export const MultiplayerTeamDesignator = multiplayerTeamDesignator.enum;
export type MultiplayerTeamDesignator = MegaloEnumNames<
  typeof multiplayerTeamDesignator
>;

export const playerModelChoice = megaloEnum(["spartan", "elite"] as const);
export const PlayerModelChoice = playerModelChoice.enum;
export type PlayerModelChoice = MegaloEnumNames<typeof playerModelChoice>;

export const teamOptionsModelOverrideType = megaloEnum([
  "none",
  "spartan",
  "elite",
  "set_by_team",
  "by_designator",
] as const);
export const TeamOptionsModelOverrideType = teamOptionsModelOverrideType.enum;
export type TeamOptionsModelOverrideType = MegaloEnumNames<
  typeof teamOptionsModelOverrideType
>;

export interface Color {
  b: number;
  g: number;
  r: number;
}

export type GameEngineTeamOptionsTeam = Partial<{
  name: StringTableEntry;
  designator: MultiplayerTeamDesignator;
  model: PlayerModelChoice;
  teamColor: Color;
  fireteamCount: number;
}>;

export const designatorSwitchType = megaloEnum([
  "none",
  "random",
  "rotate",
] as const);
export const DesignatorSwitchType = designatorSwitchType.enum;
export type DesignatorSwitchType = MegaloEnumNames<typeof designatorSwitchType>;

export type GameEngineTeamOptions = Partial<{
  model: TeamOptionsModelOverrideType;
  designatorSwitchType: DesignatorSwitchType;
  teams: GameEngineTeamOptionsTeam[];
}>;

export type LoadoutTraits = Partial<{
  name: StringTableReference; // Index in string table
  initialPrimaryWeaponAbsoluteIndex: number; // object_lists/weapons.txt
  initialSecondaryWeaponAbsoluteIndex: number; // object_lists/weapons.txt
  initialEquipmentAbsoluteIndex: number; // object_lists/equipment.txt
  initialGrenadeCountSetting: GrenadeCountSetting;
}>;

export type LoadoutPaletteTraits = Partial<{
  loadouts: LoadoutTraits[];
}>;

export type GameEngineLoadoutTraits = Partial<{
  spartanLoadoutsEnabled: boolean;
  eliteLoadoutsEnabled: boolean;
  loadoutPalettes: LoadoutPaletteTraits[];
}>;

export interface GameEngineBaseVariant {
  builtIn: boolean;
  loadoutTraits: GameEngineLoadoutTraits;
  mapOverrideOptions: GameEngineMapOverrideOptions;
  metadata: ContentItemMetadata;
  miscellaneousOptions: GameEngineMiscellaneousOptions;
  respawnOptions: GameEngineRespawnOptions;
  socialOptions: GameEngineSocialOptions;
  teamOptions: GameEngineTeamOptions;
  teamScoringMethod?: TeamScoringMethod;
}
