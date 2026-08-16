# engine_data

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

ゲームタイプブラウザに表示されるメタデータ。

```megalo
engine_data
	name slayer_title
	description slayer_description
	icon k_engine_icon_slayer
	category slayer
end
```

| フィールド | 用途 |
|-------|---------|
| `name` | ゲームタイプタイトルの文字列テーブル記号 |
| `description` | 説明の文字列テーブル記号 |
| `icon` | エンジンアイコン定数（例: `k_engine_icon_slayer`） |
| `category` | 短い [エンジンカテゴリ](/ja/language/enums/engine-categories) 名（例: `slayer`）。下記参照 |

値はリテラルの引用文字列ではなく文字列テーブル記号名です — ただし `category` は接頭辞付き照合を使います。

<DocsBlock type="info" title="バリアント名と説明">

ゲームタイプの `name` と `description` は通常の文字列とは別に格納されるため、ゲームタイプの文字列件数やサイズ上限にはカウントされません。

</DocsBlock>

<DocsBlock type="note" title="カテゴリの奇妙さ">

`category` は他の Megalo フィールドと異なります。組み込みの [エンジンカテゴリ](/ja/language/enums/engine-categories) enum と、ローカライズされた文字列テーブルラベルの両方に対応します。

`category slayer` と書くと、文字列テーブル記号 `engine_category_slayer`（`slayer` ではない）に解決されます。その接頭辞付き記号は通常、`strings/engine_category_strings.txt` のような共有 include で定義されます。

```megalo
string_table english
	engine_category_slayer "Slayer"
	engine_category_vip "VIP"
	; …
end
```

</DocsBlock>

## ベース派生スクリプト

`engine_data` は [ベース派生スクリプト](/ja/language/base-files) に現れて、継承したゲームタイプメタデータを上書きできます。
