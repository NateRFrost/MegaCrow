import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ASTConditionOperandNode } from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Condition,
  ConditionType,
  conditionType,
  type Disposition,
  disposition,
  NumericComparison,
  numericComparison,
  type PlayerDeathKillerTypeFlags,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import {
  resolveCustomTimerReference,
  resolveObjectReference,
  resolveObjectTypeReference,
  resolvePlayerReference,
  resolveTeamReference,
  resolveVariantVariable,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  coerceVariantOperands,
  isBareNoneOperand,
} from "src/frontend/intermediate-representation/parameters/references/coerce";
import type { KillerTypeKeyword } from "src/frontend/language-configuration/omni/conditions";
import { SymbolKind } from "src/frontend/symbol-table";
import { getLabel } from "src/version";

const emptyKillerFlags = (): PlayerDeathKillerTypeFlags => ({
  environment: false,
  suicide: false,
  enemy: false,
  betrayal: false,
  quit_game: false,
});

const parseKillerType = (
  operand: ASTConditionOperandNode
): PlayerDeathKillerTypeFlags => {
  if (operand.kind !== SyntaxKind.KEYWORD) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("killer type", ""),
      operand.location
    );
  }
  const value = operand.value as KillerTypeKeyword;
  const flags = emptyKillerFlags();
  switch (value) {
    case "any":
      return {
        environment: true,
        suicide: true,
        enemy: true,
        betrayal: true,
        quit_game: true,
      };
    case "none":
      return flags;
    case "guardian":
      flags.environment = true;
      return flags;
    case "enemy":
      flags.enemy = true;
      return flags;
    case "betrayal":
      flags.betrayal = true;
      return flags;
    case "suicide":
      flags.suicide = true;
      return flags;
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("killer type", operand.value),
        operand.location
      );
  }
};

const parseComparison = (
  operand: ASTConditionOperandNode,
  ctx: ElementLowerContext
): NumericComparison => {
  if (operand.kind === SyntaxKind.KEYWORD) {
    const comparison = numericComparison.parse(operand.value);
    if (comparison !== undefined) {
      if (
        !numericComparison
          .supportedMembers(ctx.frontend.megaloVersion)
          .has(comparison)
      ) {
        throw new LowerError(
          diagnosticMessages.unsupportedMathOperation(
            operand.value,
            getLabel(ctx.frontend.megaloVersion)
          ),
          operand.location
        );
      }
      return comparison;
    }
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType(
      "comparison operator",
      operand.kind === SyntaxKind.KEYWORD ? operand.value : ""
    ),
    operand.location
  );
};

const parseDisposition = (operand: ASTConditionOperandNode): Disposition => {
  if (operand.kind === SyntaxKind.KEYWORD) {
    const value = disposition.parse(operand.value);
    if (value !== undefined) {
      return value;
    }
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType(
      "disposition",
      operand.kind === SyntaxKind.KEYWORD ? operand.value : ""
    ),
    operand.location
  );
};

const requireOperands = (
  statement: ConditionStatementNode,
  count: number
): ASTConditionOperandNode[] => {
  if (statement.operands.length !== count) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        count,
        statement.operands.length
      ),
      statement.location
    );
  }
  return statement.operands;
};

const asParam = (operand: ASTConditionOperandNode): ASTParameterNode =>
  operand as ASTParameterNode;

export type ConditionLowerer = (
  statement: ConditionStatementNode,
  ctx: ElementLowerContext,
  base: Pick<Condition, "negated" | "unionGroup" | "executeBeforeAction">
) => Condition;

const lowerGameIsForge: ConditionLowerer = (_statement, _ctx, base) => ({
  ...base,
  type: ConditionType.game_is_forge,
  parameters: undefined as never,
});

const lowerIf: ConditionLowerer = (statement, ctx, base) => {
  const [leftNode, comparisonNode, rightNode] = requireOperands(statement, 3);
  const paramCtx = asParameterLoweringContext(ctx);
  const leftParam = asParam(leftNode);
  const rightParam = asParam(rightNode);
  const [left, right] = coerceVariantOperands(
    resolveVariantVariable(leftParam, paramCtx),
    resolveVariantVariable(rightParam, paramCtx),
    isBareNoneOperand(rightParam),
    isBareNoneOperand(leftParam)
  );
  let comparison = parseComparison(comparisonNode, ctx);
  let negated = base.negated;
  // Alpha has no `!=` opcode — emit `==` and toggle the condition not-flag.
  if (
    comparison === NumericComparison.not_equal_to &&
    ctx.frontend.megaloVersion.version < 73
  ) {
    comparison = NumericComparison.equal_to;
    negated = !negated;
  }
  return {
    ...base,
    negated,
    type: ConditionType.if,
    parameters: {
      left,
      right,
      comparison,
    },
  };
};

const lowerObjectInArea: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode, areaNode] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.object_in_area,
    parameters: {
      object: resolveObjectReference(asParam(objectNode), paramCtx),
      area: resolveObjectReference(asParam(areaNode), paramCtx),
    },
  };
};

const lowerPlayerDied: ConditionLowerer = (statement, ctx, base) => {
  const [playerNode, killerNode] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_died,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
      killerType: parseKillerType(killerNode),
    },
  };
};

const lowerTeamDisposition: ConditionLowerer = (statement, ctx, base) => {
  const [team1Node, dispositionNode, team2Node] = requireOperands(statement, 3);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.team_disposition,
    parameters: {
      team1: resolveTeamReference(asParam(team1Node), paramCtx),
      team2: resolveTeamReference(asParam(team2Node), paramCtx),
      disposition: parseDisposition(dispositionNode),
    },
  };
};

const lowerTimerExpired: ConditionLowerer = (statement, ctx, base) => {
  const [timerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.timer_expired,
    parameters: {
      timer: resolveCustomTimerReference(asParam(timerNode), paramCtx),
    },
  };
};

const lowerObjectIsType: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode, typeNode] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.object_is_type,
    parameters: {
      object: resolveObjectReference(asParam(objectNode), paramCtx),
      objectType: resolveObjectTypeReference(asParam(typeNode), paramCtx),
    },
  };
};

const lowerTeamIsActive: ConditionLowerer = (statement, ctx, base) => {
  const [teamNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.team_is_active,
    parameters: {
      team: resolveTeamReference(asParam(teamNode), paramCtx),
    },
  };
};

const lowerObjectOutOfBounds: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.object_out_of_bounds,
    parameters: {
      object: resolveObjectReference(asParam(objectNode), paramCtx),
    },
  };
};

const lowerPlayerIsFireTeamLeader: ConditionLowerer = (
  statement,
  ctx,
  base
) => {
  const [playerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_is_fire_team_leader,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
    },
  };
};

const lowerPlayerAssistedWithKill: ConditionLowerer = (
  statement,
  ctx,
  base
) => {
  const [player1Node, player2Node] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_assisted_with_kill,
    parameters: {
      player1: resolvePlayerReference(asParam(player1Node), paramCtx),
      player2: resolvePlayerReference(asParam(player2Node), paramCtx),
    },
  };
};

const lowerObjectMatchesFilter: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode, filterNode] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  if (filterNode.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      filterNode.location
    );
  }
  const symbol = ctx.symbolTable.getSymbol(filterNode.symbolId);
  if (symbol?.kind !== SymbolKind.ObjectFilter) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      filterNode.location
    );
  }
  return {
    ...base,
    type: ConditionType.object_matches_filter,
    parameters: {
      object: resolveObjectReference(asParam(objectNode), paramCtx),
      filterIndex: symbol.index,
    },
  };
};

const lowerPlayerIsActive: ConditionLowerer = (statement, ctx, base) => {
  const [playerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_is_active,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
    },
  };
};

const lowerEquipmentIsActive: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.equipment_is_active,
    parameters: {
      object: resolveObjectReference(asParam(objectNode), paramCtx),
    },
  };
};

const lowerPlayerIsSpartan: ConditionLowerer = (statement, ctx, base) => {
  const [playerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_is_spartan,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
    },
  };
};

const lowerPlayerIsElite: ConditionLowerer = (statement, ctx, base) => {
  const [playerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_is_elite,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
    },
  };
};

const lowerPlayerIsEditor: ConditionLowerer = (statement, ctx, base) => {
  const [playerNode] = requireOperands(statement, 1);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.player_is_editor,
    parameters: {
      player: resolvePlayerReference(asParam(playerNode), paramCtx),
    },
  };
};

const CONDITION_LOWERERS: Record<string, ConditionLowerer> = {
  if: lowerIf,
  object_in_area: lowerObjectInArea,
  player_died: lowerPlayerDied,
  team_disposition: lowerTeamDisposition,
  timer_expired: lowerTimerExpired,
  object_is_type: lowerObjectIsType,
  team_is_active: lowerTeamIsActive,
  object_out_of_bounds: lowerObjectOutOfBounds,
  player_is_fire_team_leader: lowerPlayerIsFireTeamLeader,
  player_assisted_with_kill: lowerPlayerAssistedWithKill,
  object_matches_filter: lowerObjectMatchesFilter,
  player_is_active: lowerPlayerIsActive,
  equipment_is_active: lowerEquipmentIsActive,
  player_is_spartan: lowerPlayerIsSpartan,
  player_is_elite: lowerPlayerIsElite,
  player_is_editor: lowerPlayerIsEditor,
  game_is_forge: lowerGameIsForge,
};

export const lowerConditionStatement = (
  statement: ConditionStatementNode,
  ctx: ElementLowerContext,
  base: Pick<Condition, "negated" | "unionGroup" | "executeBeforeAction">
): Condition => {
  const canonical = conditionType.parse(statement.name.value);
  if (
    canonical !== undefined &&
    !conditionType.supportedMembers(ctx.frontend.megaloVersion).has(canonical)
  ) {
    throw new LowerError(
      diagnosticMessages.unsupportedAction(
        statement.name.value,
        getLabel(ctx.frontend.megaloVersion)
      ),
      statement.name.location
    );
  }
  const lowerer = CONDITION_LOWERERS[statement.name.value];
  if (lowerer === undefined) {
    throw new LowerError(
      diagnosticMessages.unknownCondition(statement.name.value),
      statement.name.location
    );
  }
  return lowerer(statement, ctx, base);
};
