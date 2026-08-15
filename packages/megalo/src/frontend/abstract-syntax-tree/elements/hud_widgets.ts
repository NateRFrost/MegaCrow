import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import { type Token, TokenKind } from "src/frontend/tokens";

interface HudWidgetEntryNodeName {
  location: SourceCodeLocation;
  value: string;
}

interface HudWidgetEntryNodePosition {
  location: SourceCodeLocation;
  value: string;
}

export interface HudWidgetEntryTextKeyword {
  location: SourceCodeLocation;
  value: "text";
}

export interface HudWidgetEntryNode {
  location: SourceCodeLocation;
  name: HudWidgetEntryNodeName | ASTErrorNode;
  position: HudWidgetEntryNodePosition | ASTErrorNode;
  textKeyword?: HudWidgetEntryTextKeyword;
}

export type HudWidgetsElementNode = ASTElementBase<ElementKind.HUD_WIDGETS> & {
  entries: HudWidgetEntryNode[];
};

const tryConsumeLegacyTextKeyword = (
  ctx: ParserContext
): HudWidgetEntryTextKeyword | undefined => {
  const first = ctx.peekToken();
  const second = ctx.peekToken(1);
  const third = ctx.peekToken(2);
  if (
    !(
      first?.kind === TokenKind.Identifier &&
      first.value === "text" &&
      second?.kind === TokenKind.Identifier &&
      third?.kind === TokenKind.Identifier &&
      first.location.start.line === second.location.start.line &&
      second.location.start.line === third.location.start.line
    )
  ) {
    return;
  }

  const textToken = ctx.getToken();
  if (ctx.frontend.megaloVersion.version >= 106) {
    const message = diagnosticMessages.legacyHudWidgetTextKeyword();
    if (ctx.frontend.megacrowExtensions.supportLegacySyntax) {
      ctx.diagnostics.addWarning(message, textToken.location);
    } else {
      ctx.diagnostics.addError(message, textToken.location);
    }
  }

  return {
    value: "text",
    location: textToken.location,
  };
};

const parseHudWidgetEntry = (ctx: ParserContext): HudWidgetEntryNode => {
  const textKeyword = tryConsumeLegacyTextKeyword(ctx);
  const nameToken = ctx.getToken();
  let name: HudWidgetEntryNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    ctx.symbolParser.addHudWidgetToScope(nameToken.value, nameToken.location);
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
      location: nameToken.location,
    };
  }

  const positionToken = ctx.getToken();
  let position: HudWidgetEntryNode["position"];
  if (positionToken.kind === TokenKind.Identifier) {
    position = {
      value: positionToken.value,
      location: positionToken.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        positionToken.kind,
        positionToken.value
      ),
      positionToken.location
    );
    position = {
      kind: SyntaxKind.INVALID,
      location: positionToken.location,
    };
  }

  const startLocation = textKeyword?.location ?? nameToken.location;

  return {
    ...(textKeyword === undefined ? {} : { textKeyword }),
    name,
    position,
    location: {
      type: SourceLocationType.SOURCE_CODE,
      start: startLocation.start,
      end: positionToken.location.end,
    },
  };
};

export const hudWidgetsParser = (
  ctx: ParserContext,
  elementToken: Token
): HudWidgetsElementNode => {
  const entries: HudWidgetEntryNode[] = [];

  ctx.parseUntilEnd(() => {
    entries.push(parseHudWidgetEntry(ctx));
  });

  const endToken = ctx.peekToken(-1);
  const endLocation =
    endToken?.location ?? entries.at(-1)?.location ?? elementToken.location;

  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.HUD_WIDGETS,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, endLocation),
    entries,
  };
};
