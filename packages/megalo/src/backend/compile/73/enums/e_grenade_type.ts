import { e_grenade_type } from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
import {
  GrenadeType,
  type GrenadeType as GrenadeTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const GRENADE_TYPE_TO_BLF = {
  [GrenadeType.frag]: e_grenade_type.frag_grenade,
  [GrenadeType.plasma]: e_grenade_type.plasma_grenade,
} as const satisfies Record<GrenadeTypeName, e_grenade_type>;

export const encodeGrenadeType = (value: GrenadeTypeName): e_grenade_type =>
  mapMegaloEnum(value, GRENADE_TYPE_TO_BLF);
