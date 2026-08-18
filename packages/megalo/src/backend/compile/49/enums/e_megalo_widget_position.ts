import { e_megalo_widget_position } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import {
  HudWidgetPosition,
  type HudWidgetPosition as HudWidgetPositionName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const HUD_WIDGET_POSITION_TO_BLF = {
  [HudWidgetPosition.top_left]: e_megalo_widget_position.top_left,
  [HudWidgetPosition.top_center]: e_megalo_widget_position.top_center,
  [HudWidgetPosition.top_right]: e_megalo_widget_position.top_right,
  [HudWidgetPosition.high_left]: e_megalo_widget_position.high_left,
  [HudWidgetPosition.high_center]: e_megalo_widget_position.high_center,
  [HudWidgetPosition.high_right]: e_megalo_widget_position.high_right,
  [HudWidgetPosition.low_left]: e_megalo_widget_position.low_left,
  [HudWidgetPosition.low_center]: e_megalo_widget_position.low_center,
  [HudWidgetPosition.low_right]: e_megalo_widget_position.low_right,
  [HudWidgetPosition.bottom_left]: e_megalo_widget_position.bottom_left,
  [HudWidgetPosition.bottom_center]: e_megalo_widget_position.bottom_center,
  [HudWidgetPosition.bottom_right]: e_megalo_widget_position.bottom_right,
} as const satisfies Record<HudWidgetPositionName, e_megalo_widget_position>;

export const encodeHudWidgetPosition = (
  value: HudWidgetPositionName
): e_megalo_widget_position => mapMegaloEnum(value, HUD_WIDGET_POSITION_TO_BLF);
