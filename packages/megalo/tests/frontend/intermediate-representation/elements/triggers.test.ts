import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import { ActionType, MathOperation } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { ConditionType } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import {
  TriggerExecutionMode,
  TriggerType,
} from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";
import { Lexer } from "../../../../frontend/tokens";
import { VersionConfiguration107MCC } from "../../../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../../../version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(new VersionConfiguration107MCC()).lower(
    ast,
    diagnostics,
    { objectLists }
  );
  return { ir, diagnostics };
};

describe("trigger lowering", () => {
  it("lowers a general trigger with condition and action", () => {
    const source = `trigger general
\tcondition game_is_forge
\taction end_round
end
`;
    const { ir, diagnostics } = lower(source);
    const { conditions, actions, triggers } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({
      executionMode: TriggerExecutionMode.General,
      triggerType: TriggerType.Normal,
      firstCondition: 0,
      conditionCount: 1,
      firstAction: 0,
      actionCount: 1,
    });
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toMatchObject({
      type: ConditionType.GameIsForge,
      negated: false,
      unionGroup: 0,
      executeBeforeAction: 0,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe(ActionType.EndRound);
  });

  it("flattens nested begin with body before the begin action globally", () => {
    const source = `trigger general
\taction end_round
\tbegin
\t\taction print_variable "inner"
\tend
\taction end_round
end
`;
    const { ir, diagnostics } = lower(source);
    const { actions, triggers } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(actions.map((action) => action.type)).toEqual([
      ActionType.PrintVariable,
      ActionType.EndRound,
      ActionType.Begin,
      ActionType.EndRound,
    ]);
    expect(triggers[0]).toMatchObject({
      firstAction: 1,
      actionCount: 3,
    });
    const begin = actions[2];
    expect(begin?.type).toBe(ActionType.Begin);
    if (begin?.type === ActionType.Begin) {
      expect(begin.parameters).toEqual({
        firstConditionIndex: 0,
        conditionCount: 0,
        firstActionIndex: 0,
        actionCount: 1,
      });
    }
  });

  it("sets initialization trigger index", () => {
    const source = `trigger initialization
\taction end_round
end
`;
    const { ir, diagnostics } = lower(source);
    const engine = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(engine.triggers[0]?.triggerType).toBe(TriggerType.Initialization);
    expect(engine.initializationTriggerIndex).toBe(0);
  });

  it("keeps union groups for or'd conditions", () => {
    const source = `trigger general
\tcondition game_is_forge or
\tcondition game_is_forge
\taction end_round
end
`;
    const { ir, diagnostics } = lower(source);
    const { conditions } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(conditions).toHaveLength(2);
    expect(conditions[0]?.unionGroup).toBe(0);
    expect(conditions[1]?.unionGroup).toBe(0);
  });

  it("lowers set and temporary to Set actions", () => {
    const source = `trigger general
\ttemporary number n 0
\taction set n set_to 1
\taction end_round
end
`;
    const { ir, diagnostics } = lower(source);
    const { actions } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(actions.map((action) => action.type)).toEqual([
      ActionType.Set,
      ActionType.Set,
      ActionType.EndRound,
    ]);
    expect(actions[0]?.type).toBe(ActionType.Set);
    if (actions[0]?.type === ActionType.Set) {
      expect(actions[0].parameters.operation).toBe(MathOperation.SetTo);
    }
  });

  it("lowers for_each to a nested subroutine trigger", () => {
    const source = `trigger general
\taction for_each player
\t\taction end_round
\tend
end
`;
    const { ir, diagnostics } = lower(source);
    const { actions, triggers } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toMatchObject({
      executionMode: TriggerExecutionMode.Player,
      triggerType: TriggerType.Subroutine,
      firstAction: 0,
      actionCount: 1,
    });
    expect(triggers[1]).toMatchObject({
      executionMode: TriggerExecutionMode.General,
      triggerType: TriggerType.Normal,
      firstAction: 1,
      actionCount: 1,
    });
    expect(actions.map((action) => action.type)).toEqual([
      ActionType.EndRound,
      ActionType.ForEach,
    ]);
    expect(actions[1]).toMatchObject({
      type: ActionType.ForEach,
      parameters: { triggerIndex: 0 },
    });
  });

  it("lowers apply_player_traits by named player_traits declaration index", () => {
    const source = `string_table english
\ttraits_name_vip "VIP"
\ttraits_description_vip "VIP traits"
\ttraits_name_carrier "Carrier"
\ttraits_description_carrier "Carrier traits"
end
game_options
\tplayer_traits vip_traits traits_name_vip traits_description_vip
\tend
\tplayer_traits flag_carrier_traits traits_name_carrier traits_description_carrier
\tend
end
trigger player
\taction apply_player_traits current_player flag_carrier_traits
end
`;
    const { ir, diagnostics } = lower(source);
    const { actions } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: ActionType.ApplyPlayerTraits,
      parameters: { traitIndex: 1 },
    });
  });
});
