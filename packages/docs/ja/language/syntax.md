# 構文とファイル形式

Megalo スクリプトは、**要素** の列からなるプレーンテキストファイル（`.txt`）です。このページでは字句規則 — トークンの作り方、コメント、ファイルの組み立て方 — を扱います。

## ファイル構造

Megalo ファイルは上から下への要素の列です。必須の順序はありませんが、出荷スクリプトはだいたい次の慣習に従います。

1. `include` ディレクティブ（および任意で `base` 宣言）
2. `string_table` / 文字列の include
3. `engine_data`、`teams`、`map_permissions`
4. `map_object` ラベル
5. `game_options`、`constants`
6. `variables`
7. `hud_widgets`、ロードアウト、統計
8. `trigger` ブロック

個別の要素ページはサイドバーの **Elements** にあります。

## 要素モデル

Megalo ソースは入れ子の要素として構造化されます。

- **ブロック要素** はキーワードで始まり、`end` で閉じます。キーワードがその内側で許される子要素を決めます。
- **フィールド要素** はブロック内の 1 行です（親の下にインデント）。
- **リーフ要素**（`include` など）はトップレベルに単独行として現れます。

合法な子要素の集合は常に親が決めます。たとえば `game_options` ブロック内では `option`、`override`、`player_traits`、`lock`、`hide` は書けますが、`trigger` や `variables` は書けません。

```megalo
game_options                          ; block element opens
	override teams_enabled false      ; field element
	override score_to_win_round 25    ; field element

	option kill_points                ; nested block element
		option_name_kill_points
		option_description_kill_points
		1
		0 points_0 ""
		1 points_1 ""
	end                               ; closes option

	player_traits leader_traits       ; nested block element
		leader_traits_name leader_traits_description
		waypoint unchanged
	end                               ; closes player_traits
end                                   ; closes game_options
```

より小さいブロックでは、入れ子の `begin`/`end` ではなく、フラットなインデント付きフィールド一覧を使うものもあります。

```megalo
engine_data
	name slayer_title
	description slayer_description
	icon k_engine_icon_slayer
	category slayer
end
```

## コメント

Megalo には **行コメントのみ** があります。セミコロンから行末までがコメントです。

```megalo
; This is a comment.
action set my_counter add 1  ; inline comment
```

## トークン

Megalo ソースは少数の種類のトークンに分解されます。

| トークン | 例 |
|-------|---------|
| 識別子 | `my_counter`、`player_died`、`set_to` |
| メンバー区切り | `current_player.score` の `.` |
| 引用文字列 | `"ctf_flag_spawn"`、`"Slayer"` |
| 整数 | `0`、`25`、`-1`、`+1` |
| 浮動小数点 | `1.5`、`+3.5` |
| コメント | `; ...` |

## 文字列リテラル

二重引用符の文字列は次のエスケープをサポートします。

| エスケープ | 意味 |
|--------|---------|
| `\n` | 改行 |
| `\r` | キャリッジリターン |
| `\t` | タブ |
| `\"` | リテラルの引用符 |
| `\\` | リテラルのバックスラッシュ |

それ以外の `\x` 列は、バックスラッシュとその文字をそのまま通します。

引用文字列は Megalo の **文字列リテラル** です。レキサーがエスケープをデコードし、結果のテキストをコンパイラに渡します。リテラルは次の 3 つの役割でよく現れます。

| 役割 | 例 |
|------|---------|
| Include パス | `include "strings/slayer_strings.txt"` |
| 文字列テーブルエントリ | [`string_table`](/ja/language/elements/string-table) 内の `slayer_title "Slayer"` |
| アクションのオペランド | `action hud_post_message everyone none "CTF"` |

### 文字列テーブル記号とインラインリテラル

出荷スクリプトのユーザー向けテキストの多くは **文字列テーブル記号** — ローカライズ済みエントリを指す非引用の識別子 — を使います。

```megalo
string_table english
	slayer_title "Slayer"
	slayer_description "Score points by killing players on the opposing team."
end

engine_data
	name slayer_title
	description slayer_description
end

trigger general
	action hud_post_message everyone none invasion_title_spartan
end
```

`string_table` ブロックが言語ごとにリテラルテキストを一度定義します。それ以外では、引用テキストを繰り返さず記号（`slayer_title`、`invasion_title_spartan`）を参照します。これによりゲームタイプ名、HUD 文字列、目標文をローカライズしやすくなります。

一部のアクションオペランドは代わりに **インラインリテラル** — トリガーに直接埋め込んだ引用テキスト — を受け付けます。

```megalo
action hud_post_message everyone none "CTF"
action hud_widget_set_text watermark "Environment Artist"
```

コンパイラはインラインリテラルのテキストをコンパイル時にバリアントのスクリプト文字列テーブルへ格納します。インラインリテラルは **ローカライズできません** — 引用テキストはコンパイル時点で固定です。[厳格なコンパイラ設定](/ja/language/compiler-settings#string-literal-strictness) では、文字列テーブル記号が期待される箇所でのリテラルは禁止されます。開発中（使い捨てメッセージ、ツール用スクリプト、`%n` 書式文字列）には便利ですが、ゲームタイプを仕上げるときは `string_table` 記号を優先してください。

### 書式プレースホルダ

いくつかの文字列オペランドは [動的文字列](/ja/language/enums/dynamic-strings) です。テキストに `%` プレースホルダ（`%n`、`%p`、`%t`、`%o`、`%s`）を含められ、対応する参照オペランドが文字列の後に続きます。

```megalo
action player_set_objective current_player "+%n" score_to_win_round
```

実行時にエンジンがプレイヤーのスコア上限を `%n` スロットに代入し、`+25` のようなテキストになります。プレースホルダ表、制限、使用するアクションは [動的文字列](/ja/language/enums/dynamic-strings) を参照。

### 厳格コンパイラ

多くのフィールドはリテラルではなく文字列テーブルの **記号** を期待します。たとえば `engine_data name slayer_title` は普通ですが、`engine_data name "Slayer"` は MegaloEdit ではコンパイルできても、内部ビルドファームでは拒否される旨の警告が出ます。[文字列リテラルの厳格さ](/ja/language/compiler-settings#string-literal-strictness) を参照。

アクションや条件での文字列オペランドの解決については [文字列テーブル参照](/ja/language/references#string-table-references) も参照。

## 識別子と命名

変数、定数、トリガー、要素の名前について:

- 英数字とアンダースコアを含められる
- 数字で **始めてはならない**
- 共有名前空間で **一意** でなければならない（変数、定数、トリガー、ゲームオプション、その他の名前付き要素は衝突できない）

```megalo
variables global
	local number red_score 0       ; valid
	local number team3_score 0     ; valid
	local number 4team_score 0     ; invalid — starts with a digit
end
```

## Includes

`include` ディレクティブは、コンパイル時に別のソースファイルを現在のスクリプトへマージします。

```megalo
include "strings/slayer_strings.txt"
include "includes/multiplayer_loadouts.txt"
include "includes/sudden_death_pre.txt"
```

インクルードされたファイルはその要素を最終スクリプトに寄与します。Bungie がロードアウト、サドンデス、実績などの共通ロジックを多くのゲームタイプで共有した方法です。

同じスクリプト内で既にインクルードされたパスはスキップされます（一度だけ解決）。サイクルを含む詳細は [`include`](/ja/language/elements/include) を参照。

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

各言語ファイルは `string_table <language>` で始まり、そのロケール向けの翻訳文字列を定義します。

### localized_include

MegaloEdit は 2 つ目の include キーワードを認識します。

```megalo
localized_include "strings/english/slayer_strings.txt"
```

構文は `include` と同じ — 現在のファイルからの相対パスを引用符で囲みます。

ローカライズ include は通常の include と同様ですが、寛容コンパイルモードではファイルが欠けていても **省略可能** です。コンパイラがパスを見つけられない場合、警告を出して include をスキップし、コンパイルは失敗しません。プレーンな `include` で欠けたファイルは常にハードエラーです。

厳格コンパイルモードでは、欠けたローカライズ include も同様にエラーになります。MegaloEdit は常に寛容モードを使います — [コンパイラ設定](/ja/language/compiler-settings) を参照。

ファイルが **存在する** 場合、`localized_include` は `include` と同じく読み込み・パースします。このキーワードはコンパイル済みバリアントデータには残らず、コンパイル時にすべて解決されます。

**出荷された HREK スクリプトでは使われていません。** Bungie は代わりにラッパーファイルとプレーンな `include` を使いました（上記参照）。Reach スクリプティングでは、そのラッパーパターンが正式なやり方です。

## ベースファイル

一部のスクリプトは include の代わりに（または併用して）`base` ディレクティブで始まります。

```megalo
base "ctf.mglo"
```

これはソーステキストをマージするのではなく、コンパイル済み親バリアントを継承します。詳しくは [ベースファイル](/ja/language/base-files) を参照。

## インデント

Megalo はブロック要素内のインデントにタブを使います。インデントは見た目用で — パーサーは構造を空白ではなくキーワード（`end`、要素名）で判定します。出荷スクリプトは一貫してタブを使います。

## 関連項目

- [string_table](/ja/language/elements/string-table) — ローカライズ文字列の定義
- [コンパイラ設定](/ja/language/compiler-settings) — MegaloEdit のコンパイルフラグ（`enforceLocalizedIncludes` など）
- [ベースファイル](/ja/language/base-files) — コンパイル済みバリアントからの継承
- [サンプルスクリプト](/ja/language/examples) — 注釈付きの最小スクリプト
- [参照](/ja/language/references#string-table-references) — アクション内の文字列オペランド
