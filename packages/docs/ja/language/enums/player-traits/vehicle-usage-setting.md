# Vehicle Usage Setting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `vehicle_usage` フィールド用の値構文です。プレイヤーが車両に乗れるか、どの座席が許可されるかを制御します。

ManagedMegalo はトークンを `e_vehicle_usage_setting`（`vehicle_use_setting_names`、9 エントリ）に対応付けます。

## 値

| 値 | 効果 |
|----|------|
| `none` | 車両に乗れない |
| `full` | 車両への完全なアクセス（運転席・銃手・助手席） |
| `passenger` | 助手席のみ |
| `not_passenger` | 運転席と銃手席（助手席は不可） |
| `driver` | 運転席のみ |
| `gunner` | 銃手席のみ |
| `not_driver` | 銃手席と助手席（運転席は不可） |
| `not_gunner` | 運転席と助手席（銃手席は不可） |
| `unchanged` | 以前の設定を変更しない |

```megalo
player_traits race_traits
	vehicle_usage not_passenger
end
```

Reach スクリプトでは `passenger`、`none`、`not_passenger` が最もよく使われます。

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
