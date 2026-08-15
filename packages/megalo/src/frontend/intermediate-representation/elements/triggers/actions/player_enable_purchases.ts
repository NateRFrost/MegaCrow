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

const emptyPurchaseModes = (): PlayerPurchaseMode => ({
  aliveWeapons: false,
  aliveEquipment: false,
  aliveVehicles: false,
  deadWeapons: false,
  deadEquipment: false,
});

const parsePurchaseLifeState = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): PlayerPurchaseMode => {
  const state = requireKeyword(node, location).toLowerCase();
  const modes = emptyPurchaseModes();
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

/** AND life-state flags with a category mask (MegaloEdit `read_enable_purchase_mode`). */
const applyPurchaseCategory = (
  modes: PlayerPurchaseMode,
  node: ASTParameterNode,
  location: SourceCodeLocation
): PlayerPurchaseMode => {
  const category = requireKeyword(node, location).toLowerCase();
  switch (category) {
    case "all":
      return modes;
    case "weapons":
      return {
        ...emptyPurchaseModes(),
        aliveWeapons: modes.aliveWeapons,
        deadWeapons: modes.deadWeapons,
      };
    case "equipment":
      return {
        ...emptyPurchaseModes(),
        aliveEquipment: modes.aliveEquipment,
        deadEquipment: modes.deadEquipment,
      };
    case "vehicles":
      return {
        ...emptyPurchaseModes(),
        aliveVehicles: modes.aliveVehicles,
      };
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("purchase category", category),
        node.location
      );
  }
};

export const lowerPlayerEnablePurchases = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 4, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const selectedModes = applyPurchaseCategory(
    parsePurchaseLifeState(parameters[1]!, location),
    parameters[2]!,
    location
  );
  if (
    !(
      selectedModes.aliveWeapons ||
      selectedModes.aliveEquipment ||
      selectedModes.aliveVehicles ||
      selectedModes.deadWeapons ||
      selectedModes.deadEquipment
    )
  ) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "purchase mode",
        "non-empty category for life state"
      ),
      parameters[2]!.location
    );
  }
  return {
    type: ActionType.player_enable_purchases,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      selectedModes,
      enabled: resolveCustomVariableReference(parameters[3]!, paramCtx),
    },
  };
};
