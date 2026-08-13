import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { LoadoutPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout_palette";
import { diagnosticMessages } from "src/diagnostics/messages";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { LoadoutPaletteTraits } from "src/frontend/intermediate-representation/game/game_engine_default";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters";

export const loadoutPaletteLowerer = (
  element: LoadoutPaletteElementNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(element.name);
    const paletteName = element.name.value;
    const palette: LoadoutPaletteTraits = { loadouts: [] };
    for (const item of element.items) {
      const name =
        item.kind === SyntaxKind.REFERENCE
          ? item.identifier
          : item.kind === SyntaxKind.KEYWORD
            ? item.value
            : undefined;
      const loadout =
        name === undefined ? undefined : ctx.loadoutsByName.get(name);
      if (loadout === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("loadout", name ?? ""),
          item.location
        );
      }
      palette.loadouts!.push(loadout);
    }

    // Megalo Headache #1
    if (!ctx.loadoutPalettesByName.has(paletteName)) {
      ctx.loadoutPalettesByName.set(paletteName, palette);
    }
  });
};
