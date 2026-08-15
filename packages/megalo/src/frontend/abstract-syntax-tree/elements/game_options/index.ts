import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import { ElementKind } from "src/frontend/abstract-syntax-tree/elements";
import { optionParser } from "src/frontend/abstract-syntax-tree/elements/game_options/option";
import { overrideParser } from "src/frontend/abstract-syntax-tree/elements/game_options/override";
import { playerTraitsParser } from "src/frontend/abstract-syntax-tree/elements/game_options/player_traits";
import { rangedOptionParser } from "src/frontend/abstract-syntax-tree/elements/game_options/ranged_option";
import {
  isEndToken,
  locationSpan,
} from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import type {
  GameOptionEntryNode,
  GameOptionModifiers,
  GameOptionsElementNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";
import { type Token, TokenKind } from "src/frontend/tokens";

export type {
  ASTStringLiteralOrReference,
  GameOptionEntryNode,
  GameOptionModifiers,
  GameOptionsElementNode,
  OverrideEntryNode,
  OverrideLoadoutPaletteNameNode,
  OverrideLoadoutPaletteNode,
  OverrideNameNode,
  OverrideNestedBodyNode,
  OverridePlayerTraitsNameNode,
  OverrideSimpleValueNode,
  PlayerTraitsOverrideNode,
  UserDefinedOptionNode,
  UserDefinedOptionOverrideNode,
  UserDefinedOptionValueNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";

export {
  GameOptionEntryKind,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";

export const gameOptionsParser = (
  ctx: ParserContext,
  elementToken: Token
): GameOptionsElementNode => {
  const entries: GameOptionEntryNode[] = [];
  let foundEnd = false;
  let endLocation: SourceCodeLocation = elementToken.location;
  let pendingLock = false;
  let pendingHide = false;
  let pendingLockLocation: SourceCodeLocation | undefined;
  let pendingHideLocation: SourceCodeLocation | undefined;

  while (ctx.hasMore()) {
    const token = ctx.peekToken()!;
    if (isEndToken(token)) {
      const endToken = ctx.getToken();
      foundEnd = true;
      endLocation = endToken.location;
      break;
    }

    if (token.kind === TokenKind.Identifier && token.value === "lock") {
      const lockToken = ctx.getToken();
      pendingLock = true;
      pendingLockLocation = lockToken.location;
      continue;
    }

    if (token.kind === TokenKind.Identifier && token.value === "hide") {
      const hideToken = ctx.getToken();
      pendingHide = true;
      pendingHideLocation = hideToken.location;
      continue;
    }

    const modifiers: GameOptionModifiers = {
      lock: pendingLock,
      hide: pendingHide,
      ...(pendingLockLocation === undefined
        ? {}
        : { lockLocation: pendingLockLocation }),
      ...(pendingHideLocation === undefined
        ? {}
        : { hideLocation: pendingHideLocation }),
    };
    pendingLock = false;
    pendingHide = false;
    pendingLockLocation = undefined;
    pendingHideLocation = undefined;

    if (token.kind !== TokenKind.Identifier) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedGameOptionElement(token.value),
        token.location
      );
      ctx.getToken();
      continue;
    }

    const keywordToken = ctx.getToken();
    switch (keywordToken.value) {
      case "override":
        entries.push(overrideParser(ctx, keywordToken, modifiers));
        break;
      case "option":
        entries.push(optionParser(ctx, keywordToken, modifiers));
        break;
      case "ranged_option":
        entries.push(rangedOptionParser(ctx, keywordToken, modifiers));
        break;
      case "player_traits":
        entries.push(playerTraitsParser(ctx, keywordToken, modifiers));
        break;
      default:
        ctx.diagnostics.addError(
          diagnosticMessages.expectedGameOptionElement(keywordToken.value),
          keywordToken.location
        );
        break;
    }
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
    elementKind: ElementKind.GAME_OPTIONS,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, endLocation),
    entries,
  };
};
