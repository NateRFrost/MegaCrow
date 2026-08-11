import {
  e_trigger_execution_mode,
  e_trigger_type,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  TriggerExecutionMode,
  TriggerType,
} from "../../../intermediate-representation/game/megalogamengine/megalogamengine_trigger";

export const encodeTriggerExecutionMode = (
  value: TriggerExecutionMode
): e_trigger_execution_mode => {
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
      return e_trigger_execution_mode.object;
    case TriggerExecutionMode.ObjectWithLabel:
      return e_trigger_execution_mode.object_with_label;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
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
