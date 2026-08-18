import { e_biped_give_weapon_mode } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import {
  BipedGiveWeaponMode,
  type BipedGiveWeaponMode as BipedGiveWeaponModeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const BIPED_GIVE_WEAPON_MODE_TO_BLF = {
  [BipedGiveWeaponMode.primary]: e_biped_give_weapon_mode.primary,
  [BipedGiveWeaponMode.secondary]: e_biped_give_weapon_mode.secondary,
  [BipedGiveWeaponMode.force]: e_biped_give_weapon_mode.force,
} as const satisfies Record<BipedGiveWeaponModeName, e_biped_give_weapon_mode>;

export const encodeBipedGiveWeaponMode = (
  value: BipedGiveWeaponModeName
): e_biped_give_weapon_mode =>
  mapMegaloEnum(value, BIPED_GIVE_WEAPON_MODE_TO_BLF);
