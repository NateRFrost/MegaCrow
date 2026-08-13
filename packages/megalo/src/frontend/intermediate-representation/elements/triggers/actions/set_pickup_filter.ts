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
import { resolveObjectReference } from "../../../parameters";
import { parsePlayerFilterModifier } from "../helpers";

const lowerObjectFilterAction = (
  type:
    | ActionType.NavpointSetVisible
    | ActionType.SetPickupFilter
    | ActionType.SetRespawnFilter
    | ActionType.BoundarySetVisible,
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const object = resolveObjectReference(
    parameters[0]!,
    asParameterLoweringContext(ctx),
  );
  const { filter, nextIndex } = parsePlayerFilterModifier(
    parameters,
    1,
    ctx,
    location,
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location,
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
  location: SourceCodeLocation,
): Action =>
  lowerObjectFilterAction(
    ActionType.SetPickupFilter,
    parameters,
    ctx,
    location,
  );
