import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveCustomVariableReference } from "../../../parameters";
import { parseTeamOrPlayerTarget } from "../helpers";
import { resolveIncidentIndex } from "./submit_incident";

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
