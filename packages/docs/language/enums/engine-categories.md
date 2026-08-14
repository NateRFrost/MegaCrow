# Engine categories

Values for the `category` field in [`engine_data`](/language/elements/engine-data). Each short name maps to a wire `e_game_engine_category` index and to the string-table symbol `engine_category_<name>` used for the localized label in the gametype browser.

Used by [`engine_data`](/language/elements/engine-data) `category`.

Values match `e_game_engine_category` in [@blamnetwork/blf](https://github.com/Blam-Network/blf/blob/main/blf-ts/src/blam/haloreach_mcc/v_untracked_25_08_16_1352/game/game_variant.ts).

## Values

Write the short name in source (`category slayer`). Do **not** write the `engine_category_` prefix — that prefix is only for the string-table symbol.

| Source name | String symbol | Index | Typical label |
|-------------|---------------|-------|---------------|
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

## Notes

`category` is unusual: the parser looks up the **prefixed** string symbol (`engine_category_` + the token you wrote), then lowers that short name to the enum index above. Labels are usually defined in a shared include such as `strings/engine_category_strings.txt`.

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

## See also

- [engine_data](/language/elements/engine-data)
- [string_table](/language/elements/string-table)
