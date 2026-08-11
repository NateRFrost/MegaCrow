import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { BUILT_IN_LOCATION, type Diagnostics } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import type { IR } from "../../intermediate-representation";
import { encodeHudWidgetPosition } from "./enums/e_megalo_widget_position";

const MAX_HUD_WIDGETS = 4;

export const compileHudWidgets = (
  ir: IR,
  gametype: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  const widgets = ir.gameVariant.gameEngine.hudWidgets;
  if (widgets.length > MAX_HUD_WIDGETS) {
    diagnostics.addError(
      diagnosticMessages.tooManyHudWidgets(),
      BUILT_IN_LOCATION
    );
  }

  gametype.m_game_engine.m_hud_widgets = widgets
    .slice(0, MAX_HUD_WIDGETS)
    .map(encodeHudWidgetPosition);
};
