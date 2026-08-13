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

type IncludeElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & {
  value: string;
};

export type IncludeElementNode = ASTElementBase<ElementKind.INCLUDE> & {
  file: IncludeElementNodeFile | ASTErrorNode;
};

export const includeParser = (
  ctx: ParserContext,
  elementToken: Token
): IncludeElementNode => {
  const pathToken = ctx.getToken();
  let file: IncludeElementNode["file"];

  if (pathToken.kind === TokenKind.QuotedString) {
    file = {
      kind: SyntaxKind.QUOTED_STRING,
      location: pathToken.location,
      value: pathToken.value,
    };
  } else {
    // MegaloEdit.exe: Expected token of type QuotedString, got one of type <type>: <token>
    ctx.diagnostics?.addError(
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
    elementKind: ElementKind.INCLUDE,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, pathToken.location),
    file,
  };
};
