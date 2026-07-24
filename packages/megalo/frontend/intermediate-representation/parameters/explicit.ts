import {
  type TemporaryStorageName,
  isTemporaryStorageName,
} from "../../abstract-syntax-tree/elements/trigger/temporary";
import {
  type TeamDesignator,
  isTeamDesignator,
} from "../../language-configuration/omni/teams";
import { MultiplayerTeamDesignator } from "../game/game_engine_default";
import { ExplicitObject } from "../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../game/megalogamengine/megalogamengine_explicit_team";

/**
 * Reverse lookup for the built-in player identifiers that appear in Megalo
 * source. Numbered slots (`player_N`, `global_N`, `temporary_N`) are absent:
 * named/global players resolve through the slot table / `global_player_N`
 * suffix, and temporaries resolve by index onto the `Temporary*` enum members
 * (see {@link parseExplicitPlayer}), so none of them reach this map.
 */
const PLAYER_EXPLICIT_NAMES: Partial<Record<ExplicitPlayer, string>> = {
  [ExplicitPlayer.None]: "no_player",
  [ExplicitPlayer.Current]: "current_player",
  [ExplicitPlayer.Hud]: "hud_player",
  [ExplicitPlayer.HudTarget]: "hud_target_player",
  [ExplicitPlayer.Killer]: "killer",
};

/**
 * Reverse lookup for the built-in object identifiers that appear in Megalo
 * source. Numbered slots (`global_N`, `temporary_N`) are absent: global objects
 * are addressed as `object_N` / `global_object_N`, and temporaries resolve by
 * index onto the `Temporary*` enum members (see {@link parseExplicitObject}),
 * so neither reaches this map.
 */
const OBJECT_EXPLICIT_NAMES: Partial<Record<ExplicitObject, string>> = {
  [ExplicitObject.None]: "none",
  [ExplicitObject.Current]: "current_object",
  [ExplicitObject.HudTarget]: "hud_target_object",
  [ExplicitObject.Killed]: "killed_object",
  [ExplicitObject.Killer]: "killer_object",
};

const OBJECT_EXPLICIT_ALIASES: Record<string, ExplicitObject> = {
  object_death_dead_object: ExplicitObject.Killed,
  object_death_killing_object: ExplicitObject.Killer,
};

/**
 * Reverse lookup for the built-in team identifiers that appear in Megalo
 * source. Numbered slots (`team_N`, `global_N`, `temporary_N`) are absent:
 * global teams are addressed as `global_team_N`, and `team_N` / temporaries
 * resolve by index onto the `Team*` / `Temporary*` enum members (see
 * {@link parseExplicitTeam}), so none of them reach this map.
 */
const TEAM_EXPLICIT_NAMES: Partial<Record<ExplicitTeam, string>> = {
  [ExplicitTeam.None]: "none",
  [ExplicitTeam.neutral]: "neutral",
  [ExplicitTeam.CurrentTeam]: "current_team",
  [ExplicitTeam.LocalTeam]: "hud_player_owner_team",
  [ExplicitTeam.TargetTeam]: "hud_target_player_owner_team",
};

/**
 * Team slot index for each multiplayer designator name. Values come from the
 * authoritative {@link MultiplayerTeamDesignator} enum (not the declaration
 * order of `TEAM_DESIGNATORS`, which differs), and the `Record<TeamDesignator>`
 * key type keeps this exhaustive with the canonical designator list.
 */
export const TEAM_DESIGNATOR_INDICES: Record<TeamDesignator, number> = {
  attackers: MultiplayerTeamDesignator.Attackers,
  defenders: MultiplayerTeamDesignator.Defenders,
  third_party: MultiplayerTeamDesignator.ThirdParty,
  fourth_party: MultiplayerTeamDesignator.FourthParty,
  fifth_party: MultiplayerTeamDesignator.FifthParty,
  sixth_party: MultiplayerTeamDesignator.SixthParty,
  seventh_party: MultiplayerTeamDesignator.SeventhParty,
  eighth_party: MultiplayerTeamDesignator.EighthParty,
};

/**
 * The temporary storages that use a qualified `temporary_<storage>_N` reference:
 * the declarable {@link TemporaryStorageName} minus `number`, which instead
 * compiles to a bare `temporary_N`.
 */
export type TemporaryStorage = Exclude<TemporaryStorageName, "number">;

export const parseQualifiedTemporaryName = (
  name: string
): { storage: TemporaryStorage; index: number } | undefined => {
  const match = /^temporary_(object|player|team)_(\d+)$/.exec(name);
  if (!match) {
    return undefined;
  }
  const storage = match[1];
  if (!isTemporaryStorageName(storage) || storage === "number") {
    return undefined;
  }
  return {
    storage,
    index: Number(match[2]),
  };
};

export const isTemporaryCompiledName = (name: string): boolean =>
  /^temporary_(object|player|team)_\d+$/.test(name) ||
  /^temporary_\d+$/.test(name);

const findEnumByName = <T extends number>(
  names: Partial<Record<T, string>>,
  name: string
): T | undefined => {
  const entry = Object.entries(names).find(([, value]) => value === name);
  return entry === undefined ? undefined : (Number(entry[0]) as T);
};

/** Matches a bare temporary slot reference (`temporary_0`, `temporary_1`, …). */
const parseTemporaryIndex = (name: string): number | undefined => {
  const match = /^temporary_(\d+)$/.exec(name);
  return match ? Number(match[1]) : undefined;
};

/** Matches a numbered team slot reference (`team_0`, `team_1`, …). */
const parseTeamSlotIndex = (name: string): number | undefined => {
  const match = /^team_(\d+)$/.exec(name);
  return match ? Number(match[1]) : undefined;
};

/**
 * Resolves a numbered slot (`Temporary3`, `Team1`, …) to its enum value.
 * Throws if the slot index is out of range for the enum.
 */
/**
 * Resolves a numbered slot (`Global3`, `Temporary1`, `Team0`, …) to its enum
 * value. The result type `T` is inferred from the call context (e.g. the
 * function's return type), so callers get a properly typed enum member without
 * casting. Throws if the slot index is out of range for the enum.
 */
export const enumSlotValue = <T extends number>(
  enumObj: Record<string, string | number>,
  prefix: "Global" | "Temporary" | "Team",
  index: number
): T => {
  const value = enumObj[`${prefix}${index}`];
  if (typeof value !== "number") {
    throw new Error(`Unknown ${prefix.toLowerCase()} slot index ${index}`);
  }
  return value as T;
};

export const parseExplicitPlayer = (name: string): ExplicitPlayer => {
  if (name === "none") {
    return ExplicitPlayer.None;
  }
  if (name === "local_player") {
    return ExplicitPlayer.Hud;
  }
  if (name === "object_death_killing_player") {
    return ExplicitPlayer.Killer;
  }
  const qualified = parseQualifiedTemporaryName(name);
  if (qualified?.storage === "player") {
    return enumSlotValue(ExplicitPlayer, "Temporary", qualified.index);
  }
  const temporaryIndex = parseTemporaryIndex(name);
  if (temporaryIndex !== undefined) {
    return enumSlotValue(ExplicitPlayer, "Temporary", temporaryIndex);
  }
  const found = findEnumByName(PLAYER_EXPLICIT_NAMES, name);
  if (found !== undefined) {
    return found;
  }
  throw new Error(`Unknown explicit player '${name}'`);
};

export const tryParseExplicitPlayer = (
  name: string
): ExplicitPlayer | undefined => {
  try {
    return parseExplicitPlayer(name);
  } catch {
    return undefined;
  }
};

export const parseExplicitObject = (name: string): ExplicitObject => {
  const qualified = parseQualifiedTemporaryName(name);
  if (qualified?.storage === "object") {
    return enumSlotValue(ExplicitObject, "Temporary", qualified.index);
  }
  const temporaryIndex = parseTemporaryIndex(name);
  if (temporaryIndex !== undefined) {
    return enumSlotValue(ExplicitObject, "Temporary", temporaryIndex);
  }
  const alias = OBJECT_EXPLICIT_ALIASES[name];
  if (alias !== undefined) {
    return alias;
  }
  const found = findEnumByName(OBJECT_EXPLICIT_NAMES, name);
  if (found !== undefined) {
    return found;
  }
  if (name === "none") {
    return ExplicitObject.None;
  }
  throw new Error(`Unknown explicit object '${name}'`);
};

export const tryParseExplicitObject = (
  name: string
): ExplicitObject | undefined => {
  try {
    return parseExplicitObject(name);
  } catch {
    return undefined;
  }
};

export const parseExplicitTeam = (name: string): ExplicitTeam => {
  const qualified = parseQualifiedTemporaryName(name);
  if (qualified?.storage === "team") {
    return enumSlotValue(ExplicitTeam, "Temporary", qualified.index);
  }
  const temporaryIndex = parseTemporaryIndex(name);
  if (temporaryIndex !== undefined) {
    return enumSlotValue(ExplicitTeam, "Temporary", temporaryIndex);
  }
  const teamSlotIndex = parseTeamSlotIndex(name);
  if (teamSlotIndex !== undefined) {
    return enumSlotValue(ExplicitTeam, "Team", teamSlotIndex);
  }
  const found = findEnumByName(TEAM_EXPLICIT_NAMES, name);
  if (found !== undefined) {
    return found;
  }
  if (isTeamDesignator(name)) {
    return enumSlotValue(ExplicitTeam, "Team", TEAM_DESIGNATOR_INDICES[name]);
  }
  throw new Error(`Unknown explicit team '${name}'`);
};

export const tryParseExplicitTeam = (
  name: string
): ExplicitTeam | undefined => {
  try {
    return parseExplicitTeam(name);
  } catch {
    return undefined;
  }
};

export const parseIndexSuffix = (
  name: string,
  prefix: string
): number | undefined => {
  if (name === prefix) {
    return 0;
  }
  if (name.startsWith(`${prefix}_`)) {
    return Number(name.slice(prefix.length + 1));
  }
  return undefined;
};
