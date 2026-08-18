import { e_active_camo_setting } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import {
  ActiveCamo,
  type ActiveCamo as ActiveCamoName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const ACTIVE_CAMO_TO_BLF = {
  [ActiveCamo.off]: e_active_camo_setting.off,
  [ActiveCamo.on]: e_active_camo_setting.on,
  [ActiveCamo.poor]: e_active_camo_setting.poor,
  [ActiveCamo.good]: e_active_camo_setting.good,
  [ActiveCamo.excellent]: e_active_camo_setting.excellent,
  [ActiveCamo.invisible]: e_active_camo_setting.invisible,
} as const satisfies Record<ActiveCamoName, e_active_camo_setting>;

export const encodeActiveCamoSetting = (
  value: ActiveCamoName
): e_active_camo_setting => mapMegaloEnum(value, ACTIVE_CAMO_TO_BLF);
