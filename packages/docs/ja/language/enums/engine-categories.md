# エンジンカテゴリ

[`engine_data`](/ja/language/elements/engine-data) の `category` フィールド用の値です。各短縮名はワイヤ上の `e_game_engine_category` インデックスと、ゲームタイプブラウザのローカライズラベルに使う文字列テーブルシンボル `engine_category_<name>` に対応します。

[`engine_data`](/ja/language/elements/engine-data) の `category` で使います。

値は [@blamnetwork/blf](https://github.com/Blam-Network/blf/blob/main/blf-ts/src/blam/haloreach_mcc/v_untracked_25_08_16_1352/game/game_variant.ts) の `e_game_engine_category` と一致します。

## 値

ソースには短縮名を書きます（`category slayer`）。`engine_category_` 接頭辞は **書かないでください** — その接頭辞は文字列テーブルシンボル専用です。

| ソース名 | 文字列シンボル | インデックス | 典型的なラベル |
|----------|----------------|--------------|----------------|
| `ctf` | `engine_category_ctf` | 0 | Capture the Flag |
| `slayer` | `engine_category_slayer` | 1 | Slayer |
| `oddball` | `engine_category_oddball` | 2 | Oddball |
| `koth` | `engine_category_koth` | 3 | King of the Hill |
| `juggernaut` | `engine_category_juggernaut` | 4 | Juggernaut |
| `territories` | `engine_category_territories` | 5 | Territories |
| `assault` | `engine_category_assault` | 6 | Assault |
| `infection` | `engine_category_infection` | 7 | Infection |
| `vip` | `engine_category_vip` | 8 | VIP |
| `invasion` | `engine_category_invasion` | 9 | Invasion |
| `stockpile` | `engine_category_stockpile` | 10 | Stockpile |
| `action_sack` | `engine_category_action_sack` | 11 | Action Sack |
| `race` | `engine_category_race` | 12 | Race |
| `headhunter` | `engine_category_headhunter` | 13 | Headhunter |
| `wip` | `engine_category_wip` | 14 | WIP |
| `dogfight` | `engine_category_dogfight` | 15 | Dogfight |
| `insane` | `engine_category_insane` | 16 | Insane |
| `bungie` | `engine_category_bungie` | 17 | Bungie |
| `ms343` | `engine_category_ms343` | 18 | 343 Industries |
| `heroic` | `engine_category_heroic` | 19 | Heroic |
| `legendary` | `engine_category_legendary` | 20 | Legendary |
| `mythic` | `engine_category_mythic` | 21 | Mythic |
| `mantis` | `engine_category_mantis` | 22 | mantis |
| `shishka` | `engine_category_shishka` | 23 | Shishka |
| `huevos` | `engine_category_huevos` | 24 | Huevos |
| `jonnyo` | `engine_category_jonnyo` | 25 | JonnyOThan |
| `dangerboy` | `engine_category_dangerboy` | 26 | Danger Boy |
| `holiday` | `engine_category_holiday` | 27 | Holiday |
| `community` | `engine_category_community` | 28 | Community |
| `matchmaking` | `engine_category_matchmaking` | 29 | Matchmaking |
| `pre_game_warm_up` | `engine_category_pre_game_warm_up` | 30 | Pre-Game |

## 注意

`category` は特殊です: パーサは **接頭辞付き** 文字列シンボル（`engine_category_` + 書いたトークン）を検索し、その短縮名を上表の enum インデックスに下げます。ラベルは通常、`strings/engine_category_strings.txt` のような共有 include で定義されます。

```megalo
string_table english
	engine_category_slayer "Slayer"
	engine_category_vip "VIP"
end

engine_data
	name slayer_title
	description slayer_description
	icon k_engine_icon_slayer
	category slayer
end
```

## 関連

- [engine_data](/ja/language/elements/engine-data)
- [string_table](/ja/language/elements/string-table)
