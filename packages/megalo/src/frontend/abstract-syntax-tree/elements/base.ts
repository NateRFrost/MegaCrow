import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  type ASTNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import { type Token, TokenKind } from "src/frontend/tokens";

type BaseElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & {
  value: string;
};

export type BaseElementNode = ASTElementBase<ElementKind.BASE> & {
  file: BaseElementNodeFile | ASTErrorNode;
};

export const baseParser = (
  ctx: ParserContext,
  elementToken: Token
): BaseElementNode => {
  const pathToken = ctx.getToken();
  let file: BaseElementNode["file"];

  if (pathToken.kind === TokenKind.QuotedString) {
    file = {
      kind: SyntaxKind.QUOTED_STRING,
      location: pathToken.location,
      value: pathToken.value,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.QuotedString,
        pathToken.kind,
        pathToken.value
      ),
      pathToken.location
    );
    file = {
      kind: SyntaxKind.INVALID,
      location: pathToken.location,
    };
  }

  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.BASE,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, pathToken.location),
    file,
  };
};
