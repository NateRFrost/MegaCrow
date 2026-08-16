# localized_include

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

MegaloEdit は 2 つ目の include キーワードを認識します。

```megalo
localized_include "strings/english/slayer_strings.txt"
```

構文は [`include`](/ja/language/elements/include) と同じ — 現在のファイルからの相対パスを引用符で囲みます。

ローカライズ include は通常の include と同様ですが、寛容コンパイルモードではファイルが欠けていても **省略可能** です（[コンパイラ設定](/ja/language/compiler-settings) を参照）。コンパイラがパスを見つけられない場合、警告して include をスキップします。プレーンな `include` で欠けたファイルは常にハードエラーです。

MegaloEdit は常に寛容モードを使います。

ファイルが **存在する** 場合、`localized_include` は `include` と同じく読み込み・パースします。このキーワードはコンパイル済みバリアントデータには残らず、コンパイル時にすべて解決されます。

**出荷された HREK スクリプトでは使われていません。** Bungie は代わりにラッパーファイルとプレーンな `include` を使いました。Reach スクリプティングでは、そのラッパーパターンが正式なやり方です。

## ベース派生スクリプト

`localized_include` はプレーンな `include` と同様に [ベース派生スクリプト](/ja/language/base-files) に現れられます。

## 関連項目

- [include](/ja/language/elements/include)
- [コンパイラ設定](/ja/language/compiler-settings)
