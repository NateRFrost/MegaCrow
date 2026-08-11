import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "../../../../abstract-syntax-tree/elements/game_options";
import { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { assertNotErrorNode } from "../../../diagnostics/assertNotErrorNode";
import { LowerError } from "../../../error";
import type { ElementLowerContext } from "../../../parameters/context";
import { setField } from "../../../setField";


// TODO: Find a new home for this enum
export const enum LoadoutPaletteType {
  none = 0,
  spartan_tier1 = 1,
  elite_tier1 = 2,
  spartan_tier2 = 3,
  elite_tier2 = 4,
  spartan_tier3 = 5,
  elite_tier3 = 6,
}

const getLoadoutPaletteType = (tier: string, location: SourceCodeLocation) => {
  switch (tier) {
    case "spartan_tier1":
      return LoadoutPaletteType.spartan_tier1;
    case "elite_tier1":
      return LoadoutPaletteType.elite_tier1;
    case "spartan_tier2":
      return LoadoutPaletteType.spartan_tier2;
    case "elite_tier2":
      return LoadoutPaletteType.elite_tier2;
    case "spartan_tier3":
      return LoadoutPaletteType.spartan_tier3;
    case "elite_tier3":
      return LoadoutPaletteType.elite_tier3;
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("loadout palette tier", tier),
        location
      );
  }
};

export const lowerLoadoutPaletteOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  if (entry.value.kind !== OverrideValueKind.LOADOUT_PALETTE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette override", ""),
      entry.location
    );
  }
  const { tier, palette } = entry.value;
  assertNotErrorNode(tier);
  assertNotErrorNode(palette);
  const tierIndex = getLoadoutPaletteType(tier.value, tier.location);
  if (tierIndex === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "loadout palette tier",
        tier.value
      ),
      tier.location
    );
  }
  const loweredPalette = ctx.loadoutPalettesByName.get(palette.value);
  if (loweredPalette === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette", palette.value),
      palette.location
    );
  }

  const loadoutTraits = ctx.ir.gameVariant.baseVariant.loadoutTraits;
  loadoutTraits.loadoutPalettes ??= [];
  loadoutTraits.loadoutPalettes[tierIndex] = loweredPalette;
  setField(
    ctx.ir.locations,
    ctx.diagnostics,
    loadoutTraits,
    "spartanLoadoutsEnabled",
    true,
    entry.location
  );
  setField(
    ctx.ir.locations,
    ctx.diagnostics,
    loadoutTraits,
    "eliteLoadoutsEnabled",
    true,
    entry.location
  );
};
