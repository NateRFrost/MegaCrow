import {
  GameOptionEntryKind,
  type GameOptionEntryNode,
  type GameOptionsElementNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { isBaseDerived } from "src/frontend/intermediate-representation/diagnostics/assertAllowedInBaseDerived";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { lowerOption, lowerOptionOverride } from "src/frontend/intermediate-representation/elements/game_options/option";
import { lowerOverride } from "src/frontend/intermediate-representation/elements/game_options/override";
import {
  lowerPlayerTraits,
  lowerPlayerTraitsOptionOverride,
} from "src/frontend/intermediate-representation/elements/game_options/player_traits";
import { lowerRangedOption } from "src/frontend/intermediate-representation/elements/game_options/ranged_option";

const lowerEntry = (entry: GameOptionEntryNode, ctx: ElementLowerContext) => {
  if (isBaseDerived(ctx)) {
    switch (entry.kind) {
      case GameOptionEntryKind.OPTION:
        throw new LowerError(
          diagnosticMessages.gameOptionNotAllowedInBaseDerived("option"),
          entry.location
        );
      case GameOptionEntryKind.RANGED_OPTION:
        throw new LowerError(
          diagnosticMessages.gameOptionNotAllowedInBaseDerived("ranged_option"),
          entry.location
        );
      case GameOptionEntryKind.PLAYER_TRAITS:
        throw new LowerError(
          diagnosticMessages.gameOptionNotAllowedInBaseDerived("player_traits"),
          entry.location
        );
      default:
        break;
    }
  } else {
    switch (entry.kind) {
      case GameOptionEntryKind.OPTION_OVERRIDE:
        throw new LowerError(
          diagnosticMessages.gameOptionOverrideRequiresBase("option"),
          entry.location
        );
      case GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE:
        throw new LowerError(
          diagnosticMessages.gameOptionOverrideRequiresBase("player_traits"),
          entry.location
        );
      default:
        break;
    }
  }

  switch (entry.kind) {
    case GameOptionEntryKind.OVERRIDE:
      lowerOverride(entry, ctx);
      break;
    case GameOptionEntryKind.OPTION:
      lowerOption(entry, ctx);
      break;
    case GameOptionEntryKind.OPTION_OVERRIDE:
      lowerOptionOverride(entry, ctx);
      break;
    case GameOptionEntryKind.RANGED_OPTION:
      lowerRangedOption(entry, ctx);
      break;
    case GameOptionEntryKind.PLAYER_TRAITS:
      lowerPlayerTraits(entry, ctx);
      break;
    case GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE:
      lowerPlayerTraitsOptionOverride(entry, ctx);
      break;
  }
};

export const gameOptionsLowerer: ElementLowerer<GameOptionsElementNode> = (
  element,
  ctx
) => {
  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      lowerEntry(entry, ctx);
    });
  }
};
