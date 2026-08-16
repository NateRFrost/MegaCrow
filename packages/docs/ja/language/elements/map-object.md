# map_object

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

マップオブジェクトにラベルを付け、トリガーとアクションが名前で参照できるようにします。

```megalo
map_object slayer_stuff
	label "slayer"
end

map_object health_packs
	type "health_station"
end
```

## バインディング

すべてのフィルタには 1 つの主要バインディングが必要です。

- **`label`** — この Forge ラベル文字列を持つ任意のマップオブジェクトに一致
- **`type`** — [オブジェクトリスト](/ja/language/object-lists) のこの型のオブジェクトに一致

任意の条件で集合をさらに絞れます。

- **`team`** — チームデザイネータが所有するオブジェクト、または全チーム向けの `each`
- **`user_data`** — Forge のユーザーデータフィールドがこの符号付き整数に等しいオブジェクト
- **`min`** — 一致オブジェクトが少なくともこの数あること（既定 `0`）

```megalo
map_object flag_spawn_point
	label "ctf_flag_spawn"
	team each
end

map_object invasion_objective
	label "inv_objective"
	min 1
end

map_object phase_markers
	label "phase_marker"
	user_data 2
end
```

`team` はマルチプレイヤーのチームデザイネータ（`none`、`defenders`、`attackers`、`third_party`、…、`neutral`）または `each` を受け付けます。

`map_object` 上の `user_data` はフィルタ条件です。条件やアクションで使う実行時の `current_object.user_data` 変数とは別です。

トリガーの種類として使うと（例: `trigger health_packs`）、一致するオブジェクトごとに `current_object` を設定して 1 回実行されます。

スクリプトは最大 **16** のマップオブジェクトフィルタを宣言できます。

## ベース派生スクリプト

`map_object` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 関連項目

- [trigger](/ja/language/elements/trigger) — マップオブジェクトのトリガー種類
- [examples](/ja/language/examples) — `team each` を使う CTF フィルタ
