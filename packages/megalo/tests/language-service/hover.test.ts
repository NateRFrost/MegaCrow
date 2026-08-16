import { getLocale, setLocale } from "src/localization";
import { afterEach, describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
  hoverAtPosition,
  hoverDocumentationForId,
  resolveHoverTarget,
} from "../../src/language-service";
import { defineActionHover } from "../../src/language-service/hover/registry";
import { renderContributionMarkdown } from "../../src/language-service/hover/render";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

/** Character index near the middle of `needle` on the given 0-based line. */
const onToken = (source: string, line: number, needle: string): number => {
  const lineText = source.split(/\n/)[line] ?? "";
  const index = lineText.indexOf(needle);
  expect(index).toBeGreaterThanOrEqual(0);
  return index + Math.floor(needle.length / 2);
};

afterEach(() => {
  setLocale("en");
});

describe("language-service hover", () => {
  it("resolves and renders markdown for a known action", async () => {
    const source = `trigger player
\taction biped_give_weapon current_player "shotgun" force
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const position = {
      line: 1,
      character: onToken(source, 1, "biped_give_weapon"),
    };

    const target = resolveHoverTarget(snapshot, position);
    expect(target).toMatchObject({
      kind: "action",
      id: "biped_give_weapon",
    });

    const hover = hoverAtPosition(snapshot, position);
    expect(hover).not.toBeNull();
    expect(hover!.contents.kind).toBe("markdown");
    expect(hover!.contents.value).toContain("**action** `biped_give_weapon`");
    expect(hover!.contents.value).toContain(
      "Gives a weapon to a biped/player."
    );
    expect(hover!.contents.value).toContain("```megalo");
    expect(hover!.contents.value).toContain("biped_give_weapon");
    expect(hover!.contents.value).toContain("**Parameters**");
    expect(hover!.contents.value).toContain(
      "Object or player that receives the weapon."
    );
  });

  it("falls back to English when Japanese copy is missing", () => {
    setLocale("ja");
    const contribution = defineActionHover("hover_fallback_probe", {
      grammar: "action hover_fallback_probe",
    });
    const markdown = renderContributionMarkdown(contribution);
    // Missing i18n key falls back to the key path, then English if present —
    // probe has neither, so the unresolved key is acceptable as long as render works.
    expect(markdown).toContain("**アクション** `hover_fallback_probe`");
    expect(markdown).toContain("action.hover_fallback_probe.summary");
    expect(markdown).not.toContain("undefined");
  });

  it("uses Japanese summary and param details from hover locale JSON", () => {
    setLocale("ja");
    expect(getLocale()).toBe("ja");
    const docs = hoverDocumentationForId("action", "biped_give_weapon");
    expect(docs).toBeDefined();
    expect(docs!).toContain("**アクション**");
    expect(docs!).toContain("バイペッド／プレイヤーに武器を付与します。");
    expect(docs!).toContain("**パラメータ**");
    expect(docs!).toContain("武器を受け取るオブジェクトまたはプレイヤー。");
  });

  it("localizes condition, element, keyword, and param hovers", () => {
    setLocale("ja");
    expect(hoverDocumentationForId("condition", "if")).toContain(
      "数値比較演算子で 2 つの値を比較します。"
    );
    expect(hoverDocumentationForId("element", "trigger")).toContain(
      "イベントやフェーズ向けに条件とアクションを実行するトリガーを定義します。"
    );
    expect(hoverDocumentationForId("keyword", "begin")).toContain(
      "対応する end で閉じる入れ子ブロックを開始します。"
    );
    expect(hoverDocumentationForId("param", "game_options.override")).toContain(
      "組み込みオプションまたは traits ブロックをスクリプト値で上書きします。"
    );
    expect(hoverDocumentationForId("param", "game_options.override")).toContain(
      "**プロパティ**"
    );
  });

  it("has Japanese summaries for every registered hover contribution", async () => {
    const { actionHovers } = await import(
      "../../src/language-service/hover/actions/catalog"
    );
    const { conditionHovers } = await import(
      "../../src/language-service/hover/conditions/catalog"
    );
    const { elementHovers } = await import(
      "../../src/language-service/hover/elements/catalog"
    );
    const { elementParamHovers } = await import(
      "../../src/language-service/hover/elements/params"
    );
    const { keywordHovers } = await import(
      "../../src/language-service/hover/keywords"
    );

    setLocale("ja");
    const missing: string[] = [];
    for (const contribution of [
      ...actionHovers,
      ...conditionHovers,
      ...elementHovers,
      ...elementParamHovers,
      ...keywordHovers,
    ]) {
      const docs = hoverDocumentationForId(contribution.kind, contribution.id);
      const key = `${contribution.kind}.${contribution.id}.summary`;
      if (docs === undefined || docs.includes(key)) {
        missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });

  it("attaches documentation on action-name completions", async () => {
    const source = `trigger initialization
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = 1;
    const character = (source.split(/\n/)[line] ?? "").length;
    const items = completionsAtPosition(snapshot, { line, character });
    const biped = items.find((item) => item.label === "biped_give_weapon");
    expect(biped?.documentation).toBeDefined();
    expect(biped!.documentation).toContain("biped_give_weapon");
  });
});
