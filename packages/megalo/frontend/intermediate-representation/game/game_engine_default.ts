import type { ContentItemMetadata } from "../saved_games/saved_game_files";
import type {
  GrenadeCountSetting,
  PlayerTraits,
} from "./game_engine_player_traits";
import type { StringTableEntry, StringTableReference } from "./string_table";

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

export enum TeamScoringMethod {
  Sum = 0,
  Minimum = 1,
  Maximum = 2,
}

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

export enum MultiplayerTeamDesignator {
  None = -1,
  Defenders = 0,
  Attackers = 1,
  ThirdParty = 2,
  FourthParty = 3,
  FifthParty = 4,
  SixthParty = 5,
  SeventhParty = 6,
  EighthParty = 7,
  Neutral = 8,
}

export enum PlayerModelChoice {
  Spartan = 0,
  Elite = 1,
}

export enum TeamOptionsModelOverrideType {
  None = 0,
  Spartan = 1,
  Elite = 2,
  SetByTeam = 3,
  ByDesignator = 4,
}

export type Color = {
  r: number;
  g: number;
  b: number;
};

export type GameEngineTeamOptionsTeam = Partial<{
  name: StringTableEntry;
  designator: MultiplayerTeamDesignator;
  model: PlayerModelChoice;
  teamColor: Color;
  fireteamCount: number;
}>;

export enum DesignatorSwitchType {
  None = 0,
  Random = 1,
  Rotate = 2,
}

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

export type GameEngineBaseVariant = {
  metadata: ContentItemMetadata;
  builtIn: boolean;
  teamScoringMethod?: TeamScoringMethod;
  miscellaneousOptions: GameEngineMiscellaneousOptions;
  respawnOptions: GameEngineRespawnOptions;
  socialOptions: GameEngineSocialOptions;
  mapOverrideOptions: GameEngineMapOverrideOptions;
  teamOptions: GameEngineTeamOptions;
  loadoutTraits: GameEngineLoadoutTraits;
};
