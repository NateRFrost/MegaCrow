# string_table

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

言語別に整理されたローカライズ UI 文字列。

```megalo
string_table english
	slayer_title "Slayer"
	slayer_description "Score points by killing players on the opposing team."
end
```

各ブロックは言語識別子を付けます。文字列名はスクリプトの他の場所で記号として参照されます（例: `engine_data name slayer_title`）。

実際にスクリプトで参照された文字列だけがコンパイル済みゲームタイプに書き込まれます。`string_table` で定義されても他で使われない記号は出力から省略され、下記の制限にもカウントされません。

コンパイル済みゲームタイプは、全言語合計で最大 **112** 文字列エントリと合計 **19,456** バイトの文字列データを含められます。

文字列テーブルは通常ラッパーファイル経由で include されます — [include](/ja/language/elements/include) を参照。

## 対応言語

MegaloEdit は `string_table` の後に次の言語識別子を受け付けます。

- `english`
- `japanese`
- `german`
- `french`
- `spanish`
- `mexican_spanish`
- `italian`
- `korean`
- `traditional_chinese`
- `simplified_chinese`
- `portuguese`
- `polish`

## 重複記号

単一の `string_table` ブロック内では、各記号は一度だけ現れられます。

同じ言語の別々の `string_table` ブロック間では、両方の定義が実際にパースされた場合、MegaloEdit は重複記号を拒否します。同じスクリプト内で既に読み込まれた [`include`](/ja/language/elements/include) ファイルへの 2 回目の `include` は完全にスキップされるため（MegaloEdit は include パスを大文字小文字を区別せず追跡）、複数のラッパーが `strings/slayer_strings.txt` のような共有文字列ファイルを参照しても二重マージされません。

```text
String table for language english already has a string for token foo defined
```

出荷 Reach スクリプトは、include ツリー全体で各記号を一度だけ定義してこれを避けます。後続ブロックや include での記号の再定義は、黙っての上書きではなくコンパイルエラーです。

## ベース派生スクリプト

`string_table` と文字列の [`include`](/ja/language/elements/include) ディレクティブは、[ベース派生スクリプト](/ja/language/base-files) に現れてローカライズ文字列を追加できます。

## 関連項目

- [include](/ja/language/elements/include)
