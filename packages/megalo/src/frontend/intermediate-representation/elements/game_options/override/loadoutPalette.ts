import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { markCurrentValueUnused } from "src/frontend/intermediate-representation/diagnostics/markCurrentValueUnused";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type LoadoutPaletteType,
  loadoutPaletteType,
} from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { setField } from "src/frontend/intermediate-representation/setField";

/** Variant loadout palette slots (excludes `none`). */
const LOADOUT_PALETTE_SLOT: Partial<Record<LoadoutPaletteType, number>> = {
  spartan_tier1: 0,
  elite_tier1: 1,
  spartan_tier2: 2,
  elite_tier2: 3,
  spartan_tier3: 4,
  elite_tier3: 5,
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
  const paletteType = loadoutPaletteType.parse(tier.value);
  if (paletteType === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "loadout palette tier",
        tier.value
      ),
      tier.location
    );
  }
  const slotIndex = LOADOUT_PALETTE_SLOT[paletteType];
  if (slotIndex === undefined) {
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
      diagnosticMessages.expectedParameterType(
        "loadout palette",
        palette.value
      ),
      palette.location
    );
  }

  const loadoutTraits = ctx.ir.gameVariant.baseVariant.loadoutTraits;
  loadoutTraits.loadoutPalettes ??= [];

  const previousPalette = loadoutTraits.loadoutPalettes[slotIndex];
  if (previousPalette !== undefined) {
    markCurrentValueUnused(
      ctx.ir.locations.get(loadoutTraits.loadoutPalettes, String(slotIndex)),
      ctx.diagnostics,
      entry.location
    );
  }

  loadoutTraits.loadoutPalettes[slotIndex] = loweredPalette;
  ctx.ir.locations.record(
    loadoutTraits.loadoutPalettes,
    String(slotIndex),
    entry.location
  );

  if (loadoutTraits.spartanLoadoutsEnabled !== true) {
    setField(
      ctx.ir.locations,
      ctx.diagnostics,
      loadoutTraits,
      "spartanLoadoutsEnabled",
      true,
      entry.location
    );
  }
  if (loadoutTraits.eliteLoadoutsEnabled !== true) {
    setField(
      ctx.ir.locations,
      ctx.diagnostics,
      loadoutTraits,
      "eliteLoadoutsEnabled",
      true,
      entry.location
    );
  }
};
