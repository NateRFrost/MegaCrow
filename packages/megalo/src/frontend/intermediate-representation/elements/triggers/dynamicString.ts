import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { ASTDynamicStringNode } from "src/frontend/abstract-syntax-tree/parameters/types/dynamic-string";
import { isTransientVariantVariable } from "src/frontend/intermediate-representation/diagnostics/isTransientInPersistentString";
import { LowerError } from "src/frontend/intermediate-representation/error";
import { CustomVariableType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { DynamicString } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_text";
import {
  type ReplaceableToken,
  ReplaceableTokenType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_text";
import { VariableType as VariantVariableType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import {
  resolveScriptStringTableReference,
  resolveVariantVariable,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { splitParameterMember } from "src/frontend/intermediate-representation/parameters/references/helpers";
import { VariableScope, VariableType } from "src/frontend/symbol-table";

export interface LowerDynamicStringOptions {
  /**
   * Persistent HUD / navpoint / objective strings: MegaloEdit rejects transient
   * replacements (`temporary` object/player/team, `current_*`, death refs).
   */
  requirePersistence?: boolean;
}

const describeReplacementOperand = (node: ASTParameterNode): string => {
  switch (node.kind) {
    case SyntaxKind.REFERENCE:
      return node.identifier;
    case SyntaxKind.MEMBER_REFERENCE:
      return `${node.root}.${node.member.value}`;
    case SyntaxKind.KEYWORD:
      return node.value;
    case SyntaxKind.INTEGER:
      return String(node.value);
    case SyntaxKind.FLOATING_POINT:
      return String(node.value);
    case SyntaxKind.QUOTED_STRING:
      return `"${node.value}"`;
    case SyntaxKind.INVALID:
      return "<invalid>";
    default:
      return SyntaxKind[node.kind] ?? "expression";
  }
};

/** Spilled temps compile to GlobalN; MegaloEdit still treats the declaration as transient. */
const isSpilledTemporaryNonNumber = (
  node: ASTParameterNode,
  ctx: ElementLowerContext
): boolean => {
  try {
    const { baseSymbol } = splitParameterMember(node, ctx.symbolTable);
    return (
      baseSymbol?.scope === VariableScope.Temporary &&
      baseSymbol.type !== VariableType.Number
    );
  } catch {
    return false;
  }
};

const lowerReplacement = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  options?: LowerDynamicStringOptions
): ReplaceableToken => {
  const paramCtx = asParameterLoweringContext(ctx);

  // `%n` accepts immediate integer literals (same as MegaloEdit / docs examples).
  if (node.kind === SyntaxKind.INTEGER) {
    return {
      type: ReplaceableTokenType.CustomVariable,
      customVariable: {
        type: CustomVariableType.Constant,
        immediateValue: node.value,
      },
    };
  }

  if (
    node.kind === SyntaxKind.REFERENCE ||
    node.kind === SyntaxKind.MEMBER_REFERENCE
  ) {
    const variant = resolveVariantVariable(node, paramCtx);
    if (
      options?.requirePersistence === true &&
      (isSpilledTemporaryNonNumber(node, ctx) ||
        isTransientVariantVariable(variant))
    ) {
      throw new LowerError(
        diagnosticMessages.transientVariableInPersistentString(),
        node.location
      );
    }
    switch (variant.type) {
      case VariantVariableType.CustomVariable:
        return {
          type: ReplaceableTokenType.CustomVariable,
          customVariable: variant.customVariable,
        };
      case VariantVariableType.CustomTimer:
        return {
          type: ReplaceableTokenType.CustomTimer,
          customTimer: variant.customTimer,
        };
      case VariantVariableType.Player:
        return {
          type: ReplaceableTokenType.Player,
          player: variant.player,
        };
      case VariantVariableType.Team:
        return {
          type: ReplaceableTokenType.Team,
          team: variant.team,
        };
      case VariantVariableType.Object:
        return {
          type: ReplaceableTokenType.Object,
          object: variant.object,
        };
    }
  }

  throw new LowerError(
    diagnosticMessages.unsupportedDynamicStringReplacement(
      describeReplacementOperand(node)
    ),
    node.location
  );
};

export const lowerDynamicString = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  options?: LowerDynamicStringOptions
): DynamicString => {
  if (node.kind !== SyntaxKind.DYNAMIC_STRING) {
    return {
      stringIndex: resolveScriptStringTableReference(node, ctx.ir, ctx),
      tokens: [],
    };
  }

  const dynamic = node as ASTDynamicStringNode;
  return {
    stringIndex: resolveScriptStringTableReference(dynamic.string, ctx.ir, ctx),
    tokens: dynamic.replacements.map((replacement) =>
      lowerReplacement(replacement, ctx, options)
    ),
  };
};
