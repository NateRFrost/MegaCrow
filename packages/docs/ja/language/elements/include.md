# include

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

`include` ディレクティブは、コンパイル時に別のソースファイルを現在のスクリプトへマージします。

```megalo
include "strings/slayer_strings.txt"
include "includes/multiplayer_loadouts.txt"
include "includes/sudden_death_pre.txt"
```

インクルードされたファイルはその要素を最終スクリプトに寄与します。Bungie がロードアウト、サドンデス、実績などの共通ロジックを多くのゲームタイプで共有した方法です。

パスは引用符で囲み、現在のファイルのディレクトリからの相対です。欠けた include は **ハードコンパイルエラー** です。

<DocsBlock type="note" title="各パスは一度だけ解決">

同じスクリプト内で既に読み込まれたファイルへの 2 回目の `include` は **完全にスキップ** されます — ディレクティブ行は省略され、ファイルは再マージされません。パスは大文字小文字を区別せず比較されます。これにより、言語非依存の文字列テーブルなどのラッパーが、推移的に取り込まれたファイルを再処理せずに全ロケールを列挙できます。

ファイルが自分自身を直接またはサイクル経由で include することはできず、それはコンパイルエラーです。

</DocsBlock>

## 文字列テーブルのラッパー

文字列テーブルは、言語非依存のラッパーが言語ごとのファイルを include する形でよく整理されます。

```megalo
include "strings/common_strings.txt"
```

`strings/common_strings.txt` 自体は、言語ごとに 1 行のプレーンな include の一覧です。

```megalo
include "english/common_strings.txt"
include "french/common_strings.txt"
include "german/common_strings.txt"
```

各言語ファイルは [`string_table`](/ja/language/elements/string-table) で始まり、そのロケール向けの翻訳文字列を定義します。

## ベース派生スクリプト

`include` は [ベース派生スクリプト](/ja/language/base-files) に現れて、ローカライズ文字列や共有断片を追加できます。

## 関連項目

- [`localized_include`](/ja/language/elements/localized-include) — 省略可能な言語別 include
- [構文 — Includes](/ja/language/syntax#includes)
