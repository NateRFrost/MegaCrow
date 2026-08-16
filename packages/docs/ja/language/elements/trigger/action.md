# action

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

**アクション** は、ゲーム状態を変えるトリガー内の命令文です。トリガー内の先行する条件がすべて通ったあと、上から下の順に実行されます。

## 構文

```
action <name> [arg1] [arg2] ...
```

各アクション行はオペコード名の後にオペランドが続きます。オペランドはアクションに応じて変数、定数、参照、リテラル、または文字列テーブル記号です。

```megalo
action set my_counter add 1
action set_score add kill_points player killing_player
action hud_post_message everyone "Round started!"
action create_object "warthog" at current_player never_garbage
action submit_incident game_start_slayer player current_player player none
```

オペコードごとの文法、例、ビルド可用性はサイドバーの **[Actions](/ja/language/actions/adjust-grenades)** にあります。各 Reach ビルドに存在するオペコードは [Megalo バージョン](/ja/versions/) を参照。

## 関連項目

- [trigger](/ja/language/elements/trigger) — アクションが実行されるタイミング
- [condition](/ja/language/elements/trigger/condition) — アクションをゲートする条件
- [参照](/ja/language/references) — オペランドの型
- [変数モデル](/ja/language/variable-model) — `set` の対象
- [オブジェクトリスト](/ja/language/object-lists) — オブジェクト、インシデントなどの記号名
