import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  LoadoutPaletteType,
  type LoadoutPaletteType as LoadoutPaletteTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";

/** Compile-time `m_loadout_palette_index` values (includes `none`). */
const LOADOUT_PALETTE_INDEX = {
  [LoadoutPaletteType.none]: 0,
  [LoadoutPaletteType.spartan_tier1]: 1,
  [LoadoutPaletteType.elite_tier1]: 2,
  [LoadoutPaletteType.spartan_tier2]: 3,
  [LoadoutPaletteType.elite_tier2]: 4,
  [LoadoutPaletteType.spartan_tier3]: 5,
  [LoadoutPaletteType.elite_tier3]: 6,
} as const satisfies Record<LoadoutPaletteTypeName, number>;

export const encodeLoadoutPaletteIndex = (
  value: LoadoutPaletteTypeName
): number => mapMegaloEnum(value, LOADOUT_PALETTE_INDEX);
