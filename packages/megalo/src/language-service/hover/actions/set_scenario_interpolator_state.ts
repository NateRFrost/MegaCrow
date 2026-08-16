import { defineActionHover } from "src/language-service/hover/registry";

export const setScenarioInterpolatorStateHover = defineActionHover(
  "set_scenario_interpolator_state",
  {
    grammar:
      "action set_scenario_interpolator_state <interpolator index> <boolean active>",
    params: ["interpolator_index", "boolean_active"],
  }
);
