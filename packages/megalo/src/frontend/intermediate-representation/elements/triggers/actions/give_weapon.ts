import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  requireKeyword,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  bipedGiveWeaponMode,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveObjectTypeReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerGiveWeapon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const modeName = requireKeyword(parameters[2]!, location).toLowerCase();
  const mode = bipedGiveWeaponMode.parse(modeName);
  if (mode === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("weapon slot", modeName),
      parameters[2]?.location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.give_weapon,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      weapon: resolveObjectTypeReference(parameters[1]!, paramCtx),
      // Pre-release wire format is a single bit; `force` sets it.
      force: mode === "force",
    },
  };
};
