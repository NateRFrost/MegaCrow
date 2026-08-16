# requisition_palette

<AvailabilityCard reach="partial" halo4="no" h2a="no">

リクジションシステムは、Halo: Reach の当初の Xbox 360 リリース前に破棄されました。この要素はプリリリースの Halo: Reach ビルド、Megalo バージョン 106 未満でのみサポートされます。

</AvailabilityCard>

試合中に D-pad の **リクジションメニュー** にどの購入可能アイテムが現れるかを制御します。
リクジションアイテムは **シナリオタグ上で定義** されます — マップで使える武器、車両、装備と、コストやカテゴリはマップデータにあります。ゲームタイプの `requisition_palette` 要素は新しいアイテムを追加しません。パレットが割り当てられたときにプレイヤーが **実際に使えるシナリオアイテム** を選びます。

各パレットは **ベースライン**（プリセットの部分集合）から始まり、その後個別アイテムを名前で有効化または無効化します。

![The requisition menu in a Reach pre-alpha build — vehicle selection showing Ghost with a point cost, opened via Left D-pad](/images/language/requisition-menu.png)

*Reach プレアルファビルドのリクジションメニュー UI。シナリオデータがアイテム一覧を供給し、ゲームタイプのパレットと [`player_enable_purchases`](/ja/language/elements/trigger/action#requisition-actions) がプレイヤーの購入可能範囲を制御します。*

```megalo
requisition_palette covy_palette_gold
	baseline elite
end

requisition_palette covy_palette_silver
	baseline elite
	item "banshee" disabled
	item "wraith_heavy" disabled
	item "energy_blade" disabled
end

requisition_palette covy_palette_bronze
	baseline empty
	item "needler" enabled
	item "plasma_pistol" enabled
	item "plasma_carbine" enabled
end

requisition_palette unsc_palette_gold
	baseline spartan
	item "wolverine" disabled
	item "falcon" enabled
end
```

| フィールド | 用途 |
|-------|---------|
| `baseline` | シナリオアイテムの開始部分集合。スクリプトで見られる値は `full`、`spartan`、`elite`、`empty`。 |
| `item` | 特定のシナリオリクジションアイテムを有効化または無効化。構文: `item "<name>" enabled` または `item "<name>" disabled`。名前はシナリオと [オブジェクトリスト](/ja/language/object-lists) のエントリと一致する必要があります。 |

実行時にパレットを割り当てるには `player_set_requisition_palette`、購入をゲートするには `player_enable_purchases` を使います。[アクション — リクジションアクション](/ja/language/elements/trigger/action#requisition-actions) を参照。

スクリプトは最大 **8** のリクジションパレットを宣言できます。

## ベース派生スクリプト

`requisition_palette` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 関連項目

- [アクション — リクジションアクション](/ja/language/elements/trigger/action#requisition-actions)
