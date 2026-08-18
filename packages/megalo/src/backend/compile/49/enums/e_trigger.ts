import {
  e_trigger_execution_mode,
  e_trigger_type,
} from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import {
  TriggerExecutionMode,
  TriggerType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";

const TRIGGER_EXECUTION_MODE_NAMES: Record<TriggerExecutionMode, string> = {
  [TriggerExecutionMode.General]: "general",
  [TriggerExecutionMode.Player]: "player",
  [TriggerExecutionMode.RandomPlayer]: "random_player",
  [TriggerExecutionMode.Team]: "team",
  [TriggerExecutionMode.Object]: "object",
  [TriggerExecutionMode.ObjectWithLabel]: "object_with_label",
};

export const triggerExecutionModeName = (value: TriggerExecutionMode): string =>
  TRIGGER_EXECUTION_MODE_NAMES[value] ?? String(value);

/**
 * Alpha has a single object mode (4) that always carries a filter index
 * (`-1` for bare `trigger object`). Named map_object filters also use that
 * mode with a real filter index — there is no separate `object_with_label`
 * slot until later encodings.
 */
export const tryEncodeTriggerExecutionMode = (
  value: TriggerExecutionMode
): e_trigger_execution_mode | undefined => {
  switch (value) {
    case TriggerExecutionMode.General:
      return e_trigger_execution_mode.general;
    case TriggerExecutionMode.Player:
      return e_trigger_execution_mode.player;
    case TriggerExecutionMode.RandomPlayer:
      return e_trigger_execution_mode.random_player;
    case TriggerExecutionMode.Team:
      return e_trigger_execution_mode.team;
    case TriggerExecutionMode.Object:
    case TriggerExecutionMode.ObjectWithLabel:
      return e_trigger_execution_mode.object;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};

export const encodeTriggerExecutionMode = (
  value: TriggerExecutionMode
): e_trigger_execution_mode => {
  const mapped = tryEncodeTriggerExecutionMode(value);
  if (mapped === undefined) {
    throw new Error(
      `Trigger execution mode ${triggerExecutionModeName(value)} is not supported on this version`
    );
  }
  return mapped;
};

export const encodeTriggerType = (value: TriggerType): e_trigger_type => {
  switch (value) {
    case TriggerType.Normal:
      return e_trigger_type.normal;
    case TriggerType.Subroutine:
      return e_trigger_type.subroutine;
    case TriggerType.Initialization:
      return e_trigger_type.initialization;
    case TriggerType.LocalInitialization:
      return e_trigger_type.local_initialization;
    case TriggerType.HostMigration:
      return e_trigger_type.host_migration;
    case TriggerType.ObjectDeath:
      return e_trigger_type.object_death;
    case TriggerType.Local:
      return e_trigger_type.local;
    case TriggerType.Pregame:
      return e_trigger_type.pregame;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
