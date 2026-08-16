# Active Camo Setting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `active_camo` フィールド用の値構文です。プレイヤーのパッシブアクティブカモフラージュ品質を設定します。

ManagedMegalo はトークンを `e_active_camo_setting`（`active_camo_setting_names`、6 エントリ）に対応付けます。

## 値

| 値 | 効果 |
|----|------|
| `off` | アクティブカモなし |
| `on` | デフォルト品質でアクティブカモ有効 |
| `poor` | 低品質のアクティブカモ |
| `good` | 中品質のアクティブカモ |
| `excellent` | 高品質のアクティブカモ |
| `invisible` | 最大のアクティブカモ（実質的に不可視） |

```megalo
player_traits stealth_traits
	active_camo invisible
end
```

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
