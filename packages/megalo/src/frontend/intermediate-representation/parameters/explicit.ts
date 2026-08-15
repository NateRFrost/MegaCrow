import {
  isTemporaryStorageName,
  type TemporaryStorageName,
} from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";
import { MultiplayerTeamDesignator } from "src/frontend/intermediate-representation/game/game_engine_default";
import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  isTeamDesignator,
  type TeamDesignator,
} from "src/frontend/language-configuration/omni/teams";

const PLAYER_EXPLICIT_NAMES: Partial<Record<ExplicitPlayer, string>> = {
  [ExplicitPlayer.None]: "none",
  [ExplicitPlayer.Current]: "current_player",
  [ExplicitPlayer.Hud]: "local_player",
  [ExplicitPlayer.HudTarget]: "target_player",
  // MegaloEdit: only valid inside an `object_death` trigger.
  [ExplicitPlayer.Killer]: "object_death_killing_player",
};

const OBJECT_EXPLICIT_NAMES: Partial<Record<ExplicitObject, string>> = {
  [ExplicitObject.None]: "none",
  [ExplicitObject.Current]: "current_object",
  [ExplicitObject.HudTarget]: "target_object",
  // MegaloEdit: only valid inside an `object_death` trigger.
  [ExplicitObject.Killed]: "object_death_dead_object",
  [ExplicitObject.Killer]: "object_death_killing_object",
};

const TEAM_EXPLICIT_NAMES: Partial<Record<ExplicitTeam, string>> = {
  [ExplicitTeam.None]: "none",
  [ExplicitTeam.neutral]: "neutral",
  [ExplicitTeam.CurrentTeam]: "current_team",
  [ExplicitTeam.LocalTeam]: "local_team",
  // Megalo Headache #2: encoded as TargetTeam; MegaloEdit does not parse this name.
  [ExplicitTeam.TargetTeam]: "target_team",
};

export const TEAM_DESIGNATOR_INDICES: Record<
  TeamDesignator,
  MultiplayerTeamDesignator
> = {
  attackers: MultiplayerTeamDesignator.attackers,
  defenders: MultiplayerTeamDesignator.defenders,
  third_party: MultiplayerTeamDesignator.third_party,
  fourth_party: MultiplayerTeamDesignator.fourth_party,
  fifth_party: MultiplayerTeamDesignator.fifth_party,
  sixth_party: MultiplayerTeamDesignator.sixth_party,
  seventh_party: MultiplayerTeamDesignator.seventh_party,
  eighth_party: MultiplayerTeamDesignator.eighth_party,
};

const DESIGNATOR_TO_EXPLICIT_TEAM: Record<TeamDesignator, ExplicitTeam> = {
  defenders: ExplicitTeam.Team0,
  attackers: ExplicitTeam.Team1,
  third_party: ExplicitTeam.Team2,
  fourth_party: ExplicitTeam.Team3,
  fifth_party: ExplicitTeam.Team4,
  sixth_party: ExplicitTeam.Team5,
  seventh_party: ExplicitTeam.Team6,
  eighth_party: ExplicitTeam.Team7,
};

export type TemporaryStorage = Exclude<TemporaryStorageName, "number">;

export const parseQualifiedTemporaryName = (
  name: string
): { storage: TemporaryStorage; index: number } | undefined => {
  const match = /^temporary_(object|player|team)_(\d+)$/.exec(name);
  if (!match) {
    return;
  }
  const storage = match[1];
  if (!isTemporaryStorageName(storage) || storage === "number") {
    return;
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
    return;
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
    return;
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
    return DESIGNATOR_TO_EXPLICIT_TEAM[name];
  }
  throw new Error(`Unknown explicit team '${name}'`);
};

export const tryParseExplicitTeam = (
  name: string
): ExplicitTeam | undefined => {
  try {
    return parseExplicitTeam(name);
  } catch {
    return;
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
  return;
};
