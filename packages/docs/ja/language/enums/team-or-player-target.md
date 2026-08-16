# チームまたはプレイヤー対象

特定のプレイヤー、特定のチーム、または全プレイヤーに適用するアクションのオペランド構文です。ManagedMegalo 文法では `<team_or_player_target>` として現れます。ワイヤ上では `s_team_or_player_target` として格納され、2 ビットの種類フィールド `e_action_team_or_player_target`（@blamnetwork/blf）を持ちます。

[`set_score`](/ja/language/actions/set-score)、[`play_sound`](/ja/language/actions/play-sound)、[`hud_post_message`](/ja/language/actions/hud-post-message) で使います。[`submit_incident`](/ja/language/actions/submit-incident) も、`<cause_team_or_player>` と `<effect_team_or_player>` オペランドに同じ基底型を使います。

## 種類キーワード

| キーワード | blf enum | 意味 |
|------------|----------|------|
| `team` | `team` | 特定のチーム — 続けて [チーム参照](/ja/language/references#team-designators) |
| `player` | `player` | 特定のプレイヤー — 続けて [プレイヤー参照](/ja/language/references#reference-types) |
| `everyone` | `all_players` | セッション内の全プレイヤー |

スクリプトでは全プレイヤー種別を `everyone` と書きます。blf の enum 名は `all_players` です。

## 構文

```
team <team_ref>
player <player_ref>
everyone
```

`team` と `player` の種類は、常に続くトークンに参照を含めます。`everyone` は単独で立ちます。

```megalo
action set_score add kill_points player killing_player
action set_score add 1 team attackers
action play_sound everyone ctf
action play_sound team defenders bone_cv_ph1_intro
action hud_post_message everyone none "Round started!"
action submit_incident game_start_slayer everyone everyone
```

## audience オペランドとは別物

いくつかのアクションは **audience** オペランド（`everyone`、`allies`、`enemies`、`player`、`team`、`no_one`）を取り、ナビポイント・境界・プログレスバー・ピックアップ規則を誰が見るかを絞り込みます。キーワードが一部重なっても、型は別物です（`c_player_filter_modifier`）。

| 用途 | オペランド型 | 例となるアクション |
|------|--------------|-------------------|
| スコア、サウンド、HUD メッセージ、インシデント | チームまたはプレイヤー対象 | `set_score`、`play_sound`、`hud_post_message`、`submit_incident` |
| 可視性とピックアップのフィルタ | Audience | `navpoint_set_visible`、`boundary_set_visible`、`set_pickup_filter` |

audience の一覧は [参照 — Audience 参照](/ja/language/references#audience-references) を参照してください。

## 関連オペランド

[`set_loadout`](/ja/language/actions/set-loadout) の文法は同じ `team` / `player` 接頭辞パターンの `<team_or_player>` を使いますが、種類はそれら 2 つだけです（`everyone` なし）。
