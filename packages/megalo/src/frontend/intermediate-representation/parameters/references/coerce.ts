import {
  type ObjectReference,
  ObjectReferenceType,
  type PlayerReference,
  PlayerReferenceType,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";

/** Bare `none` typed as the partner operand's variant kind (proto `noneVariant`). */
export const noneVariantVariable = (
  partnerType: VariantVariableType
): VariantVariable | undefined => {
  switch (partnerType) {
    case VariantVariableType.Player:
      return {
        type: VariantVariableType.Player,
        player: {
          type: PlayerReferenceType.GlobalPlayer,
          player: ExplicitPlayer.None,
        },
      };
    case VariantVariableType.Object:
      return {
        type: VariantVariableType.Object,
        object: {
          type: ObjectReferenceType.GlobalObject,
          object: ExplicitObject.None,
        },
      };
    case VariantVariableType.Team:
      return {
        type: VariantVariableType.Team,
        team: {
          type: TeamReferenceType.GlobalTeam,
          team: ExplicitTeam.None,
        },
      };
    default:
      return undefined;
  }
};

/** Coerce a player reference to that player's biped object (proto `playerToBiped`). */
export const playerReferenceToBiped = (
  player: PlayerReference
): ObjectReference => {
  switch (player.type) {
    case PlayerReferenceType.PlayerPlayer:
      return {
        type: ObjectReferenceType.PlayerPlayerBiped,
        player: player.player,
        variableIndex: player.variableIndex,
      };
    case PlayerReferenceType.ObjectPlayer:
      return {
        type: ObjectReferenceType.ObjectPlayerBiped,
        object: player.object,
        variableIndex: player.variableIndex,
      };
    case PlayerReferenceType.TeamPlayer:
      return {
        type: ObjectReferenceType.TeamPlayerBiped,
        team: player.team,
        variableIndex: player.variableIndex,
      };
    case PlayerReferenceType.GlobalPlayer:
      return {
        type: ObjectReferenceType.PlayerBiped,
        player: player.player,
      };
    default: {
      const _exhaustive: never = player;
      return _exhaustive;
    }
  }
};

export const coerceObjectPlayerPair = (
  left: VariantVariable,
  right: VariantVariable
): [VariantVariable, VariantVariable] => {
  if (
    left.type === VariantVariableType.Object &&
    right.type === VariantVariableType.Player
  ) {
    return [
      left,
      {
        type: VariantVariableType.Object,
        object: playerReferenceToBiped(right.player),
      },
    ];
  }
  if (
    left.type === VariantVariableType.Player &&
    right.type === VariantVariableType.Object
  ) {
    return [
      {
        type: VariantVariableType.Object,
        object: playerReferenceToBiped(left.player),
      },
      right,
    ];
  }
  return [left, right];
};

const isBareNoneName = (name: string): boolean => name === "none";

export const isBareNoneOperand = (node: ASTParameterNode): boolean => {
  if (node.kind === SyntaxKind.KEYWORD) {
    return isBareNoneName(node.value);
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    return isBareNoneName(node.identifier);
  }
  return false;
};

// There are 2 cases where we allow Type coercion at lower:
// 1. When we are dealing with "none" arguments.
//   - None is effectively every type and no type. We just go with whatever we need.
// 2. When we are dealing with object/player pairs.
//   - We can coerce a player to its biped object and vice versa.
export const coerceVariantOperands = (
  left: VariantVariable,
  right: VariantVariable,
  rightWasNone: boolean,
  leftWasNone: boolean
): [VariantVariable, VariantVariable] => {
  let dst = left;
  let src = right;
  if (leftWasNone) {
    const typed = noneVariantVariable(src.type);
    if (typed) {
      dst = typed;
    }
  }
  if (rightWasNone) {
    const typed = noneVariantVariable(dst.type);
    if (typed) {
      src = typed;
    }
  }
  return coerceObjectPlayerPair(dst, src);
};
