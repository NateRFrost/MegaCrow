# player_traits

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

[`game_options`](/ja/language/elements/game-options) 内で、`player_traits` はロビーで選択可能な名前付き特性セットを定義します。

```megalo
player_traits flag_carrier_traits
	traits_name_flag_carrier_traits
	traits_description_flag_carrier_traits
	speed 75
	vehicle_usage passenger
end
```

各ブロックは特性セット名で始まり、続けて `traits_name` と `traits_description` の文字列記号、その後に特性フィールド行が来ます。列挙されていない特性は変更なしのままです。

完全なフィールド一覧とゲームごとの可用性は [プレイヤー特性](/ja/language/enums/player-traits) を参照。

スクリプトは最大 **16** のプレイヤー特性セットを宣言できます。

## 関連項目

- [プレイヤー特性 enum](/ja/language/enums/player-traits)
- [Grenade Count](/ja/language/enums/player-traits/grenade-count) — `initial_grenades`
- [Vehicle Usage Setting](/ja/language/enums/player-traits/vehicle-usage-setting) — `vehicle_usage`
- [Sprinting](/ja/language/enums/player-traits/sprinting) — `sprinting`
- [Equipment Usage Setting](/ja/language/enums/player-traits/equipment-usage-setting) — `equipment_usage`
- [Active Camo Setting](/ja/language/enums/player-traits/active-camo-setting) — `active_camo`
- [Waypoint Setting](/ja/language/enums/player-traits/waypoint-setting) — `waypoint`、`gamertag_visibility`
- [Forced Change Color Setting](/ja/language/enums/player-traits/forced-change-color-setting) — `color`
- [Motion Tracker Setting](/ja/language/enums/player-traits/motion-tracker-setting) — `tracker_mode`
- [game_options](/ja/language/elements/game-options)
