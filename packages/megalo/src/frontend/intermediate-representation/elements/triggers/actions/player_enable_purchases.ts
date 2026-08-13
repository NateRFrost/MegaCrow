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
  type PlayerPurchaseMode,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const parsePurchaseSelectedModes = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): PlayerPurchaseMode => {
  const state = requireKeyword(node, location).toLowerCase();
  const modes: PlayerPurchaseMode = {
    aliveWeapons: false,
    aliveEquipment: false,
    aliveVehicles: false,
    deadWeapons: false,
    deadEquipment: false,
  };
  switch (state) {
    case "alive":
      modes.aliveWeapons = true;
      modes.aliveEquipment = true;
      modes.aliveVehicles = true;
      break;
    case "dead":
      modes.deadWeapons = true;
      modes.deadEquipment = true;
      break;
    case "both":
      modes.aliveWeapons = true;
      modes.aliveEquipment = true;
      modes.aliveVehicles = true;
      modes.deadWeapons = true;
      modes.deadEquipment = true;
      break;
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("purchase state", state),
        node.location
      );
  }
  return modes;
};

export const lowerPlayerEnablePurchases = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.PlayerEnablePurchases,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      selectedModes: parsePurchaseSelectedModes(parameters[1]!, location),
      enabled: resolveCustomVariableReference(parameters[2]!, paramCtx),
    },
  };
};
