import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  type ASTNode,
  type ASTReferenceNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  ParameterType,
  tryParseParameterValue,
} from "src/frontend/abstract-syntax-tree/parameters";
import { SymbolKind } from "src/frontend/symbol-table";
import { type Token, TokenKind } from "src/frontend/tokens";

interface ConstantEntryNodeType {
  location: SourceCodeLocation;
  value: "number";
}
interface ConstantEntryNodeName {
  location: SourceCodeLocation;
  value: string;
}

export type IntegerInitialValue =
  | (ASTNode<SyntaxKind.INTEGER> & { value: number })
  | ASTReferenceNode
  | ASTErrorNode;

export type NumericInitialValue =
  | IntegerInitialValue
  | (ASTNode<SyntaxKind.FLOATING_POINT> & { value: number });

export interface ConstantEntryNode {
  location: SourceCodeLocation;
  name: ConstantEntryNodeName | ASTErrorNode;
  type: ConstantEntryNodeType | ASTErrorNode;
  value: IntegerInitialValue;
}

export type ConstantsElementNode = ASTElementBase<ElementKind.CONSTANTS> & {
  entries: ConstantEntryNode[];
};

const isMissingInitial = (token: Token | undefined): boolean =>
  !token || (token.kind === TokenKind.Identifier && token.value === "end");

export const parseIntegerInitialValue = (
  ctx: ParserContext,
  anchor: Token
): IntegerInitialValue => {
  const valuePeek = ctx.peekToken();
  if (isMissingInitial(valuePeek)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
      anchor.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: anchor.location,
    };
  }

  if (valuePeek?.kind === TokenKind.FloatingPoint) {
    const valueToken = ctx.getToken();
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(valueToken.value),
      valueToken.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: valueToken.location,
    };
  }

  const node = tryParseParameterValue(ctx, ParameterType.Integer);
  if (node !== undefined) {
    if (
      node.kind === SyntaxKind.INTEGER ||
      node.kind === SyntaxKind.REFERENCE
    ) {
      return node;
    }
    // tryParseParameterValue may have consumed a non-integer token; do not
    // consume again.
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(
        node.kind === SyntaxKind.KEYWORD ? node.value : ""
      ),
      node.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: node.location,
    };
  }

  const valueToken = ctx.getToken();
  ctx.diagnostics.addError(
    diagnosticMessages.expectedConstantValue(valueToken.value),
    valueToken.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: valueToken.location,
  };
};

export const parseNumericInitialValue = (
  ctx: ParserContext,
  anchor: Token
): NumericInitialValue => {
  const valuePeek = ctx.peekToken();
  if (isMissingInitial(valuePeek)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
      anchor.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: anchor.location,
    };
  }

  if (valuePeek?.kind === TokenKind.FloatingPoint) {
    const valueToken = ctx.getToken();
    return {
      kind: SyntaxKind.FLOATING_POINT,
      value: Number.parseFloat(valueToken.value),
      location: valueToken.location,
    };
  }

  const node = tryParseParameterValue(ctx, ParameterType.Integer);
  if (node !== undefined) {
    if (
      node.kind === SyntaxKind.INTEGER ||
      node.kind === SyntaxKind.REFERENCE
    ) {
      return node;
    }
    // tryParseParameterValue may have consumed a non-integer token; do not
    // consume again.
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(
        node.kind === SyntaxKind.KEYWORD ? node.value : ""
      ),
      node.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: node.location,
    };
  }

  const valueToken = ctx.getToken();
  ctx.diagnostics.addError(
    diagnosticMessages.expectedConstantValue(valueToken.value),
    valueToken.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: valueToken.location,
  };
};

const resolveConstantInitialNumber = (
  ctx: ParserContext,
  value: IntegerInitialValue
): number | undefined => {
  if (value.kind === SyntaxKind.INTEGER) {
    return value.value;
  }
  if (value.kind === SyntaxKind.REFERENCE) {
    const target = ctx.symbolParser.getSymbolEntry(value.symbolId);
    if (target?.kind === SymbolKind.Constant) {
      return target.value;
    }
  }
  return;
};

const parseConstantEntry = (ctx: ParserContext): ConstantEntryNode => {
  const typeToken = ctx.getToken();
  let type: ConstantEntryNode["type"];
  if (typeToken.kind === TokenKind.Identifier && typeToken.value === "number") {
    type = {
      value: "number",
      location: typeToken.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedNumberOrEnd(typeToken.value),
      typeToken.location
    );
    type = {
      kind: SyntaxKind.INVALID,
      location: typeToken.location,
    };
    return {
      type,
      name: {
        kind: SyntaxKind.INVALID,
        location: typeToken.location,
      },
      value: {
        kind: SyntaxKind.INVALID,
        location: typeToken.location,
      },
      location: typeToken.location,
    };
  }

  const nameToken = ctx.getToken();
  const value = parseIntegerInitialValue(ctx, nameToken);
  let name: ConstantEntryNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    name = {
      value: nameToken.value,
      location: nameToken.location,
    };

    const numericValue = resolveConstantInitialNumber(ctx, value);
    if (numericValue !== undefined) {
      ctx.symbolParser.addConstantToScope({
        name: nameToken.value,
        declaration: nameToken.location,
        value: numericValue,
      });
    }
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        nameToken.kind,
        nameToken.value
      ),
      nameToken.location
    );
    name = {
      kind: SyntaxKind.INVALID,
      location: nameToken.location,
    };
  }

  return {
    type,
    name,
    value,
    location: {
      type: SourceLocationType.SOURCE_CODE,
      start: typeToken.location.start,
      end: value.location.end,
    },
  };
};

export const constantsParser = (
  ctx: ParserContext,
  elementToken: Token
): ConstantsElementNode => {
  const entries: ConstantEntryNode[] = [];
  let foundEnd = false;
  let endLocation: SourceCodeLocation = elementToken.location;

  while (ctx.hasMore()) {
    const token = ctx.peekToken()!;
    if (token.kind === TokenKind.Identifier && token.value === "end") {
      const endToken = ctx.getToken();
      foundEnd = true;
      endLocation = endToken.location;
      break;
    }

    entries.push(parseConstantEntry(ctx));
  }

  if (!foundEnd) {
    endLocation = entries.at(-1)?.location ?? elementToken.location;
    ctx.diagnostics.addError(
      diagnosticMessages.expectedEndBeforeEof(),
      endLocation
    );
  }

  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.CONSTANTS,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, endLocation),
    entries,
  };
};
