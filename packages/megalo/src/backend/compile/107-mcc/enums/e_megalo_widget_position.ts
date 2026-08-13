import { e_megalo_widget_position } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { HudWidgetPosition } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";

export const encodeHudWidgetPosition = (
  value: HudWidgetPosition
): e_megalo_widget_position => {
  switch (value) {
    case HudWidgetPosition.TopLeft:
      return e_megalo_widget_position.top_left;
    case HudWidgetPosition.TopCenter:
      return e_megalo_widget_position.top_center;
    case HudWidgetPosition.TopRight:
      return e_megalo_widget_position.top_right;
    case HudWidgetPosition.HighLeft:
      return e_megalo_widget_position.high_left;
    case HudWidgetPosition.HighCenter:
      return e_megalo_widget_position.high_center;
    case HudWidgetPosition.HighRight:
      return e_megalo_widget_position.high_right;
    case HudWidgetPosition.LowLeft:
      return e_megalo_widget_position.low_left;
    case HudWidgetPosition.LowCenter:
      return e_megalo_widget_position.low_center;
    case HudWidgetPosition.LowRight:
      return e_megalo_widget_position.low_right;
    case HudWidgetPosition.BottomLeft:
      return e_megalo_widget_position.bottom_left;
    case HudWidgetPosition.BottomCenter:
      return e_megalo_widget_position.bottom_center;
    case HudWidgetPosition.BottomRight:
      return e_megalo_widget_position.bottom_right;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
