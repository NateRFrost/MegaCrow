import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import type { HudWidgetsElementNode } from "src/frontend/abstract-syntax-tree/elements/hud_widgets";
import { diagnosticMessages } from "src/diagnostics/messages";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import { HudWidgetPosition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";

const HUD_WIDGET_POSITIONS: Record<string, HudWidgetPosition> = {
  top_left: HudWidgetPosition.TopLeft,
  top_center: HudWidgetPosition.TopCenter,
  top_right: HudWidgetPosition.TopRight,
  high_left: HudWidgetPosition.HighLeft,
  high_center: HudWidgetPosition.HighCenter,
  high_right: HudWidgetPosition.HighRight,
  low_left: HudWidgetPosition.LowLeft,
  low_center: HudWidgetPosition.LowCenter,
  low_right: HudWidgetPosition.LowRight,
  bottom_left: HudWidgetPosition.BottomLeft,
  bottom_center: HudWidgetPosition.BottomCenter,
  bottom_right: HudWidgetPosition.BottomRight,
};

const HUD_WIDGET_POSITION_NAMES = Object.keys(HUD_WIDGET_POSITIONS);

export const hudWidgetsLowerer: ElementLowerer<HudWidgetsElementNode> = (
  element,
  ctx
) => {
  const hudWidgets = ctx.ir.gameVariant.gameEngine.hudWidgets;

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      assertNotErrorNode(entry.name);
      assertNotErrorNode(entry.position);

      const position = HUD_WIDGET_POSITIONS[entry.position.value];
      if (position === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            HUD_WIDGET_POSITION_NAMES.map((name) => `'${name}'`),
            entry.position.value
          ),
          entry.position.location
        );
      }

      hudWidgets.push(position);
    });
  }
};
