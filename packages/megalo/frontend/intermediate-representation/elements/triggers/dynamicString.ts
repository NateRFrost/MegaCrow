import { SyntaxKind } from "../../../abstract-syntax-tree";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import type { ASTDynamicStringNode } from "../../../abstract-syntax-tree/parameters/types/dynamic-string";
import { VariableType } from "../../../symbol-table";
import { LowerError } from "../../error";
import type { DynamicString } from "../../game/megalogamengine/megalogamengine_text";
import {
  ReplaceableTokenType,
  type ReplaceableToken,
} from "../../game/megalogamengine/megalogamengine_text";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../parameters/context";
import {
  resolveCustomTimerReference,
  resolveCustomVariableReference,
  resolveObjectReference,
  resolvePlayerReference,
  resolveScriptStringTableReference,
  resolveTeamReference,
} from "../../parameters";

const lowerReplacement = (
  node: ASTParameterNode,
  ctx: ElementLowerContext
): ReplaceableToken => {
  const paramCtx = asParameterLoweringContext(ctx);

  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol !== undefined && "type" in symbol) {
      switch (symbol.type) {
        case VariableType.Player:
          return {
            type: ReplaceableTokenType.Player,
            player: resolvePlayerReference(node, paramCtx),
          };
        case VariableType.Team:
          return {
            type: ReplaceableTokenType.Team,
            team: resolveTeamReference(node, paramCtx),
          };
        case VariableType.Object:
          return {
            type: ReplaceableTokenType.Object,
            object: resolveObjectReference(node, paramCtx),
          };
        case VariableType.Number:
          return {
            type: ReplaceableTokenType.CustomVariable,
            customVariable: resolveCustomVariableReference(node, paramCtx),
          };
        case VariableType.Timer:
          return {
            type: ReplaceableTokenType.CustomTimer,
            customTimer: resolveCustomTimerReference(node, paramCtx),
          };
      }
    }
  }

  // Built-ins / member refs: try player first (most common), then others.
  if (
    node.kind === SyntaxKind.REFERENCE ||
    node.kind === SyntaxKind.MEMBER_REFERENCE
  ) {
    const name =
      node.kind === SyntaxKind.REFERENCE
        ? ctx.symbolTable.getSymbol(node.symbolId)?.name
        : undefined;
    if (name?.includes("player") || name === "current_player") {
      return {
        type: ReplaceableTokenType.Player,
        player: resolvePlayerReference(node, paramCtx),
      };
    }
    if (name?.includes("team") || name === "current_team") {
      return {
        type: ReplaceableTokenType.Team,
        team: resolveTeamReference(node, paramCtx),
      };
    }
    if (name?.includes("object") || name === "current_object") {
      return {
        type: ReplaceableTokenType.Object,
        object: resolveObjectReference(node, paramCtx),
      };
    }
  }

  throw new LowerError(
    `Unsupported dynamic-string replacement.`,
    node.location
  );
};

export const lowerDynamicString = (
  node: ASTParameterNode,
  ctx: ElementLowerContext
): DynamicString => {
  if (node.kind !== SyntaxKind.DYNAMIC_STRING) {
    return {
      stringIndex: resolveScriptStringTableReference(
        node,
        ctx.ir,
        ctx.symbolTable
      ),
      tokens: [],
    };
  }

  const dynamic = node as ASTDynamicStringNode;
  return {
    stringIndex: resolveScriptStringTableReference(
      dynamic.string,
      ctx.ir,
      ctx.symbolTable
    ),
    tokens: dynamic.replacements.map((replacement) =>
      lowerReplacement(replacement, ctx)
    ),
  };
};
