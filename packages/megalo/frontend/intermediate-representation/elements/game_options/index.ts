import {
  GameOptionEntryKind,
  type GameOptionEntryNode,
  type GameOptionsElementNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { ElementLowerer } from "..";
import { dxAssertionScope } from "../../diagnostics";
import { isBaseDerived } from "../../diagnostics/assertAllowedInBaseDerived";
import { LowerError } from "../../error";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerOption, lowerOptionOverride } from "./option";
import { lowerOverride } from "./override";
import {
  lowerPlayerTraits,
  lowerPlayerTraitsOptionOverride,
} from "./player_traits";
import { lowerRangedOption } from "./ranged_option";

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
