import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import {
  ActionType,
  MathOperation,
} from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { ConditionType } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import {
  TriggerExecutionMode,
  TriggerType,
} from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";
import { Lexer } from "../../../../src/frontend/tokens";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { MEGALO_VERSIONS } from "../../../../src/version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(ast, diagnostics, { objectLists });
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
      type: ConditionType.game_is_forge,
      negated: false,
      unionGroup: 0,
      executeBeforeAction: 0,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe(ActionType.end_round);
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
      ActionType.print_variable,
      ActionType.end_round,
      ActionType.begin,
      ActionType.end_round,
    ]);
    expect(triggers[0]).toMatchObject({
      firstAction: 1,
      actionCount: 3,
    });
    const begin = actions[2];
    expect(begin?.type).toBe(ActionType.begin);
    if (begin?.type === ActionType.begin) {
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
      ActionType.set,
      ActionType.set,
      ActionType.end_round,
    ]);
    expect(actions[0]?.type).toBe(ActionType.set);
    if (actions[0]?.type === ActionType.set) {
      expect(actions[0].parameters.operation).toBe(MathOperation.set_to);
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
    // Pre-order: parent trigger is reserved before nested for_each body.
    expect(triggers[0]).toMatchObject({
      executionMode: TriggerExecutionMode.General,
      triggerType: TriggerType.Normal,
      firstAction: 1,
      actionCount: 1,
    });
    expect(triggers[1]).toMatchObject({
      executionMode: TriggerExecutionMode.Player,
      triggerType: TriggerType.Subroutine,
      firstAction: 0,
      actionCount: 1,
    });
    expect(actions.map((action) => action.type)).toEqual([
      ActionType.end_round,
      ActionType.for_each,
    ]);
    expect(actions[1]).toMatchObject({
      type: ActionType.for_each,
      parameters: { triggerIndex: 1 },
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
      type: ActionType.apply_player_traits,
      parameters: { traitIndex: 1 },
    });
  });

  it("lowers play_sound with everyone, immediate, and sound name", () => {
    const source = `trigger general
\taction play_sound everyone immediate covy_win1
end
`;
    const { ir, diagnostics } = lower(source);
    const { actions } = ir.gameVariant.gameEngine;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: ActionType.play_sound,
      parameters: {
        immediate: true,
        soundIndex: "covy_win1",
        target: { type: "everyone" },
      },
    });
  });
});
