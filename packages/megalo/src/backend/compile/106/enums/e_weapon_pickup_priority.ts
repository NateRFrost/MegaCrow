import { e_weapon_pickup_priority } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  WeaponPickupPriority,
  type WeaponPickupPriority as WeaponPickupPriorityName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const WEAPON_PICKUP_PRIORITY_TO_BLF = {
  [WeaponPickupPriority.normal]: e_weapon_pickup_priority.normal,
  [WeaponPickupPriority.special]: e_weapon_pickup_priority.high,
  [WeaponPickupPriority.auto]: e_weapon_pickup_priority.automatic,
} as const satisfies Record<WeaponPickupPriorityName, e_weapon_pickup_priority>;

export const encodeWeaponPickupPriority = (
  value: WeaponPickupPriorityName
): e_weapon_pickup_priority =>
  mapMegaloEnum(value, WEAPON_PICKUP_PRIORITY_TO_BLF);
