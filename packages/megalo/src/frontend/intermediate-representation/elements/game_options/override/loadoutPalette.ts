import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  LOADOUT_PALETTE_TYPE_BY_NAME,
  LoadoutPaletteType,
} from "src/frontend/intermediate-representation/game/megalogamengine/LoadoutPaletteType";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { setField } from "src/frontend/intermediate-representation/setField";

const resolveLoadoutPaletteType = (
  tier: string,
  location: SourceCodeLocation
): LoadoutPaletteType => {
  const type = LOADOUT_PALETTE_TYPE_BY_NAME[tier];
  if (type === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette tier", tier),
      location
    );
  }
  return type;
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
  const paletteType = resolveLoadoutPaletteType(tier.value, tier.location);
  const slotIndex = paletteType - LoadoutPaletteType.spartan_tier1;
  if (slotIndex < 0) {
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
  loadoutTraits.loadoutPalettes[slotIndex] = loweredPalette;
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
