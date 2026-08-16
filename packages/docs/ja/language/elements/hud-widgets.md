# hud_widgets

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

画面上の HUD ウィジェットスロットを宣言します。各行はウィジェット識別子と画面位置です。

![Halo: Reach HUD with labeled widget positions — top_left, top_center, top_right, high/low left and right, high/low/bottom center, and bottom_left on the motion tracker](/images/language/hud-widget-positions.png)

*ウィジェット位置トークンと、Reach HUD 上での配置。*

```megalo
hud_widgets
	proximity_warning high_center
	arming_warning low_center
	game_state_widget top_left
	rating_widget top_left
end
```

最初のトークンはウィジェットスロット用に選ぶ **カスタム名**（例: `proximity_warning` や `arming_warning`）です。2 つ目のトークンはアンカー位置です。

よく使う位置には `top_left`、`top_right`、`top_center`、`bottom_center`、`high_left`、`high_right`、`high_center`、`low_center`、`low_left` があります。

ウィジェットは実行時に `hud_widget_set_text`、`hud_widget_set_meter`、`hud_widget_set_visibility` などの HUD アクションで駆動します。[action](/ja/language/elements/trigger/action) を参照。

スクリプトは最大 **4** の HUD ウィジェットを宣言できます。

## ベース派生スクリプト

`hud_widgets` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 関連項目

- [player_rating](/ja/language/elements/player-rating) — `rating_widget` と組み合わせる
- [action](/ja/language/elements/trigger/action)
