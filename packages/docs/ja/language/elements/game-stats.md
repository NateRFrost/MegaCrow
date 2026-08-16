# game_stats

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

スコアボードと試合終了サマリーにどの統計を出すかを宣言します。各行が追跡する統計を 1 つ命名します。

```megalo
game_stats
	stat_caps number stat_caps_text none 1
	stat_carry_time timer stat_carry_time_text none 0
	stat_plants number stat_plants_text none 0
	stat_returns number stat_returns_text none 0
end
```

行の形式:

```
<stat_name> <type> <label_string> <unit_string> <flags>
```

| フィールド | 用途 |
|-------|---------|
| `<stat_name>` | 内部統計識別子（例: `stat_caps`、`stat_carry_time`） |
| `<type>` | 値の種類 — 出荷スクリプトでは `number` または `timer` |
| `<label_string>` | 表示名の文字列テーブル記号 |
| `<unit_string>` | 単位ラベル記号、または `none` |
| `<flags>` | 可視性フラグ（出荷スクリプトでは `0` または `1`） |

統計値は実行時にゲームロジック — 通常はプレイヤー統計メンバーへの `set` アクション — で更新されます。[アクション — ゲーム統計](/ja/language/elements/trigger/action#game-statistics) を参照。

## ベース派生スクリプト

`game_stats` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 関連項目

- [アクション — ゲーム統計](/ja/language/elements/trigger/action#game-statistics)
