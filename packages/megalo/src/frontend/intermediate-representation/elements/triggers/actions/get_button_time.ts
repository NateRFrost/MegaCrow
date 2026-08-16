import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritableNumeric } from "src/frontend/intermediate-representation/diagnostics";
import {
  requireKeyword,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  scriptableGameButtons,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerGetButtonTime = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const buttonName = requireKeyword(parameters[1]!, location).toLowerCase();
  const button = scriptableGameButtons.parse(buttonName);
  if (button === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("game button", buttonName),
      parameters[1]?.location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const __writableOut = resolveCustomVariableReference(
    parameters[2]!,
    paramCtx
  );
  assertWritableNumeric(__writableOut, parameters[2]!.location);
  return {
    type: ActionType.get_button_time,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      button,
      timeOut: __writableOut,
    },
  };
};
