import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveCustomVariableReference } from "src/frontend/intermediate-representation/parameters";
import { parseTeamOrPlayerTarget } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { resolveIncidentIndex } from "src/frontend/intermediate-representation/elements/triggers/actions/submit_incident";

export const lowerSubmitIncidentWithCustomValue = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 4) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(4, parameters.length),
      location,
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  const statIndex = resolveIncidentIndex(parameters[0]!, ctx, location);
  const { target: cause, nextIndex: effectStart } = parseTeamOrPlayerTarget(
    parameters,
    1,
    ctx,
    location,
  );
  const { target: effect, nextIndex: valueIndex } = parseTeamOrPlayerTarget(
    parameters,
    effectStart,
    ctx,
    location,
  );
  const valueNode = parameters[valueIndex];
  if (valueNode === undefined || valueIndex + 1 !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        valueIndex + 1,
        parameters.length,
      ),
      location,
    );
  }

  return {
    type: ActionType.SubmitIncidentWithCustomValue,
    parameters: {
      statIndex,
      cause,
      effect,
      customValue: resolveCustomVariableReference(valueNode, paramCtx),
    },
  };
};
