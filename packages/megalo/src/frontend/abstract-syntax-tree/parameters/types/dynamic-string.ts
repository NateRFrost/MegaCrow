import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTErrorNode,
  type ASTNode,
  type ASTReferenceNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters/index";
import { ParameterType } from "src/frontend/abstract-syntax-tree/parameters/index";
import type { SymbolId } from "src/frontend/symbol-table";
import { TokenKind } from "src/frontend/tokens";

export type ASTDynamicStringNode = ASTNode<SyntaxKind.DYNAMIC_STRING> & {
  string:
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTReferenceNode
    | ASTErrorNode;
  replacements: ASTParameterNode[];
};

const getDynamicStringPlaceholderType = (
  char: string
): ParameterType | undefined => {
  switch (char) {
    case "n":
      return ParameterType.Integer;
    case "p":
      return ParameterType.Player;
    case "t":
      return ParameterType.Team;
    case "o":
      return ParameterType.Object;
    case "s":
      return ParameterType.Timer;
    default:
      return;
  }
};

/** Scan format text for known `%` placeholders; unknown `%X` and trailing `%` are ignored. */
export const scanDynamicStringPlaceholders = (
  text: string
): ParameterType[] => {
  const placeholders: ParameterType[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "%") {
      continue;
    }

    const next = text[i + 1];
    if (next === undefined) {
      break;
    }

    i += 1;
    const type = getDynamicStringPlaceholderType(next);
    if (type !== undefined) {
      placeholders.push(type);
    }
  }

  return placeholders;
};

const locationSpan = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
});

const makeReferenceNode = (
  ctx: ParserContext,
  identifier: string,
  location: SourceCodeLocation,
  symbolId: SymbolId
): ASTReferenceNode => {
  ctx.symbolParser.recordReference(symbolId, location);

  return {
    kind: SyntaxKind.REFERENCE,
    identifier,
    symbolId,
    location,
  };
};

export interface DynamicStringParserDeps {
  parseReplacement: (
    ctx: ParserContext,
    type: ParameterType
  ) => ASTParameterNode | undefined;
  parseReplacementLenient: (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
    type: ParameterType
  ) => ASTParameterNode;
}

export const tryParseDynamicString = (
  ctx: ParserContext,
  deps: DynamicStringParserDeps
): ASTDynamicStringNode | undefined => {
  const token = ctx.peekToken();
  if (
    token?.kind !== TokenKind.QuotedString &&
    token?.kind !== TokenKind.Identifier
  ) {
    return;
  }

  let stringNode: ASTDynamicStringNode["string"];
  let text: string | undefined;
  let stringLocation: SourceCodeLocation;

  if (token.kind === TokenKind.QuotedString) {
    const literalToken = ctx.getToken();
    stringNode = {
      kind: SyntaxKind.QUOTED_STRING,
      value: literalToken.value,
      location: literalToken.location,
    };
    text = literalToken.value;
    stringLocation = literalToken.location;
  } else {
    const symbolId = ctx.symbolParser.lookupString(token.value);
    if (symbolId === undefined) {
      return;
    }

    const referenceToken = ctx.getToken();
    stringNode = makeReferenceNode(
      ctx,
      referenceToken.value,
      referenceToken.location,
      symbolId
    );
    text = ctx.symbolParser.lookupStringContent(referenceToken.value);
    stringLocation = referenceToken.location;
  }

  const placeholders =
    text === undefined ? [] : scanDynamicStringPlaceholders(text);
  const replacements: ASTParameterNode[] = [];

  for (const placeholder of placeholders) {
    const parameter = deps.parseReplacement(ctx, placeholder);
    if (parameter === undefined) {
      return;
    }

    replacements.push(parameter);
  }

  const lastLocation = replacements.at(-1)?.location ?? stringLocation;
  return {
    kind: SyntaxKind.DYNAMIC_STRING,
    string: stringNode,
    replacements,
    location: locationSpan(stringLocation, lastLocation),
  };
};

export const parseDynamicString = (
  ctx: ParserContext,
  anchor: SourceCodeLocation,
  deps: DynamicStringParserDeps,
  consumeLenient: (
    ctx: ParserContext,
    anchor: SourceCodeLocation
  ) => ASTParameterNode
): ASTDynamicStringNode => {
  const token = ctx.peekToken();
  if (
    token?.kind !== TokenKind.QuotedString &&
    token?.kind !== TokenKind.Identifier
  ) {
    const invalid = consumeLenient(ctx, anchor);
    return {
      kind: SyntaxKind.DYNAMIC_STRING,
      string: {
        kind: SyntaxKind.INVALID,
        location: invalid.location,
      },
      replacements: [],
      location: invalid.location,
    };
  }

  let stringNode: ASTDynamicStringNode["string"];
  let text: string | undefined;
  let stringLocation: SourceCodeLocation;

  if (token.kind === TokenKind.QuotedString) {
    const literalToken = ctx.getToken();
    stringNode = {
      kind: SyntaxKind.QUOTED_STRING,
      value: literalToken.value,
      location: literalToken.location,
    };
    text = literalToken.value;
    stringLocation = literalToken.location;
  } else {
    const symbolId = ctx.symbolParser.lookupString(token.value);
    const referenceToken = ctx.getToken();
    if (symbolId === undefined) {
      stringNode = {
        kind: SyntaxKind.INVALID,
        location: referenceToken.location,
      };
      text = undefined;
      stringLocation = referenceToken.location;
    } else {
      stringNode = makeReferenceNode(
        ctx,
        referenceToken.value,
        referenceToken.location,
        symbolId
      );
      text = ctx.symbolParser.lookupStringContent(referenceToken.value);
      stringLocation = referenceToken.location;
    }
  }

  const placeholders =
    text === undefined ? [] : scanDynamicStringPlaceholders(text);
  const replacements: ASTParameterNode[] = [];

  for (const placeholder of placeholders) {
    replacements.push(deps.parseReplacementLenient(ctx, anchor, placeholder));
  }

  const lastLocation = replacements.at(-1)?.location ?? stringLocation;
  return {
    kind: SyntaxKind.DYNAMIC_STRING,
    string: stringNode,
    replacements,
    location: locationSpan(stringLocation, lastLocation),
  };
};
