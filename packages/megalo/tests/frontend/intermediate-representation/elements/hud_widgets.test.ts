import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import { HudWidgetPosition } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import { Lexer } from "../../../../frontend/tokens";
import { VersionConfiguration107MCC } from "../../../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../../../version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(new VersionConfiguration107MCC()).lower(
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
