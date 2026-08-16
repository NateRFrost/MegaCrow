# player_rating

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

スコアボードと HUD に表示される Arena 風のプレイヤー単位レーティング式を設定します。多くの Slayer バリアントでは `includes/arena_rating_v0.txt` から include され、派生スクリプトでは部分的に上書きされます。

```megalo
player_rating
	kill_weight 1
	assist_weight 0.5
	betrayal_weight 1
	death_weight 0.5
	loss_scalar 1
	rating_scale 1
	normalize_by_max_kills 1
	base_value 1000
	range 1000
	custom_stat_0 0
	custom_stat_1 0
	custom_stat_2 0
	custom_stat_3 0
	show_in_scoreboard 0
end
```

| フィールド | 用途 |
|-------|---------|
| `kill_weight`、`assist_weight`、`betrayal_weight`、`death_weight` | 生レーティングへのイベントごとの寄与（デスと背信は減算） |
| `loss_scalar` | 1 位以外のプレイヤーへの乗数 |
| `rating_scale`、`normalize_by_max_kills` | 最終レーティング曲線の前に適用されるスカラー |
| `base_value`、`range` | 表示レーティングの中心と最大偏差 |
| `custom_stat_0` … `custom_stat_3` | Megalo カスタム統計の重み（通常は `0` のまま） |
| `show_in_scoreboard` | スコアボードにレーティング列を出すか |

[`hud_widgets`](/ja/language/elements/hud-widgets) 内の `rating_widget` と、`local_player.rating` を参照する HUD アクションと組み合わせてください。[アクション — プレイヤーレーティング](/ja/language/elements/trigger/action#player-rating) を参照。

## ベース派生スクリプト

`player_rating` は [ベース派生スクリプト](/ja/language/base-files) に現れて、レーティングパラメータを上書きできます。

## 関連項目

- [アクション — プレイヤーレーティング](/ja/language/elements/trigger/action#player-rating)
- [hud_widgets](/ja/language/elements/hud-widgets)
