# プレイヤートレイト

`game_options` 内の [`player_traits`](/ja/language/elements/game-options/player-traits) ブロック用のフィールド名です。値は ManagedMegalo（Reach）の `PlayerTraitField` enum と一致します。

`player_traits` ブロックの各行は 1 つのフィールドを設定します。未記載のフィールドは以前の値（または最初の適用時はエンジンのデフォルト）を保持します。

<EnumVersionTable enum="player-traits" />

## 注意

**Type** 列は各フィールドの値構文を示します。名前付き enum は値ページへリンクし、その他の型はプレーンテキストで示します。パーセンテージフィールドは、`code` 内の代替キーワード（例: `damage_resistance` のパーセンテージや `invulnerable`）も受け付けることがあります。

Reach の利用可否は megalo エンコーディングバージョンラベル（例: **≤73**、**107+**）で示されます。ほとんどのプレイヤートレイトフィールドは、Reach では追跡対象バージョンの **49** 以降すべて、および Halo 4 と Halo 2: Anniversary で利用できます。**`sprinting`**（Reach **≤73** のみ）などの例外は表内で明示されます。

オブジェクト参照フィールド（`initial_primary_weapon`、`initial_secondary_weapon`、`initial_equipment`）は、ゲームタイプの [オブジェクトリスト](/ja/language/object-lists) に対して名前を解決します。`initial_grenades` は [Grenade Count](/ja/language/enums/player-traits/grenade-count) 構文を使います。

## 関連

- [Grenade Count](/ja/language/enums/player-traits/grenade-count) — `initial_grenades`
- [Vehicle Usage Setting](/ja/language/enums/player-traits/vehicle-usage-setting) — `vehicle_usage`
- [Sprinting](/ja/language/enums/player-traits/sprinting) — `sprinting`
- [Equipment Usage Setting](/ja/language/enums/player-traits/equipment-usage-setting) — `equipment_usage`
- [Active Camo Setting](/ja/language/enums/player-traits/active-camo-setting) — `active_camo`
- [Waypoint Setting](/ja/language/enums/player-traits/waypoint-setting) — `waypoint`、`gamertag_visibility`
- [Forced Change Color Setting](/ja/language/enums/player-traits/forced-change-color-setting) — `color`
- [Motion Tracker Setting](/ja/language/enums/player-traits/motion-tracker-setting) — `tracker_mode`
