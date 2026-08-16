import {
  type c_game_engine_custom_variant,
  c_trigger,
} from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  encodeTriggerExecutionMode,
  encodeTriggerType,
} from "src/backend/compile/106/enums/e_trigger";
import type { IR } from "src/frontend/intermediate-representation";
import type { Trigger } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";

const compileTrigger = (trigger: Trigger): c_trigger => {
  const target = new c_trigger();
  target.m_execution_mode = encodeTriggerExecutionMode(trigger.executionMode);
  target.m_trigger_type = encodeTriggerType(trigger.triggerType);
  target.m_object_filter_index = trigger.objectFilterIndex ?? -1;
  target.m_first_condition = trigger.firstCondition;
  target.m_condition_count = trigger.conditionCount;
  target.m_first_action = trigger.firstAction;
  target.m_action_count = trigger.actionCount;
  return target;
};

export const compileTriggers = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const engine = ir.gameVariant.gameEngine;
  gameVariant.m_game_engine.m_triggers = engine.triggers.map(compileTrigger);
  gameVariant.m_game_engine.m_initialization_trigger_index =
    engine.initializationTriggerIndex;
  gameVariant.m_game_engine.m_local_initialization_trigger_index =
    engine.localInitializationTriggerIndex;
  gameVariant.m_game_engine.m_host_migration_trigger_index =
    engine.hostMigrationTriggerIndex;
  gameVariant.m_game_engine.m_double_migration_trigger_index =
    engine.doubleMigrationTriggerIndex;
  gameVariant.m_game_engine.m_object_death_event_trigger_index =
    engine.objectDeathEventTriggerIndex;
  gameVariant.m_game_engine.m_local_trigger_index = engine.localTriggerIndex;
  gameVariant.m_game_engine.m_pregame_trigger_index =
    engine.pregameTriggerIndex;
};
