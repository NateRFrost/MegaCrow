import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import { parseUserDefinedOption } from "src/frontend/abstract-syntax-tree/elements/game_options/option";
import type {
  GameOptionModifiers,
  UserDefinedOptionNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";
import type { Token } from "src/frontend/tokens";

export const rangedOptionParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): UserDefinedOptionNode =>
  parseUserDefinedOption(ctx, keywordToken, modifiers, true);
