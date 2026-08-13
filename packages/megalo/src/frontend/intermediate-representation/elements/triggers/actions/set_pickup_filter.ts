import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { parsePlayerFilterModifier } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const lowerObjectFilterAction = (
  type:
    | ActionType.NavpointSetVisible
    | ActionType.SetPickupFilter
    | ActionType.SetRespawnFilter
    | ActionType.BoundarySetVisible,
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const object = resolveObjectReference(
    parameters[0]!,
    asParameterLoweringContext(ctx)
  );
  const { filter, nextIndex } = parsePlayerFilterModifier(
    parameters,
    1,
    ctx,
    location
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location
    );
  }

  if (type === ActionType.NavpointSetVisible) {
    return {
      type,
      parameters: { navpoint: object, playerFilterModifier: filter },
    };
  }
  return {
    type,
    parameters: { object, playerFilterModifier: filter },
  };
};

export const lowerSetPickupFilter = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action =>
  lowerObjectFilterAction(
    ActionType.SetPickupFilter,
    parameters,
    ctx,
    location
  );
