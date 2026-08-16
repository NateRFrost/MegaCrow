import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import { encodeHudWidgetPosition } from "src/backend/compile/106/enums/e_megalo_widget_position";
import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { IR } from "src/frontend/intermediate-representation";

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
