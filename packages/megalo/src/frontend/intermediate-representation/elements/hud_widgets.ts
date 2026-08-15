import { diagnosticMessages } from "src/diagnostics/messages";
import type { HudWidgetsElementNode } from "src/frontend/abstract-syntax-tree/elements/hud_widgets";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { LowerError } from "src/frontend/intermediate-representation/error";
import { hudWidgetPosition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";

export const hudWidgetsLowerer: ElementLowerer<HudWidgetsElementNode> = (
  element,
  ctx
) => {
  const hudWidgets = ctx.ir.gameVariant.gameEngine.hudWidgets;

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      assertNotErrorNode(entry.name);
      assertNotErrorNode(entry.position);

      const position = hudWidgetPosition.parse(entry.position.value);
      if (position === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            hudWidgetPosition.names.map((name) => `'${name}'`),
            entry.position.value
          ),
          entry.position.location
        );
      }

      hudWidgets.push(position);
    });
  }
};
