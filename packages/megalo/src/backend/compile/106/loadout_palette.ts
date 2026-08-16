import type {
  c_game_engine_custom_variant,
  c_loadout_traits,
} from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import { encodeGrenadeCountSetting } from "src/backend/compile/106/enums";
import type { IR } from "src/frontend/intermediate-representation";
import type { LoadoutTraits } from "src/frontend/intermediate-representation/game/game_engine_default";

const compileLoadout = (
  target: c_loadout_traits,
  loadout: LoadoutTraits
): void => {
  target.m_visible = true;
  if (loadout.name !== undefined) {
    target.m_name = Number(loadout.name);
  }
  if (loadout.initialPrimaryWeaponAbsoluteIndex !== undefined) {
    target.m_initial_primary_weapon_absolute_index =
      loadout.initialPrimaryWeaponAbsoluteIndex;
  }
  if (loadout.initialSecondaryWeaponAbsoluteIndex !== undefined) {
    target.m_initial_secondary_weapon_absolute_index =
      loadout.initialSecondaryWeaponAbsoluteIndex;
  }
  if (loadout.initialEquipmentAbsoluteIndex !== undefined) {
    target.m_initial_equipment_absolute_index =
      loadout.initialEquipmentAbsoluteIndex;
  }
  if (loadout.initialGrenadeCountSetting !== undefined) {
    target.m_initial_grenade_count_setting = encodeGrenadeCountSetting(
      loadout.initialGrenadeCountSetting
    );
  }
};

export const compileLoadoutPalettes = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const loadouts = gameVariant.m_base_variant.m_loadouts;
  const { loadoutTraits } = ir.gameVariant.baseVariant;
  if (loadoutTraits.spartanLoadoutsEnabled !== undefined) {
    loadouts.m_flags.spartan_loadouts_enabled =
      loadoutTraits.spartanLoadoutsEnabled;
  }
  if (loadoutTraits.eliteLoadoutsEnabled !== undefined) {
    loadouts.m_flags.elite_loadouts_enabled =
      loadoutTraits.eliteLoadoutsEnabled;
  }
  loadoutTraits.loadoutPalettes?.forEach((palette, paletteIndex) => {
    const targetPalette = loadouts.m_loadout_palettes[paletteIndex];
    if (targetPalette === undefined) {
      return;
    }
    for (const targetLoadout of targetPalette.m_loadouts) {
      targetLoadout.initialize();
    }
    palette.loadouts?.forEach((loadout, loadoutIndex) => {
      const targetLoadout = targetPalette.m_loadouts[loadoutIndex];
      if (targetLoadout !== undefined) {
        compileLoadout(targetLoadout, loadout);
      }
    });
  });
};
