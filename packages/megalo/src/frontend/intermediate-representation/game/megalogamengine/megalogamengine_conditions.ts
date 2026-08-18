import type {
  CustomTimerReference,
  ObjectReference,
  ObjectTypeReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { VariantVariable } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";

export const numericComparison = megaloEnum(
  [
    "less_than",
    { name: "<", aliasOf: "less_than" },
    "greater_than",
    { name: ">", aliasOf: "greater_than" },
    "equal_to",
    { name: "==", aliasOf: "equal_to" },
    "less_than_or_equal_to",
    { name: "<=", aliasOf: "less_than_or_equal_to" },
    "greater_than_or_equal_to",
    { name: ">=", aliasOf: "greater_than_or_equal_to" },
    "not_equal_to",
    { name: "!=", aliasOf: "not_equal_to" },
  ] as const,
  (version) => {
    const supported = new Set<
      | "less_than"
      | "greater_than"
      | "equal_to"
      | "less_than_or_equal_to"
      | "greater_than_or_equal_to"
      | "not_equal_to"
    >(["less_than", "greater_than", "equal_to", "not_equal_to"]);
    if (version.version >= 73) {
      supported.add("less_than_or_equal_to");
      supported.add("greater_than_or_equal_to");
    }
    return supported;
  }
);
export const NumericComparison = numericComparison.enum;
export type NumericComparison = MegaloEnumNames<typeof numericComparison>;

export const conditionType = megaloEnum(
  [
    "if",
    "object_in_area",
    "player_died",
    "team_disposition",
    "timer_expired",
    "object_is_type",
    "team_is_active",
    "object_out_of_bounds",
    "player_is_fire_team_leader",
    "player_assisted_with_kill",
    "object_matches_filter",
    "player_is_active",
    "equipment_is_active",
    "player_is_spartan",
    "player_is_elite",
    "player_is_editor",
    "game_is_forge",
  ] as const,
  (version) => {
    const supported = new Set<
      | "if"
      | "object_in_area"
      | "player_died"
      | "team_disposition"
      | "timer_expired"
      | "object_is_type"
      | "team_is_active"
      | "object_out_of_bounds"
      | "player_is_fire_team_leader"
      | "player_assisted_with_kill"
      | "object_matches_filter"
      | "player_is_active"
      | "equipment_is_active"
      | "player_is_spartan"
      | "player_is_elite"
      | "player_is_editor"
      | "game_is_forge"
    >([
      "if",
      "object_in_area",
      "player_died",
      "team_disposition",
      "timer_expired",
      "object_is_type",
      "team_is_active",
      "object_out_of_bounds",
      "player_is_fire_team_leader",
      "player_assisted_with_kill",
      "object_matches_filter",
      "player_is_active",
      "equipment_is_active",
    ]);
    // TU1+ expands the condition opcode to 5 bits.
    if (version.version >= 107) {
      supported.add("player_is_spartan");
      supported.add("player_is_elite");
      supported.add("player_is_editor");
      supported.add("game_is_forge");
    }
    return supported;
  }
);
export const ConditionType = conditionType.enum;
export type ConditionType = MegaloEnumNames<typeof conditionType>;

export interface ConditionIfParameters {
  comparison: NumericComparison;
  left: VariantVariable;
  right: VariantVariable;
}

export interface ConditionObjectInAreaParameters {
  area: ObjectReference;
  object: ObjectReference;
}

export enum PlayerDeathKillerType {
  Environment = 0,
  Suicide = 1,
  Enemy = 2,
  Betrayal = 3,
  QuitGame = 4,
}

export interface PlayerDeathKillerTypeFlags {
  betrayal: boolean;
  enemy: boolean;
  environment: boolean;
  quit_game: boolean;
  suicide: boolean;
}

export interface ConditionPlayerDiedParameters {
  killerType: PlayerDeathKillerTypeFlags;
  player: PlayerReference;
}

export const disposition = megaloEnum([
  "neutral",
  "friendly",
  "enemy",
] as const);
export const Disposition = disposition.enum;
export type Disposition = MegaloEnumNames<typeof disposition>;

export interface ConditionTeamDispositionParameters {
  disposition: Disposition;
  team1: TeamReference;
  team2: TeamReference;
}

export interface ConditionTimerExpiredParameters {
  timer: CustomTimerReference;
}

export interface ConditionObjectIsTypeParameters {
  object: ObjectReference;
  objectType: ObjectTypeReference;
}

export interface ConditionTeamIsActiveParameters {
  team: TeamReference;
}

export interface ConditionObjectOutOfBoundsParameters {
  object: ObjectReference;
}

export interface ConditionPlayerIsFireTeamLeaderParameters {
  player: PlayerReference;
}

export interface ConditionPlayerAssistedWithKillParameters {
  player1: PlayerReference;
  player2: PlayerReference;
}

export interface ConditionObjectMatchesFilterParameters {
  filterIndex: number;
  object: ObjectReference;
}

export interface ConditionPlayerIsActiveParameters {
  player: PlayerReference;
}

export interface ConditionEquipmentIsActiveParameters {
  object: ObjectReference;
}

export interface ConditionPlayerIsSpartanParameters {
  player: PlayerReference;
}

export interface ConditionPlayerIsEliteParameters {
  player: PlayerReference;
}

export interface ConditionPlayerIsEditorParameters {
  player: PlayerReference;
}

export type ConditionGameIsForgeParameters = never;

interface ConditionBase {
  executeBeforeAction: number;
  negated: boolean;
  unionGroup: number;
}

interface ConditionParameters<T extends ConditionType, P> {
  parameters: P;
  type: T;
}

export type Condition = ConditionBase &
  (
    | ConditionParameters<"if", ConditionIfParameters>
    | ConditionParameters<"object_in_area", ConditionObjectInAreaParameters>
    | ConditionParameters<"player_died", ConditionPlayerDiedParameters>
    | ConditionParameters<
        "team_disposition",
        ConditionTeamDispositionParameters
      >
    | ConditionParameters<"timer_expired", ConditionTimerExpiredParameters>
    | ConditionParameters<"object_is_type", ConditionObjectIsTypeParameters>
    | ConditionParameters<"team_is_active", ConditionTeamIsActiveParameters>
    | ConditionParameters<
        "object_out_of_bounds",
        ConditionObjectOutOfBoundsParameters
      >
    | ConditionParameters<
        "player_is_fire_team_leader",
        ConditionPlayerIsFireTeamLeaderParameters
      >
    | ConditionParameters<
        "player_assisted_with_kill",
        ConditionPlayerAssistedWithKillParameters
      >
    | ConditionParameters<
        "object_matches_filter",
        ConditionObjectMatchesFilterParameters
      >
    | ConditionParameters<"player_is_active", ConditionPlayerIsActiveParameters>
    | ConditionParameters<
        "equipment_is_active",
        ConditionEquipmentIsActiveParameters
      >
    | ConditionParameters<
        "player_is_spartan",
        ConditionPlayerIsSpartanParameters
      >
    | ConditionParameters<"player_is_elite", ConditionPlayerIsEliteParameters>
    | ConditionParameters<"player_is_editor", ConditionPlayerIsEditorParameters>
    | ConditionParameters<"game_is_forge", ConditionGameIsForgeParameters>
  );
