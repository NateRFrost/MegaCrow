import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveCustomVariableReference } from "../../../parameters";
import { lowerDynamicString } from "../dynamicString";
import { requireParamCount } from "../helpers";

export const lowerSavedFilmInsertMarker = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.SavedFilmInsertMarker,

    parameters: {
      offsetSeconds: resolveCustomVariableReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      label: lowerDynamicString(parameters[1]!, ctx),
    },
  };
};
