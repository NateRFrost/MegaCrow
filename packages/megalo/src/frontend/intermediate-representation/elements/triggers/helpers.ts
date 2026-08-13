import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  MathOperation,
  type PlayerFilterModifier,
  PlayerFilterType,
  type TeamOrPlayerTarget,
  TeamOrPlayerTargetKind,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
  resolveTeamReference,
  tryLowerConstantInteger,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const requireParamCount = (
  parameters: ASTParameterNode[],
  count: number,
  location: SourceCodeLocation
): void => {
  if (parameters.length !== count) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(count, parameters.length),
      location
    );
  }
};

export const requireKeyword = (
  node: ASTParameterNode | undefined,
  location: SourceCodeLocation
): string => {
  if (node === undefined || node.kind !== SyntaxKind.KEYWORD) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("keyword", ""),
      node?.location ?? location
    );
  }
  return node.value;
};

export const hasOptionalKeyword = (
  parameters: ASTParameterNode[],
  keyword: string
): boolean =>
  parameters.some(
    (parameter) =>
      parameter.kind === SyntaxKind.KEYWORD && parameter.value === keyword
  );

/**
 * MegaloEdit boolean: integer / named constant (`true`/`false` are built-ins).
 */
export const parseBooleanLiteral = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): boolean => {
  const value = tryLowerConstantInteger(node, ctx);
  if (value !== undefined) {
    return value.value !== 0;
  }
  const got =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : "";
  throw new LowerError(
    diagnosticMessages.expectedParameterType("boolean", got),
    node.location ?? location
  );
};

/**
 * Parse a team/player target prefix:
 * `everyone` | `player <Player>` | `team <Team>`.
 */
export const parseTeamOrPlayerTarget = (
  parameters: ASTParameterNode[],
  startIndex: number,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): { target: TeamOrPlayerTarget; nextIndex: number } => {
  const first = parameters[startIndex];
  if (first === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("team or player target", ""),
      location
    );
  }

  if (first.kind !== SyntaxKind.KEYWORD) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("team or player target", ""),
      first.location
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);

  switch (first.value) {
    case "everyone":
      return {
        target: { type: TeamOrPlayerTargetKind.Everyone },
        nextIndex: startIndex + 1,
      };
    case "player": {
      const playerNode = parameters[startIndex + 1];
      if (playerNode === undefined) {
        throw new LowerError(
          diagnosticMessages.invalidParameterCount(
            2,
            parameters.length - startIndex
          ),
          location
        );
      }
      return {
        target: {
          type: TeamOrPlayerTargetKind.Player,
          player: resolvePlayerReference(playerNode, paramCtx),
        },
        nextIndex: startIndex + 2,
      };
    }
    case "team": {
      const teamNode = parameters[startIndex + 1];
      if (teamNode === undefined) {
        throw new LowerError(
          diagnosticMessages.invalidParameterCount(
            2,
            parameters.length - startIndex
          ),
          location
        );
      }
      return {
        target: {
          type: TeamOrPlayerTargetKind.Team,
          team: resolveTeamReference(teamNode, paramCtx),
        },
        nextIndex: startIndex + 2,
      };
    }
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "team or player target",
          first.value
        ),
        first.location
      );
  }
};

const MATH_OPERATION_BY_NAME: Record<string, MathOperation> = {
  add: MathOperation.Add,
  "+": MathOperation.Add,
  "+=": MathOperation.Add,
  subtract: MathOperation.Subtract,
  "-": MathOperation.Subtract,
  "-=": MathOperation.Subtract,
  multiply: MathOperation.Multiply,
  "*": MathOperation.Multiply,
  "*=": MathOperation.Multiply,
  divide: MathOperation.Divide,
  "/": MathOperation.Divide,
  "/=": MathOperation.Divide,
  set_to: MathOperation.SetTo,
  "=": MathOperation.SetTo,
  modulo: MathOperation.Modulo,
  "%": MathOperation.Modulo,
  "%=": MathOperation.Modulo,
  and: MathOperation.And,
  "&": MathOperation.And,
  "&=": MathOperation.And,
  or: MathOperation.Or,
  "|": MathOperation.Or,
  "|=": MathOperation.Or,
  xor: MathOperation.Xor,
  "^": MathOperation.Xor,
  "^=": MathOperation.Xor,
  not: MathOperation.Not,
  "~": MathOperation.Not,
  lshift: MathOperation.LShift,
  "<<": MathOperation.LShift,
  "<<=": MathOperation.LShift,
  rshift: MathOperation.RShift,
  ">>": MathOperation.RShift,
  ">>=": MathOperation.RShift,
  abs: MathOperation.Abs,
};

export const parseMathOperation = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): MathOperation => {
  const name = requireKeyword(node, location).toLowerCase();
  const operation = MATH_OPERATION_BY_NAME[name];
  if (operation === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("math operation", name),
      node.location
    );
  }
  return operation;
};

const FILTER_KEYWORDS: Record<string, PlayerFilterType> = {
  no_one: PlayerFilterType.NoOne,
  everyone: PlayerFilterType.Everyone,
  allies: PlayerFilterType.Allies,
  enemies: PlayerFilterType.Enemies,
  normal: PlayerFilterType.Normal,
};

/**
 * Parse trailing visibility-filter args after the object:
 * `no_one` | `everyone` | `allies` | `enemies` | `normal`
 * or `player <player> <boolean>`.
 */
export const parsePlayerFilterModifier = (
  parameters: ASTParameterNode[],
  startIndex: number,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): { filter: PlayerFilterModifier; nextIndex: number } => {
  const first = parameters[startIndex];
  if (first === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("player filter", ""),
      location
    );
  }

  if (first.kind === SyntaxKind.KEYWORD && first.value === "player") {
    const playerNode = parameters[startIndex + 1];
    const visibleNode = parameters[startIndex + 2];
    if (playerNode === undefined || visibleNode === undefined) {
      throw new LowerError(
        diagnosticMessages.invalidParameterCount(
          3,
          parameters.length - startIndex
        ),
        location
      );
    }
    const paramCtx = asParameterLoweringContext(ctx);
    return {
      filter: {
        type: PlayerFilterType.SpecificPlayer,
        player: resolvePlayerReference(playerNode, paramCtx),
        visible: resolveCustomVariableReference(visibleNode, paramCtx),
      },
      nextIndex: startIndex + 3,
    };
  }

  const name = requireKeyword(first, location).toLowerCase();
  const type = FILTER_KEYWORDS[name];
  if (type === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("player filter", name),
      first.location
    );
  }
  return {
    filter: { type } as Exclude<
      PlayerFilterModifier,
      { type: PlayerFilterType.SpecificPlayer }
    >,
    nextIndex: startIndex + 1,
  };
};
