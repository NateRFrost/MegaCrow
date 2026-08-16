# Equipment Usage Setting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `equipment_usage` フィールド用の値構文です。プレイヤーが装備中のアーマーアビリティを起動できるかを制御します。

ManagedMegalo はトークンを `e_equipment_usage_setting`（`equipment_usage_setting_names`、4 エントリ）に対応付けます。

## 値

| 値 | 効果 |
|----|------|
| `off` | アーマーアビリティを使えない |
| `on` | アーマーアビリティを使える |
| `disabled` | `off` と同じ |
| `enabled` | `on` と同じ |

```megalo
player_traits slayer_traits
	equipment_usage off
end
```

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
