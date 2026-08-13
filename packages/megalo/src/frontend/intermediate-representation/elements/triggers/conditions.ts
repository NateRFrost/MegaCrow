import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ASTConditionOperandNode } from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import {
  COMPARISON_OPERATOR_NAMES,
  type ComparisonOperatorName,
} from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Condition,
  ConditionType,
  Disposition,
  NumericComparison,
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
import {
  DISPOSITION_KEYWORDS,
  type DispositionKeyword,
  type KillerTypeKeyword,
} from "src/frontend/language-configuration/omni/conditions";
import { SymbolKind } from "src/frontend/symbol-table";

const COMPARISON_BY_NAME: Record<ComparisonOperatorName, NumericComparison> = {
  less_than: NumericComparison.LessThan,
  greater_than: NumericComparison.GreaterThan,
  equal_to: NumericComparison.EqualTo,
  less_than_or_equal_to: NumericComparison.LessThanOrEqualTo,
  greater_than_or_equal_to: NumericComparison.GreaterThanOrEqualTo,
  not_equal_to: NumericComparison.NotEqualTo,
};

const COMPARISON_BY_OPERATOR: Record<string, NumericComparison> = {
  "<": NumericComparison.LessThan,
  ">": NumericComparison.GreaterThan,
  "==": NumericComparison.EqualTo,
  "=": NumericComparison.EqualTo,
  "<=": NumericComparison.LessThanOrEqualTo,
  ">=": NumericComparison.GreaterThanOrEqualTo,
  "!=": NumericComparison.NotEqualTo,
};

const DISPOSITION_BY_NAME: Record<DispositionKeyword, Disposition> = {
  neutral: Disposition.Neutral,
  friendly: Disposition.Friendly,
  enemy: Disposition.Enemy,
};

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
  operand: ASTConditionOperandNode
): NumericComparison => {
  if (operand.kind === SyntaxKind.KEYWORD) {
    const name = operand.value;
    if ((COMPARISON_OPERATOR_NAMES as readonly string[]).includes(name)) {
      return COMPARISON_BY_NAME[name as ComparisonOperatorName];
    }
    const byOp = COMPARISON_BY_OPERATOR[name];
    if (byOp !== undefined) {
      return byOp;
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
  if (
    operand.kind === SyntaxKind.KEYWORD &&
    (DISPOSITION_KEYWORDS as readonly string[]).includes(operand.value)
  ) {
    return DISPOSITION_BY_NAME[operand.value as DispositionKeyword];
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
  type: ConditionType.GameIsForge,
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
  return {
    ...base,
    type: ConditionType.If,
    parameters: {
      left,
      right,
      comparison: parseComparison(comparisonNode),
    },
  };
};

const lowerObjectInArea: ConditionLowerer = (statement, ctx, base) => {
  const [objectNode, areaNode] = requireOperands(statement, 2);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    ...base,
    type: ConditionType.ObjectInArea,
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
    type: ConditionType.PlayerDied,
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
    type: ConditionType.TeamDisposition,
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
    type: ConditionType.TimerExpired,
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
    type: ConditionType.ObjectIsType,
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
    type: ConditionType.TeamIsActive,
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
    type: ConditionType.ObjectOutOfBounds,
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
    type: ConditionType.PlayerIsFireTeamLeader,
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
    type: ConditionType.PlayerAssistedWithKill,
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
    type: ConditionType.ObjectMatchesFilter,
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
    type: ConditionType.PlayerIsActive,
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
    type: ConditionType.EquipmentIsActive,
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
    type: ConditionType.PlayerIsSpartan,
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
    type: ConditionType.PlayerIsElite,
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
    type: ConditionType.PlayerIsEditor,
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
  const lowerer = CONDITION_LOWERERS[statement.name.value];
  if (lowerer === undefined) {
    throw new LowerError(
      diagnosticMessages.unknownCondition(statement.name.value),
      statement.name.location
    );
  }
  return lowerer(statement, ctx, base);
};
