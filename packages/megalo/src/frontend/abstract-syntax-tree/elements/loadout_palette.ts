import type { MegaloCompilerContext } from "src/context";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  type ASTErrorNode,
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import {
  type ASTParameterNode,
  parameterParserBuilder as buildParameterParser,
  type ParameterParser,
  ParameterType,
} from "src/frontend/abstract-syntax-tree/parameters";
import { type Token, TokenKind } from "src/frontend/tokens";
import type { MegaloVersion } from "src/version";

export interface LoadoutPaletteItemNode {
  identifier: string;
  location: SourceCodeLocation;
  parameters: ASTParameterNode[];
}

export type LoadoutPaletteElementNode =
  ASTElementBase<ElementKind.LOADOUT_PALETTE> & {
    name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
    items: LoadoutPaletteItemNode[];
  };

const parseIdentifier = (
  ctx: ParserContext,
  anchor: Token
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
  const token = ctx.getToken();
  if (token.kind === TokenKind.Identifier) {
    return {
      value: token.value,
      location: token.location,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedTokenKind(
      TokenKind.Identifier,
      token.kind,
      token.value
    ),
    token.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

export class LoadoutPaletteParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: string, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser("item", buildParameterParser([ParameterType.Loadout]));
  }

  public constructor(frontend: MegaloCompilerContext) {
    this.registerParsers(frontend.megaloVersion);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}

export const loadoutPaletteParser = (
  ctx: ParserContext,
  elementToken: Token
): LoadoutPaletteElementNode => {
  const nameToken = ctx.getToken();
  let name: LoadoutPaletteElementNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    ctx.symbolParser.addLoadoutPaletteToScope(
      nameToken.value,
      nameToken.location
    );
    name = {
      value: nameToken.value,
      location: nameToken.location,
    };
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
      location: elementToken.location,
    };
  }

  const items: LoadoutPaletteItemNode[] = [];

  while (ctx.hasMore()) {
    const itemIdentifier = parseIdentifier(ctx, elementToken);

    if (isAstErrorNode(itemIdentifier)) {
      continue;
    }

    if (itemIdentifier.value === "end") {
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.LOADOUT_PALETTE,
        keywordLocation: elementToken.location,
        name,
        items,
        location: locationSpan(elementToken.location, itemIdentifier.location),
      };
    }

    const parser = ctx.loadoutPaletteParserRepository.getParser(
      itemIdentifier.value
    );
    if (parser) {
      items.push({
        identifier: itemIdentifier.value,
        location: itemIdentifier.location,
        parameters: parser(ctx, itemIdentifier.location),
      });
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedLoadoutPaletteItemOrEnd(
          itemIdentifier.value
        ),
        itemIdentifier.location
      );
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.LOADOUT_PALETTE,
    keywordLocation: elementToken.location,
    name,
    items,
    location: elementToken.location,
  };
};
