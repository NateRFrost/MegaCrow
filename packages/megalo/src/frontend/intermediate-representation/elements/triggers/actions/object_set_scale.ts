import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  type ObjectSetScaleValue,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { CustomVariableType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { getLabel } from "src/version";

export const lowerObjectSetScale = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);

  const paramCtx = asParameterLoweringContext(ctx);
  const scaleNode = parameters[1]!;

  const scale: ObjectSetScaleValue =
    scaleNode.kind === SyntaxKind.FLOATING_POINT
      ? { kind: "float", value: scaleNode.value }
      : {
          kind: "variable",
          value: resolveCustomVariableReference(scaleNode, paramCtx),
        };

  const version = ctx.frontend.megaloVersion.version;
  const versionLabel = getLabel(ctx.frontend.megaloVersion);

  // Alpha wire: quantized float (float literal or integer constant).
  // Beta+: custom number variable reference.
  if (version < 73) {
    if (
      scale.kind === "variable" &&
      scale.value.type !== CustomVariableType.Constant
    ) {
      throw new LowerError(
        diagnosticMessages.objectSetScaleVariableNotSupported(versionLabel),
        scaleNode.location
      );
    }
  } else if (scale.kind === "float") {
    throw new LowerError(
      diagnosticMessages.objectSetScaleFloatNotSupported(versionLabel),
      scaleNode.location
    );
  }

  const action: Action = {
    type: ActionType.object_set_scale,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      scale,
    },
  };
  ctx.ir.locations.record(action.parameters, "scale", scaleNode.location);
  return action;
};
