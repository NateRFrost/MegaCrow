import type { TriggerElementNode } from "../../../abstract-syntax-tree/elements/trigger";
import { dxAssertionScope } from "../../diagnostics";
import { LowerError } from "../../error";
import type { ElementLowerer } from "..";
import {
  applySpecialTriggerIndex,
  makeTrigger,
  resolveTriggerHeader,
} from "./header";
import { GameEngineAppendTarget } from "./scope";
import { lowerActionScope } from "./statements";

export const triggersLowerer: ElementLowerer<TriggerElementNode> = (
  element,
  ctx
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    const engine = ctx.ir.gameVariant.gameEngine;
    const { triggers: maxTriggers } = ctx.frontend.versionConfiguration.limits;

    if (engine.triggers.length >= maxTriggers) {
      throw new LowerError("Too many triggers!", element.location);
    }

    const inPregameTrigger = element.name.value.toLowerCase() === "pregame";
    const header = resolveTriggerHeader(
      element.name.value,
      element.name.location,
      ctx.symbolTable,
      element.name.symbolId,
      false
    );

    // Pre-order: reserve this trigger's slot before lowering nested for_each children.
    const triggerIndex = engine.triggers.length;
    engine.triggers.push(
      makeTrigger(header, {
        firstCondition: 0,
        conditionCount: 0,
        firstAction: 0,
        actionCount: 0,
      })
    );
    applySpecialTriggerIndex(engine, header, triggerIndex);

    const root = new GameEngineAppendTarget(engine);
    const previousInPregameTrigger = ctx.inPregameTrigger;
    ctx.inPregameTrigger = inPregameTrigger;
    try {
      const window = lowerActionScope(element.statements, {
        ctx,
        appendTarget: root,
        insidePregameTrigger: inPregameTrigger,
      });

      engine.triggers[triggerIndex] = makeTrigger(header, {
        firstCondition: window.firstConditionIndex,
        conditionCount: window.conditionCount,
        firstAction: window.firstActionIndex,
        actionCount: window.actionCount,
      });
    } finally {
      ctx.inPregameTrigger = previousInPregameTrigger;
    }
  });
};
