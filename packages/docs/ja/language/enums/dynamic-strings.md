# 動的文字列

実行時の置換を伴うテキスト表示アクション用のオペランド型です。ManagedMegalo 文法では `<dynamic_string>` として現れます。ワイヤ上では `c_dynamic_string` — 文字列テーブルのインデックスと、最大 2 個の置換可能トークン — として格納されます。

動的文字列は常に [文字列テーブル](/ja/language/elements/string-table) シンボル、または [インラインリテラル](/ja/language/syntax#string-table-symbols-vs-inline-literals) で、続けてそのテキスト内の `%` プレースホルダを埋める参照オペランドを 0〜2 個取ります。

## プレースホルダ

文字列を左から右へ走査し、`%` の直後に既知の文字がある箇所を探します。各マッチは文字列の次のアクションオペランドを消費します。プレースホルダは最大 **2** 個までです。3 個目はコンパイルエラー（`Too many replacement tokens!`）になります。未知の `%X` 列は無視され、オペランドを消費しません。

| 指定子 | オペランド型 | オペランド例 |
|--------|--------------|--------------|
| `%n` | [数値](/ja/language/references#reference-types)（カスタム変数） | `score_to_win_round`、`1`、`global.my_counter` |
| `%p` | [プレイヤー](/ja/language/references#reference-types) | `current_player`、`killing_player` |
| `%t` | [チーム](/ja/language/references#team-designators) | `attackers`、`current_player.team` |
| `%o` | [オブジェクト](/ja/language/references#reference-types) | `current_object`、`global.flag` |
| `%s` | [タイマー](/ja/language/references#reference-types) | `global.round_timer`、`sudden_death_timer` |

`%s` は（C の `printf` とは異なり）**文字列ではありません**。タイマーを挿入します — `%t` が既にチームを意味するため、おそらく「**s**econds」です。エンジンはタイマーの残り時間をそのスロットに整形して入れます。

オペランドの順序は、上表の文字順ではなく、文字列内のプレースホルダの出現順に一致します。

```megalo
action player_set_objective current_player "+%n" score_to_win_round
action hud_post_message everyone none "%p scored!" scoring_player
action navpoint_set_text current_object "%n s" global.countdown
```

実行時、エンジンは各トークンを対応する `%` スロットに置換します（例: `"+%n"` と `score_to_win_round` → `+25`）。

## 永続と一時

一部のアクションは動的文字列を **永続（persistent）** として扱います — トリガー終了後もテキストが有効である必要があります。そうしたアクションは、トークンオペランド内の **一時（transient）** 変数参照を拒否します（`Can't use transient variables when reading a persistent string`）。

| モード | アクション | 一時トークン |
|--------|------------|--------------|
| 永続 | [`hud_widget_set_text`](/ja/language/actions/hud-widget-set-text)、[`hud_widget_set_value`](/ja/language/actions/hud-widget-set-value)、[`navpoint_set_text`](/ja/language/actions/navpoint-set-text)、[`player_set_objective`](/ja/language/actions/player-set-objective)、[`player_set_objective_allegiance`](/ja/language/actions/player-set-objective-allegiance) | 禁止 |
| 一時 | [`hud_post_message`](/ja/language/actions/hud-post-message)、[`print_variable`](/ja/language/actions/print-variable)、[`saved_film_insert_marker`](/ja/language/actions/saved-film-insert-marker) | 許可 |

## 使用箇所

| アクション | 文法 |
|------------|------|
| [`hud_post_message`](/ja/language/actions/hud-post-message) | `<team_or_player_target> <sound> <dynamic_string>` |
| [`print_variable`](/ja/language/actions/print-variable) | `<dynamic_string>` |
| [`hud_widget_set_text`](/ja/language/actions/hud-widget-set-text) | `<hud_widget_name> <dynamic_string>` |
| [`hud_widget_set_value`](/ja/language/actions/hud-widget-set-value) | `<hud_widget_name> <dynamic_string>` |
| [`navpoint_set_text`](/ja/language/actions/navpoint-set-text) | `<object> <dynamic_string>` |
| [`player_set_objective`](/ja/language/actions/player-set-objective) | `<player> <dynamic_string>` |
| [`player_set_objective_allegiance`](/ja/language/actions/player-set-objective-allegiance) | `<player> <dynamic_string>` |
| [`saved_film_insert_marker`](/ja/language/actions/saved-film-insert-marker) | `<offset (s)> <label>` — `<label>` は動的文字列としてパースされる |

## ローカライズ

文字列が文字列テーブルのシンボルの場合、すべての言語翻訳は **同じ** プレースホルダ型を **同じ** 順序で宣言する必要があります。言語間で `%` トークンが不一致だとコンパイルエラーになります。出荷テキストにはインラインリテラルよりシンボルを推奨します — [文字列リテラルの厳格さ](/ja/language/compiler-settings#string-literal-strictness) を参照してください。

## 例

```megalo
string_table english
	obj_score "+%n"
	msg_scored "%p scored!"
end

trigger player_scored
	action player_set_objective current_player obj_score score_to_win_round
	action hud_post_message everyone none msg_scored scoring_player
end
```

## 関連

- [構文 — フォーマットプレースホルダ](/ja/language/syntax#format-placeholders)
- [文字列テーブル](/ja/language/elements/string-table)
- [参照](/ja/language/references)
