import { SyntaxKind } from "../../../../abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "../../../../abstract-syntax-tree/elements/game_options";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { dxAssertionScope } from "../../../diagnostics";
import { LowerError } from "../../../error";
import type { ElementLowerContext } from "../../../parameters/context";
import { applyBuiltinLockHide } from "./helpers";
import { lowerLoadoutPaletteOverride } from "./loadoutPalette";
import { tryLowerMapOverride } from "./map";
import { tryLowerMiscOverride } from "./misc";
import { lowerPlayerTraitsOverride } from "./playerTraits";
import { tryLowerRespawnOverride } from "./respawn";
import { tryLowerSocialOverride } from "./social";
import { tryLowerTu1Override } from "./tu1";

/**
 * @link https://blam-network.github.io/megalo/language/elements/game-options#override
 */
export const lowerOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  const { diagnostics, ir } = ctx;
  dxAssertionScope(diagnostics, () => {
    const { name } = entry;

    if (name.kind === SyntaxKind.INVALID) {
      return;
    }

    if (name.kind === "loadout_palette") {
      lowerLoadoutPaletteOverride(entry, ctx);
      return;
    }

    if (name.kind === "player_traits_override") {
      lowerPlayerTraitsOverride(entry, ctx);
      return;
    }

    const optionName = name.identifier;
    applyBuiltinLockHide(
      ir,
      diagnostics,
      optionName,
      entry.modifiers,
      entry.location
    );

    if (entry.value.kind === SyntaxKind.INVALID) {
      return;
    }

    if (entry.value.kind !== OverrideValueKind.SIMPLE) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("override value", ""),
        entry.location
      );
    }

    const handled =
      tryLowerMiscOverride(optionName, entry, ctx) ||
      tryLowerRespawnOverride(optionName, entry, ctx) ||
      tryLowerSocialOverride(optionName, entry, ctx) ||
      tryLowerMapOverride(optionName, entry, ctx) ||
      tryLowerTu1Override(optionName, entry, ctx);

    if (!handled) {
      throw new LowerError(
        diagnosticMessages.unknownGameOptionOverride(optionName),
        entry.location
      );
    }
  });
};
