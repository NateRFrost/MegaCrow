import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
import {
  s_requisition,
  s_requisition_palette,
} from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
import { c_object_type_reference } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import type { RequisitionPalette } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_requisitions";

const BASELINE_TO_WIRE: Record<string, number> = {
  empty: 0,
  spartan: 1,
  elite: 2,
  full: 3,
};

const compilePalette = (palette: RequisitionPalette): s_requisition_palette => {
  const target = new s_requisition_palette();
  target.m_baseline = BASELINE_TO_WIRE[palette.baseline] ?? 0;
  target.entries = palette.items.map((item) => {
    const entry = new s_requisition();
    const objectType = new c_object_type_reference();
    objectType.m_object_type_index = item.objectTypeIndex;
    entry.m_object_type = objectType;
    if (typeof item.cost === "number") {
      entry.m_unknown_2 = true;
      entry.m_unknown_3 = true;
      entry.m_unknown_4 = item.cost;
    } else if (item.state === "enabled") {
      entry.m_unknown_2 = true;
      entry.m_unknown_3 = false;
      entry.m_unknown_4 = 0;
    } else {
      entry.m_unknown_2 = false;
      entry.m_unknown_3 = false;
      entry.m_unknown_4 = 0;
    }
    return entry;
  });
  return target;
};

export const compileRequisitions = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  const palettes = ir.gameVariant.gameEngine.requisitionPalettes ?? [];
  if (palettes.length > 8) {
    diagnostics.addError(
      "Too many requisition palettes (max 8).",
      BUILT_IN_LOCATION
    );
  }
  gameVariant.m_game_engine.m_requisitions = palettes
    .slice(0, 8)
    .map(compilePalette);
};
