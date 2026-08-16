# Waypoint Setting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `waypoint` および `gamertag_visibility` フィールド用の値構文です。両フィールドは同じ `e_waypoint_setting` 文字列テーブル（`waypoint_visibility_names`、4 エントリ）を読みます。

- **`waypoint`** — プレイヤー上のナビポイントを誰が見られるか
- **`gamertag_visibility`** — プレイヤーに照準を合わせたとき、ゲーマータグを誰が見られるか

## 値

| 値 | 効果 |
|----|------|
| `off` | 全員から非表示 |
| `all` | 全プレイヤーに表示 |
| `allies` | 味方のみに表示 |
| `unchanged` | 以前の設定を変更しない |

```megalo
player_traits flag_carrier_traits
	waypoint allies
	gamertag_visibility off
end
```

スクリプトによるウェイポイントは、特定プレイヤーに対して `waypoint` トレイトを上書きできます。

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
