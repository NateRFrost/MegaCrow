# コンパイラ設定

Megalo ソースはこれらのオプションを宣言しません — コンパイラがスクリプトをどれだけ厳しく解釈するかを変える **コンパイル時スイッチ** です。同じ `.txt` でも、エディタが使うモードによってエラー、警告、変数割り当ての結果が変わります。

HREK の **MegaloEdit** は常に **寛容モード**（許容的な既定値）でコンパイルします。Bungie の内部ビルドファームはおそらくより厳格な設定を使っていました。スイッチは **ManagedMegalo.dll**（`ParsingHelper`、`MegaloCompiler`）にあり、MegaloEdit は配線していますが UI には露出していません。

MegaloEdit は **入力** と **出力ディレクトリ** 設定（ファイル → 設定）も公開しています。これらのパスは外部ファイルの解決場所を制御します。

| 設定 | 解決に使うとき |
|---------|---------------------|
| **入力ディレクトリ** | [`include`](/ja/language/elements/include) と [`localized_include`](/ja/language/elements/localized-include) のパス |
| **出力ディレクトリ** | コンパイル済み `.mglo` への [`base`](/ja/language/elements/base) 参照 |

ソース内の include パスは入力ディレクトリ（およびインクルード元ファイル）からの相対です。ベースパスは出力ディレクトリ内のコンパイル済みバリアント名 — MegaloEdit.exe では既定で HREK インストール下の `maps/megalo` — です。参照する派生をビルドする前に親スクリプトをコンパイルして `.mglo` を用意してください。[ベースファイル](/ja/language/base-files) を参照。

## localized_include の厳格さ

欠けた [`localized_include`](/ja/language/elements/localized-include) を省略可能にするか致命的にするかを制御します。

| モード | ファイル欠損時の挙動 |
|------|----------------------|
| **寛容**（MegaloEdit） | 警告、include をスキップ — コンパイル続行 |
| **厳格** | ハードエラー。欠けたプレーン [`include`](/ja/language/elements/include) と同じ |

ファイルが存在する場合、両モードの挙動は同じです。

MegaloEdit は常に寛容モードを使います。[`localized_include`](/ja/language/elements/localized-include) を参照。

*ManagedMegalo.dll: `ParsingHelper` 上の `enforceLocalizedIncludes`。*

## 文字列リテラルの厳格さ

文字列テーブル記号が期待される箇所で **引用リテラル文字列** を許すかどうかを制御します。

多くの要素は文字列テーブルトークンを要求します — `engine_data name "Slayer"` ではなく `engine_data name slayer_title`。寛容モードではリテラルでもコンパイルできますが警告が出ます。

> *You used a literal string '…'. Fix this before you submit. The build farm enforces localization.*

厳格モードでは同じリテラルは **ハードエラー** です。厳格モードはパーサーがローカライズを強制している箇所での引用文字列もブロックします。

MegaloEdit は常に寛容モードを使います。出荷 Reach スクリプトは一貫して文字列テーブル記号を使います。

*ManagedMegalo.dll: `ParsingHelper` 上の `enforceLocalization`。*

## 一時変数のオーバーフロー

**`temporary`** は、トリガーまたは `for_each` ブロック内で `temporary` キーワードにより宣言するスクラッチ変数です。そのブロック実行の間だけ存在し — 永続的な [`variables`](/ja/language/elements/variables) スロットを宣言せずにゲッター結果や中間値を保持するのに便利です。[変数モデル — 一時変数](/ja/language/variable-model#temporary-variables) を参照。

一時変数の割り当ては Megalo バージョンごとに変わっています。

- **当初** — `temporary` 導入時、コンパイラは一時変数を **グローバル変数** として扱い、グローバル変数プールから直接割り当てていました。
- **Halo 4** — **専用の一時変数プール** を追加し、グローバルを消費せずにトリガーが使えるスクラッチ変数を実質的に増やしました。
- **Reach MCC** — その別プールが Halo 4 から **バックポート** されました。Xbox 360 TU1 Reach は依然として当初のグローバル対応付けです。

このオーバーフロー設定は Megalo バージョンが **Xbox 360 TU1 より後**（Reach MCC 以降）の場合にのみ適用されます。TU1 では一時変数はすでにグローバルにマップされるため、オーバーフロー元となる別プールはありません。

MCC Reach では、各 [アクションスコープ](/ja/language/elements/trigger#action-scope) に型ごとの固定された専用一時プールがあります。スコープあたり:

| 型 | 専用プール | グローバルへの最大オーバーフロー |
|------|----------------|----------------------------|
| `number` | 10 | 12 |
| `object` | 8 | 16 |
| `team` | 6 | 8 |
| `player` | 3 | 8 |

オーバーフローが **有効**（MegaloEdit 既定）のとき、専用プールが満杯になるとコンパイラは余剰の一時変数を同型の **未使用グローバル変数スロット** へ、オーバーフロー上限まで溢れさせられます。オーバーフローが **無効** のとき、一時スロット不足はコンパイル失敗になります。

これは 1 つのスコープにどれだけロジックを詰められるかに影響します — 構文ではなく、深く入れ子の `temporary` 宣言が受理されるかどうかです。スコープ入れ子と TU1 の挙動は [107 (MCC) — Limits](/ja/versions/107-mcc/#limits) と [107 — Limits](/ja/versions/107/#limits) を参照。

*ManagedMegalo.dll: `MegaloCompiler` 上の `TemporaryVariablesCanOverflowIntoUnusedGlobalVariables`。*

[Megalo バージョン](/ja/guide/megalo-versions)（MCC と TU1）も参照。

## まとめ

| 設定 | 寛容（MegaloEdit） | 厳格 | 言語機能 |
|---------|---------------------|---------------------|------------------|
| 入力ディレクトリ | — | — | [`include`](/ja/language/elements/include)、[`localized_include`](/ja/language/elements/localized-include) |
| 出力ディレクトリ | — | — | [`base`](/ja/language/elements/base)（`.mglo` 検索） |
| ローカライズ include | 欠損 → 警告 | 欠損 → エラー | [`localized_include`](/ja/language/elements/localized-include) |
| 文字列リテラル | 警告 | エラー | 文字列テーブル記号 vs `"quoted"` テキスト |
| 一時変数オーバーフロー（MCC+） | 空きグローバルへ溢れ | プール満杯でコンパイル失敗 | トリガー内の [`temporary`](/ja/language/elements/trigger#action-scope) |

## 関連項目

- [ベースファイル](/ja/language/base-files) — 派生スクリプトと `.mglo` 検索
- [`localized_include`](/ja/language/elements/localized-include)
- [構文 — Includes](/ja/language/syntax#includes)
- [trigger — アクションスコープ](/ja/language/elements/trigger#action-scope)
- [変数モデル — 一時変数](/ja/language/variable-model#temporary-variables)
- [Megalo バージョン](/ja/guide/megalo-versions) — MCC と Xbox 360 TU1
