# condition

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

**条件** は、アクションがいつ実行されるかを制御するトリガー内の述語です。条件が偽になると、トリガーは **停止** — その評価では後続の条件とアクションがスキップされます。

条件名は [@blamnetwork/blf](https://github.com/Blam-Network/blf/blob/main/blf-ts/src/blam/haloreach_mcc/v_untracked_25_08_16_1352/game/megalogamengine/megalogamengine_conditions.ts) の `e_condition_type` に一致します（`none` はワイヤ上のセンチネルでソースには書きません）。

<EnumVersionTable enum="condition-types" />

## 構文

```
condition [not] <name> [arg1] [arg2] ... [or]
```

- **`not`** — 結果を否定する任意の接頭辞
- **`name`** — 条件型（例: `if`、`player_died`、`timer_expired`）
- **args** — 条件型に固有のオペランド
- **`or`** — 次の条件と論理 OR でつなぐ任意の接尾辞

```megalo
condition if score_to_win_round != 0
condition if teams_enabled == 1
condition player_died current_player enemy
condition not if current_player.heard_game_start == 0
condition timer_expired current_player.game_start_vo
```

## 比較条件（`if`）

`if` 条件は 2 つの値を比較します。いくつかの演算子綴りをサポートします。

| 演算子 | 別名 |
|----------|-------------|
| `equal_to` | `==` |
| `not equal_to` | `!=` |
| `less_than` | `<` |
| `greater_than` | `>` |
| `less_than_or_equal_to` | `<=` |
| `greater_than_or_equal_to` | `>=` |

```megalo
condition if hidden_gametype equal_to k_hidden_swat
condition if score_to_win_round != 0
condition if round_time_limit > 0
condition if current_player.is_leader equal_to true
condition if shields > 100
condition not if current_player.score == 0
```

比較の両辺は変数、定数、組み込みグローバル、ゲームオプション、またはメンバー変数です。

## イベント条件

イベント条件は値を比較するのではなくゲーム状態を検査します。上の表が全条件型を列挙します。よくある例:

```megalo
condition player_died current_player enemy
condition timer_expired round_timer
condition object_in_area current_player current_object
condition object_out_of_bounds current_team.flag
condition team_is_active current_team
condition object_is_type current_object "area"
```

### player_died のキラータイプ

```megalo
condition player_died current_player environment
condition player_died current_player suicide
condition player_died current_player enemy
condition player_died current_player betrayal
condition player_died current_player quit_game
condition player_died current_player any
condition not player_died current_player enemy
```

## 条件の組み合わせ

### AND（暗黙）

別々の条件行は論理 **AND** として働きます。後続アクションが走るにはすべて真でなければなりません。

```megalo
trigger player
	condition player_died current_player enemy
	condition if current_player.is_leader equal_to true
	action set_score add leader_kill_bonus player killing_player
end
```

### OR

条件行の末尾に `or` を付けて、次の条件と論理 **OR** でつなぎます。

```megalo
trigger general
	condition if hidden_gametype equal_to k_hidden_covy or
	condition if hidden_gametype equal_to k_hidden_swat
	action for_each health_packs
		action delete_object current_object
	end
end
```

複数の `or` 結合条件は数行にまたがれます。

```megalo
condition if current_player.team equal_to attackers or
condition if current_player.team equal_to fourth_party or
condition if current_player.team equal_to third_party
```

結合した OR グループが偽なら、トリガーは停止します。

### NOT

条件の前に `not` を付けて結果を反転します。

```megalo
condition not if current_player.heard_game_start == 0
condition not player_died current_player enemy
condition not if one_flag equal_to none
```

## for_each 内の条件

`action for_each` サブトリガー内では、偽の条件はトリガー全体を停止するのではなく **現在の反復をスキップ** します。これは `continue` 文と等価です。

```megalo
action for_each player
	condition if current_player.team equal_to attackers
	action set current_player.fireteam set_to 0
end
```

攻撃側チームのプレイヤーだけがファイアチームを設定され、他のプレイヤーはスキップされます。

## 条件の配置

条件はトリガー内のどこにでも置けます — アクションの前、間、後。失敗する条件の前に現れたアクションはすでに実行済みです。

```megalo
trigger team
	; this action always runs
	action set_pickup_filter current_team.flag enemies

	temporary player carrier none
	action get_player_holding_object current_team.flag carrier

	; this condition gates what follows
	condition not if carrier equal_to none
	action apply_player_traits carrier flag_carrier_traits
end
```

## 関連項目

- [trigger](/ja/language/elements/trigger) — トリガーの実行モデルと偽での停止
- [action](/ja/language/elements/trigger/action) — 条件に続くアクション
- [変数モデル](/ja/language/variable-model) — 比較のオペランド
- [参照](/ja/language/references) — プレイヤー、チーム、オブジェクトのオペランド
