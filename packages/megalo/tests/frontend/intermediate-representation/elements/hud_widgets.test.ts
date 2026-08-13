import { describe, expect, it } from "vitest";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../src/diagnostics";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import { HudWidgetPosition } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import { Lexer } from "../../../../src/frontend/tokens";

import { MEGALO_VERSIONS } from "../../../../src/version";
import { MegaloCompilerContext } from "../../../../src/context";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(
    ast,
    diagnostics,
    { objectLists }
  );
  return { ir, diagnostics };
};

describe("hud_widgets lowering", () => {
  it("lowers widget positions in source order", () => {
    const source = `hud_widgets
\tattacker_widget top_left
\tdefender_widget top_right
\tproximity_warning high_center
\tarming_warning bottom_center
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.gameEngine.hudWidgets).toEqual([
      HudWidgetPosition.TopLeft,
      HudWidgetPosition.TopRight,
      HudWidgetPosition.HighCenter,
      HudWidgetPosition.BottomCenter,
    ]);
  });

  it("errors on unknown positions", () => {
    const source = `hud_widgets
\twatermark not_a_position
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("top_left");
    expect(ir.gameVariant.gameEngine.hudWidgets).toEqual([]);
  });

  it("lowers more than four widgets without error", () => {
    const source = `hud_widgets
\tw0 top_left
\tw1 top_center
\tw2 top_right
\tw3 high_left
\tw4 high_center
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.gameEngine.hudWidgets).toEqual([
      HudWidgetPosition.TopLeft,
      HudWidgetPosition.TopCenter,
      HudWidgetPosition.TopRight,
      HudWidgetPosition.HighLeft,
      HudWidgetPosition.HighCenter,
    ]);
  });
});
