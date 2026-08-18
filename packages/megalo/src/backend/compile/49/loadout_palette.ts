import {
  type c_game_engine_custom_variant,
  s_loadout_palette_unknown_struct,
  s_loadout_unknown_struct,
} from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import { c_object_type_reference } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import type { IR } from "src/frontend/intermediate-representation";
import type { LoadoutTraits } from "src/frontend/intermediate-representation/game/game_engine_default";

const compileEngineLoadout = (
  loadout: LoadoutTraits
): s_loadout_unknown_struct => {
  const target = new s_loadout_unknown_struct();
  const slots = [
    loadout.initialPrimaryWeaponAbsoluteIndex,
    loadout.initialSecondaryWeaponAbsoluteIndex,
    loadout.initialEquipmentAbsoluteIndex,
    undefined,
  ];
  for (let i = 0; i < 4; i++) {
    const objectType = new c_object_type_reference();
    const index = slots[i];
    objectType.m_object_type_index = typeof index === "number" ? index : -1;
    target.m_object_types[i] = objectType;
    target.m_slot_numbers[i] = 0;
  }
  return target;
};

/**
 * Alpha/delta loadouts live on `s_custom_game_engine_definition`
 * (`m_loadouts` / `m_loadout_palette`), matching `gameEngine` IR.
 */
export const compileLoadoutPalettes = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const { loadouts, loadoutPalettes } = ir.gameVariant.gameEngine;
  if (loadouts.length === 0 && loadoutPalettes.length === 0) {
    return;
  }

  const compiledLoadouts = loadouts.map(compileEngineLoadout);
  const compiledPalettes = loadoutPalettes.map((palette) => {
    const paletteStruct = new s_loadout_palette_unknown_struct();
    for (const loadout of palette.loadouts ?? []) {
      let index = loadouts.indexOf(loadout);
      if (index < 0) {
        index = compiledLoadouts.length;
        compiledLoadouts.push(compileEngineLoadout(loadout));
      }
      paletteStruct.m_loadouts.push(index);
    }
    return paletteStruct;
  });

  gameVariant.m_game_engine.m_loadouts = compiledLoadouts;
  gameVariant.m_game_engine.m_loadout_palette = compiledPalettes;
};
