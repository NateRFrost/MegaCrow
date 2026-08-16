# loadout

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

プレイヤーのロードアウト定義。各 `loadout` ブロックは選択可能な 1 行 — 表示名、武器、装備、手榴弾 — を記述します。

![One loadout in the Reach respawn selection menu — Sprint, with sprint equipment, two frag grenades, Assault Rifle, and Magnum](/images/language/loadout.png)

*ロードアウト選択 UI の各エントリは、ゲームタイプスクリプト内の単一の `loadout` ブロックに対応します。*

```megalo
loadout loadout_scout
	name loadout_name_scout
	primary_weapon assault_rifle
	backpack_weapon magnum
	equipment sprint_equipment
	grenades 2 frag
end
```

| フィールド | 用途 |
|-------|---------|
| `name` | ロードアウト名の文字列テーブル記号 |
| `primary_weapon` | [オブジェクトリスト](/ja/language/object-lists) からの主武器 |
| `backpack_weapon` | 副武器 |
| `equipment` | アーマーアビリティ／装備 |
| `grenades` | 個数と種類（例: `2 frag`） |

ロードアウトは [`loadout_palette`](/ja/language/elements/loadout-palette) でパレットにまとめます。

スクリプトは最大 **32** のロードアウトを宣言できます。

## ベース派生スクリプト

`loadout` は [ベース派生スクリプト](/ja/language/base-files) に現れて、ロードアウト定義を上書きできます。

## 関連項目

- [loadout_palette](/ja/language/elements/loadout-palette)
