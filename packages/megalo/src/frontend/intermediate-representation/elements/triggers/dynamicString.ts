import { SyntaxKind } from "../../../abstract-syntax-tree";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import type { ASTDynamicStringNode } from "../../../abstract-syntax-tree/parameters/types/dynamic-string";
import { LowerError } from "../../error";
import type { DynamicString } from "../../game/megalogamengine/megalogamengine_text";
import {
  ReplaceableTokenType,
  type ReplaceableToken,
} from "../../game/megalogamengine/megalogamengine_text";
import { VariableType as VariantVariableType } from "../../game/megalogamengine/megalogamengine_variant_variable";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../parameters/context";
import {
  resolveScriptStringTableReference,
  resolveVariantVariable,
} from "../../parameters";

const lowerReplacement = (
  node: ASTParameterNode,
  ctx: ElementLowerContext
): ReplaceableToken => {
  const paramCtx = asParameterLoweringContext(ctx);

  if (
    node.kind === SyntaxKind.REFERENCE ||
    node.kind === SyntaxKind.MEMBER_REFERENCE
  ) {
    const variant = resolveVariantVariable(node, paramCtx);
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
