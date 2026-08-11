import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "../../../parameters";
import { parseIndexSuffix } from "../../../parameters/explicit";
import { requireKeyword, requireParamCount } from "../helpers";

const resolveDeviceAnimationNameIndex = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): number => {
  const name = requireKeyword(node, location);
  const indexed = parseIndexSuffix(name, "animation");
  if (indexed !== undefined) {
    return indexed + 1;
  }
  const numeric = Number(name);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("device animation", name),
    node.location,
  );
};

export const lowerDeviceSetPositionTrack = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.DeviceSetPositionTrack,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      animationNameIndex: resolveDeviceAnimationNameIndex(
        parameters[1]!,
        location,
      ),
      interpolationTime: resolveCustomVariableReference(
        parameters[2]!,
        paramCtx,
      ),
    },
  };
};
