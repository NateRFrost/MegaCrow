# Motion Tracker Setting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `tracker_mode` フィールド用の値構文です。プレイヤーのモーショントラッカー挙動を制御します。

ManagedMegalo はトークンを `e_motion_tracker_setting`（`motion_tracker_setting_names`、5 エントリ）に対応付けます。レーダー到達距離を設定するには `tracker_range`（パーセンテージ）と組み合わせます。

## 値

| 値 | 効果 |
|----|------|
| `unchanged` | 以前の設定を変更しない |
| `off` | モーショントラッカーなし |
| `allies` | モーショントラッカーに味方のみ |
| `normal` | 標準のモーショントラッカー規則 |
| `enhanced` | 移動速度に関係なく全プレイヤーを表示 |

```megalo
player_traits slayer_traits
	tracker_mode off
end
```

```megalo
player_traits infected_traits
	tracker_mode enhanced
	tracker_range 150
end
```

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
