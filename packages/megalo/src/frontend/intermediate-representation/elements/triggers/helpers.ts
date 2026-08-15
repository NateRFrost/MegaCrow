import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type MathOperation,
  mathOperation,
  type PlayerFilterModifier,
  PlayerFilterType,
  playerFilterType,
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
    case TeamOrPlayerTargetKind.everyone:
      return {
        target: { type: TeamOrPlayerTargetKind.everyone },
        nextIndex: startIndex + 1,
      };
    case TeamOrPlayerTargetKind.player: {
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
          type: TeamOrPlayerTargetKind.player,
          player: resolvePlayerReference(playerNode, paramCtx),
        },
        nextIndex: startIndex + 2,
      };
    }
    case TeamOrPlayerTargetKind.team: {
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
          type: TeamOrPlayerTargetKind.team,
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

export const parseMathOperation = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): MathOperation => {
  const name = requireKeyword(node, location).toLowerCase();
  const operation = mathOperation.parse(name);
  if (operation === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("math operation", name),
      node.location
    );
  }
  return operation;
};

/**
 * Parse trailing visibility-filter args after the object:
 * `no_one` | `everyone` | `allies` | `enemies` | `all`
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
        type: PlayerFilterType.player,
        player: resolvePlayerReference(playerNode, paramCtx),
        visible: resolveCustomVariableReference(visibleNode, paramCtx),
      },
      nextIndex: startIndex + 3,
    };
  }

  const name = requireKeyword(first, location).toLowerCase();
  const type = playerFilterType.parse(name);
  if (type === undefined || type === PlayerFilterType.player) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("player filter", name),
      first.location
    );
  }
  return {
    filter: { type },
    nextIndex: startIndex + 1,
  };
};
