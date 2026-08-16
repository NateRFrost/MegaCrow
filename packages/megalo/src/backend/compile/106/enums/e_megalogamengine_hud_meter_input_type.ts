import { e_megalogamengine_hud_meter_input_type } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  HUDMeterInputType,
  type HUDMeterInputType as HUDMeterInputTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const HUD_METER_INPUT_TYPE_TO_BLF = {
  [HUDMeterInputType.none]: e_megalogamengine_hud_meter_input_type.none,
  [HUDMeterInputType.number]: e_megalogamengine_hud_meter_input_type.number,
  [HUDMeterInputType.timer]: e_megalogamengine_hud_meter_input_type.timer,
} as const satisfies Record<
  HUDMeterInputTypeName,
  e_megalogamengine_hud_meter_input_type
>;

export const encodeHUDMeterInputType = (
  value: HUDMeterInputTypeName
): e_megalogamengine_hud_meter_input_type =>
  mapMegaloEnum(value, HUD_METER_INPUT_TYPE_TO_BLF);
