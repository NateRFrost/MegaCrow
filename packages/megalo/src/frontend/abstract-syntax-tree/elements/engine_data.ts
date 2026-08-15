import type { MegaloCompilerContext } from "src/context";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
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
import {
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import {
  type ASTParameterNode,
  parameterParserBuilder as buildParameterParser,
  type ParameterParser,
  ParameterType,
} from "src/frontend/abstract-syntax-tree/parameters";
import {
  ENGINE_CATEGORY_STRING_PREFIX,
  type EngineDataPropertyKey,
} from "src/frontend/language-configuration/omni/engine_data";
import { type Token, TokenKind } from "src/frontend/tokens";
import type { MegaloVersion } from "src/version";

/**
 * `category vip` resolves the string symbol `engine_category_vip`, not `vip`.
 */
const parseEngineCategoryParameter: ParameterParser = (
  ctx: ParserContext,
  anchor: SourceCodeLocation
): ASTParameterNode[] => {
  const peek = ctx.peekToken();
  if (!peek || isEndToken(peek) || peek.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        peek?.kind ?? TokenKind.None,
        peek?.value ?? ""
      ),
      anchor
    );
    return [
      {
        kind: SyntaxKind.INVALID,
        location: anchor,
      },
    ];
  }

  const token = ctx.getToken();
  const symbolName = `${ENGINE_CATEGORY_STRING_PREFIX}${token.value}`;
  const symbolId = ctx.symbolParser.lookupString(symbolName);
  if (symbolId === undefined) {
    ctx.diagnostics.addError(
      diagnosticMessages.invalidStringIdentifier(symbolName),
      token.location
    );
    return [
      {
        kind: SyntaxKind.INVALID,
        location: token.location,
      },
    ];
  }

  ctx.symbolParser.recordReference(symbolId, token.location);
  return [
    {
      kind: SyntaxKind.REFERENCE,
      identifier: token.value,
      symbolId,
      location: token.location,
    },
  ];
};

export interface EngineDataPropertyNode {
  identifier: EngineDataPropertyKey;
  location: SourceCodeLocation;
  parameters: ASTParameterNode[];
}

export type EngineDataElementNode = ASTElementBase<ElementKind.ENGINE_DATA> & {
  properties: EngineDataPropertyNode[];
};

export class EngineDataParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: EngineDataPropertyKey, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser(
      "name",
      buildParameterParser([[ParameterType.QuotedString, ParameterType.String]])
    );
    this.registerParser(
      "description",
      buildParameterParser([[ParameterType.QuotedString, ParameterType.String]])
    );
    this.registerParser("icon", buildParameterParser([ParameterType.Integer]));
    this.registerParser("category", parseEngineCategoryParameter);
  }

  public constructor(frontend: MegaloCompilerContext) {
    this.registerParsers(frontend.megaloVersion);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}

export const engineDataParser = (
  ctx: ParserContext,
  elementToken: Token
): EngineDataElementNode => {
  const properties: EngineDataPropertyNode[] = [];

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (!token) {
      break;
    }

    if (isEndToken(token)) {
      const endToken = ctx.getToken();
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.ENGINE_DATA,
        keywordLocation: elementToken.location,
        properties,
        location: locationSpan(elementToken.location, endToken.location),
      };
    }

    const propertyIdentifier = parseIdentifier(ctx, elementToken);

    if (isAstErrorNode(propertyIdentifier)) {
      continue;
    }

    const parser = ctx.engineDataParserRepository.getParser(
      propertyIdentifier.value
    );
    if (parser) {
      properties.push({
        identifier: propertyIdentifier.value as EngineDataPropertyKey,
        location: propertyIdentifier.location,
        parameters: parser(ctx, propertyIdentifier.location),
      });
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.unknownEngineDataProperty(propertyIdentifier.value),
        propertyIdentifier.location
      );
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.ENGINE_DATA,
    keywordLocation: elementToken.location,
    properties,
    location: elementToken.location,
  };
};
