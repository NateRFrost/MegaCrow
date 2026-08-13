import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  type ASTIntegerNode,
  type ASTReferenceNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import {
  isEndToken,
  locationSpan,
  parseIdentifier,
} from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import { isAstErrorNode } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTKeywordParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { type Token, TokenKind } from "src/frontend/tokens";

export type MapPermissionsValueNode =
  | ASTIntegerNode
  | ASTReferenceNode
  | ASTKeywordParameterNode
  | ASTErrorNode;

export interface MapPermissionsEntryNode {
  key: string;
  value: MapPermissionsValueNode;
}

export type MapPermissionsElementNode =
  ASTElementBase<ElementKind.MAP_PERMISSIONS> & {
    entries: MapPermissionsEntryNode[];
  };

const isMissingValue = (token: Token | undefined): boolean =>
  !token || (token.kind === TokenKind.Identifier && token.value === "end");

const parseMapPermissionsValue = (
  ctx: ParserContext,
  anchor: SourceCodeLocation
): MapPermissionsValueNode => {
  const valuePeek = ctx.peekToken();
  if (isMissingValue(valuePeek)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
      anchor
    );
    return {
      kind: SyntaxKind.INVALID,
      location: anchor,
    };
  }

  const valueToken = ctx.getToken();
  if (valueToken.kind === TokenKind.Integer) {
    return {
      kind: SyntaxKind.INTEGER,
      location: valueToken.location,
      value: Number.parseInt(valueToken.value, 10),
    };
  }

  if (valueToken.kind === TokenKind.Identifier) {
    if (valueToken.value === "true" || valueToken.value === "false") {
      return {
        kind: SyntaxKind.KEYWORD,
        value: valueToken.value,
        location: valueToken.location,
      };
    }

    const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
    if (symbolId === undefined) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedConstantValue(valueToken.value),
        valueToken.location
      );
      return {
        kind: SyntaxKind.INVALID,
        location: valueToken.location,
      };
    }

    ctx.symbolParser.recordReference(symbolId, valueToken.location);
    return {
      kind: SyntaxKind.REFERENCE,
      location: valueToken.location,
      identifier: valueToken.value,
      symbolId,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedConstantValue(valueToken.value),
    valueToken.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: valueToken.location,
  };
};

export const mapPermissionsParser = (
  ctx: ParserContext,
  elementToken: Token
): MapPermissionsElementNode => {
  const entries: MapPermissionsEntryNode[] = [];

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (!token) {
      break;
    }

    if (isEndToken(token)) {
      const endToken = ctx.getToken();
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.MAP_PERMISSIONS,
        keywordLocation: elementToken.location,
        entries,
        location: locationSpan(elementToken.location, endToken.location),
      };
    }

    const key = parseIdentifier(ctx, elementToken);

    if (isAstErrorNode(key)) {
      continue;
    }

    entries.push({
      key: key.value,
      value: parseMapPermissionsValue(ctx, key.location),
    });
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.MAP_PERMISSIONS,
    keywordLocation: elementToken.location,
    entries,
    location: elementToken.location,
  };
};
