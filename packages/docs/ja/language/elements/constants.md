# constants

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

実行時に変更できない名前付き数値。

```megalo
constants
	number k_special_death_type_none 0
	number k_special_death_type_melee 1
	number k_special_death_type_headshot 5
end
```

各行は型（出荷スクリプトでは `number`）、名前、整数値を宣言します。定数は変数、トリガー、その他の名前付き要素とグローバルな名前空間を共有します。

## ベース派生スクリプト

`constants` は [ベース派生スクリプト](/ja/language/base-files) に現れて、定数を追加または置換できます。

## 関連項目

- [変数モデル](/ja/language/variable-model) — 実行時に変更可能なストレージ
