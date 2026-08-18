import {
  type c_game_engine_custom_variant,
  c_trigger,
  e_trigger_execution_mode,
} from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import {
  encodeTriggerType,
  triggerExecutionModeName,
  tryEncodeTriggerExecutionMode,
} from "src/backend/compile/49/enums/e_trigger";
import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { IR } from "src/frontend/intermediate-representation";
import type { Trigger } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";
import { getLabel, MEGALO_VERSIONS } from "src/version";

const compileTrigger = (
  trigger: Trigger,
  ir: IR,
  diagnostics: Diagnostics
): c_trigger => {
  const target = new c_trigger();
  const executionMode = tryEncodeTriggerExecutionMode(trigger.executionMode);
  if (executionMode === undefined) {
    diagnostics.addError(
      diagnosticMessages.unsupportedEnumMember(
        "Trigger execution mode",
        triggerExecutionModeName(trigger.executionMode),
        getLabel(MEGALO_VERSIONS["49"])
      ),
      ir.locations.get(trigger, "executionMode") ?? BUILT_IN_LOCATION
    );
    target.m_execution_mode = e_trigger_execution_mode.general;
  } else {
    target.m_execution_mode = executionMode;
  }
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
  gameVariant: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  const engine = ir.gameVariant.gameEngine;
  if (engine.doubleMigrationTriggerIndex >= 0) {
    diagnostics.addError(
      diagnosticMessages.unsupportedEnumMember(
        "Trigger type",
        "double_migration",
        getLabel(MEGALO_VERSIONS["49"])
      ),
      ir.locations.get(engine, "doubleMigrationTriggerIndex") ??
        BUILT_IN_LOCATION
    );
  }
  gameVariant.m_game_engine.m_triggers = engine.triggers.map((trigger) =>
    compileTrigger(trigger, ir, diagnostics)
  );
  gameVariant.m_game_engine.m_initialization_trigger_index =
    engine.initializationTriggerIndex;
  gameVariant.m_game_engine.m_host_migration_trigger_index =
    engine.hostMigrationTriggerIndex;
  gameVariant.m_game_engine.m_object_death_event_trigger_index =
    engine.objectDeathEventTriggerIndex;
  gameVariant.m_game_engine.m_local_trigger_index = engine.localTriggerIndex;
};
