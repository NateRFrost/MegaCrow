import type { TriggerElementNode } from "../../../abstract-syntax-tree/elements/trigger";
import { dxAssertionScope } from "../../diagnostics";
import { LowerError } from "../../error";
import type { ElementLowerer } from "..";
import {
  applySpecialTriggerIndex,
  makeTrigger,
  resolveTriggerHeader,
} from "./header";
import {
  GameEngineAppendTarget,
  MAX_TRIGGERS,
} from "./scope";
import { lowerActionScope } from "./statements";

export const triggersLowerer: ElementLowerer<TriggerElementNode> = (
  element,
  ctx
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    const engine = ctx.ir.gameVariant.gameEngine;

    if (engine.triggers.length >= MAX_TRIGGERS) {
      throw new LowerError("Too many triggers!", element.location);
    }

    const isPregame = element.name.value.toLowerCase() === "pregame";
    const header = resolveTriggerHeader(
      element.name.value,
      element.name.location,
      ctx.symbolTable,
      element.name.symbolId,
      false
    );

    const root = new GameEngineAppendTarget(engine);
    const window = lowerActionScope(element.statements, {
      ctx,
      appendTarget: root,
      isPregame,
    });

    const triggerIndex = engine.triggers.length;
    engine.triggers.push(
      makeTrigger(header, {
        firstCondition: window.firstConditionIndex,
        conditionCount: window.conditionCount,
        firstAction: window.firstActionIndex,
        actionCount: window.actionCount,
      })
    );
    applySpecialTriggerIndex(engine, header, triggerIndex);
  });
};
