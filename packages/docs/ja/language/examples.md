# サンプルスクリプト

HREK は、最小で、教える用コメント付きの Megalo スクリプトが入った `simple/` フォルダを同梱しています。このページではそのうち 3 つを一行ずつ説明し、関連する言語概念へリンクします。

既定の HREK インストールでのソース位置:

```
data/multiplayer/megalo/simple/
```

## 1. Slayer — キルごとに 1 点

もっとも単純なスコアリングスクリプト。`simple/slayer/1.txt` より:

```megalo
;this script gives one point for killing an enemy player

;loop over all players
trigger player
	;did this player die from an enemy this tick?
	condition player_died current_player enemy
	;create a temporary variable to store the killer in
	temporary player killer none

	;this gets the player who killed current_player and stores it in killer
	action player_death_get_killing_player current_player killer

	;increase killer's score by 1
	;score is a built-in numeric player member variable
	action set killer.score add 1
end
```

### ウォークスルー

| 行 | 説明 |
|------|-------------|
| `trigger player` | [プレイヤートリガー](/ja/language/elements/trigger#trigger-kinds) — プレイヤーごとに毎ティック 1 回。`current_player` が順に各プレイヤーに設定される。 |
| `condition player_died current_player enemy` | このティックで `current_player` が敵に殺されたかを調べる [条件](/ja/language/elements/trigger/condition)。偽ならトリガーは停止する。 |
| `temporary player killer none` | 型 `player` の [一時変数](/ja/language/variable-model#temporary-variables) を宣言し、`none` で初期化する。 |
| `action player_death_get_killing_player current_player killer` | [ゲッターアクション](/ja/language/elements/trigger/action#getter-actions) — キルしたプレイヤーを `killer` に書き込む。 |
| `action set killer.score add 1` | [set アクション](/ja/language/elements/trigger/action#the-set-action) — キラーの組み込み `.score` メンバー変数に 1 を加算する。 |

このスクリプトに `variables` ブロック、`engine_data`、include はありません。組み込みメンバー変数とコンテキスト参照だけに依存します。

## 2. KOTH — ヒル内の滞在時間でスコア

オブジェクトトリガー、タイマー、入れ子の `for_each` を使う少し豊かなスクリプト。`simple/koth/1.txt` より:

```megalo
; simple version of KOTH - every hill object placed on the map can be scored in

variables player
	networked timer time_in_hill 1
end

;pause all players' timers
trigger player
	action timer_set_rate current_player.time_in_hill 0
end

;find all the hill objects
trigger object
	condition object_is_type current_object "area"
	
	; set up navpoint icon and boundary for the hill object
	action navpoint_set_visible current_object everyone
	action navpoint_set_icon current_object king
	action navpoint_set_priority current_object normal
	action boundary_set_visible current_object true
	
	;unpause timers for players in the hill
	action for_each player
		;note you can use a player reference as an object reference
		;note that we are using the current_object variable from the outer trigger
		condition object_in_area current_player current_object
		action timer_set_rate current_player.time_in_hill 1
		
		;if a guy is in here, let's make the icon blink
		action navpoint_set_priority current_object blink
	end
end

;when players' timers expire, they have spent 1 second in the hill
trigger player
	condition timer_expired current_player.time_in_hill
	action timer_reset current_player.time_in_hill
	action set current_player.score add 1
end
```

### ウォークスルー

**variables ブロック:**

| 行 | 説明 |
|------|-------------|
| `variables player` | [プレイヤー・スコープの変数](/ja/language/variable-model#scopes) を宣言 — プレイヤーごとに自分のコピーを持つ。 |
| `networked timer time_in_hill 1` | 1 秒で初期化された [ネットワーク同期タイマー](/ja/language/variable-model#network-state)。 |

**トリガー 1 — タイマー停止:**

| 行 | 説明 |
|------|-------------|
| `trigger player` | 毎ティック、全プレイヤーに対して実行。 |
| `action timer_set_rate current_player.time_in_hill 0` | 各プレイヤーのヒルタイマーを [一時停止](/ja/language/elements/trigger/action#timer-actions)。レート `0` は停止。 |

**トリガー 2 — ヒルオブジェクト:**

| 行 | 説明 |
|------|-------------|
| `trigger object` | [オブジェクトトリガー](/ja/language/elements/trigger#trigger-kinds) — 全オブジェクトに対して実行し、`current_object` を設定。 |
| `condition object_is_type current_object "area"` | KOTH ヒルオブジェクト（[オブジェクトリスト](/ja/language/object-lists) の型 `"area"`）だけ続行。 |
| ナビポイント系アクション | 全プレイヤー向けにヒルの [ナビポイントと境界](/ja/language/elements/trigger/action#navpoint-actions) を設定。 |
| `action for_each player` | 全プレイヤーを反復する [入れ子サブトリガー](/ja/language/elements/trigger#for_each-sub-triggers)。 |
| `condition object_in_area current_player current_object` | プレイヤーがこのヒル内にいるか。[プレイヤーをオブジェクトとして扱う参照](/ja/language/references#player-as-object-references) を使用。 |
| `action timer_set_rate current_player.time_in_hill 1` | ヒル内のプレイヤーのタイマーを再開。 |
| `action navpoint_set_priority current_object blink` | 占領中はヒルアイコンを点滅。 |

**トリガー 3 — 得点付与:**

| 行 | 説明 |
|------|-------------|
| `condition timer_expired current_player.time_in_hill` | プレイヤーのヒルタイマーが 0（1 秒経過）になったとき発火。 |
| `action timer_reset current_player.time_in_hill` | 次の 1 秒のためにタイマーを再起動。 |
| `action set current_player.score add 1` | 1 点を付与。 |

### 3 つのトリガーの連携

毎ティック:
1. トリガー 1 が全ヒルタイマーを停止する。
2. トリガー 2 がヒルオブジェクトを見つけ、各ヒルについて内部のプレイヤーのタイマーを再開する。
3. トリガー 3 はプレイヤーのタイマーが切れるたび（ヒル内に丸 1 秒いた）に 1 点を付与する。

停止→再開パターンにより、プレイヤーが物理的にヒル内にいる間だけタイマーが減ります。

## 3. CTF — マルチフラッグの Capture the Flag

マップオブジェクト、チーム変数、協調する複数トリガーを持つ、より完成度の高いゲームタイプスクリプト。`simple/ctf/1.txt` より:

```megalo
;simple version of multi-flag CTF

game_options
	override teams_enabled true
	override score_to_win_round 3
		
	player_traits flag_carrier_traits
		"Flag Carrier Traits"
		"Traits applied to players carrying flags"
		speed 75
	end
end

map_object flag_spawn_point
	label "ctf_flag_spawn"
	team each
end

map_object flag_return_point
	label "ctf_flag_return"
	team each
end

variables team
	networked object flag_spawn none
	networked object flag none	
end
```

トリガー要素（要約）:

```megalo
;set up flag spawns (only use one, even if more than one are on the map)
trigger team
	condition if current_team.flag_spawn equal_to none
	
	action for_each flag_spawn_point
		condition if current_object.team equal_to current_team
		action set current_team.flag_spawn set_to current_object
	end
end

;spawn flags
trigger team
	condition team_is_active current_team
	condition if current_team.flag equal_to none
	condition not if current_team.flag_spawn equal_to none
	
	action create_object "flag" at current_team.flag_spawn set current_team.flag never_garbage
	temporary object flag current_team.flag
	action set flag.team set_to current_team
	
	action navpoint_set_icon flag flag
	action navpoint_set_visible flag everyone
end

; did we score?
trigger team
	action for_each flag_return_point
		condition not if current_team.flag equal_to none
		condition if current_object.team equal_to carrier.team
		condition object_in_area carrier current_object
	
		action delete_object current_team.flag
		action set carrier.score add 1
	end
end
```

### 示されている主要概念

| 概念 | 場所 |
|---------|-------|
| [game_options の override](/ja/language/elements/game-options) | `override teams_enabled true` |
| [player_traits](/ja/language/elements/game-options/player-traits) | `speed 75` の `flag_carrier_traits` |
| [map_object ラベル](/ja/language/elements/map-object) | `flag_spawn_point`、`flag_return_point` |
| [チーム・スコープの変数](/ja/language/variable-model#scopes) | `variables team` 上の `flag_spawn`、`flag` |
| [チームトリガー](/ja/language/elements/trigger#trigger-kinds) | 4 つのトリガーすべてが `trigger team` |
| [マップオブジェクトフィルタ付き for_each](/ja/language/elements/trigger#for_each-sub-triggers) | `for_each flag_spawn_point` |
| [create_object](/ja/language/elements/trigger/action#object-actions) | チームのスポーンにフラッグを生成 |
| [ゲッター + スコアリングパターン](/ja/language/elements/trigger/action#getter-actions) | `get_player_holding_object` の後にキャプチャでスコア |

## その他の例

`simple/` フォルダには他のゲームタイプ用の追加スクリプトもあります。

| フォルダ | スクリプト | 概念 |
|--------|---------|----------|
| `simple/slayer/` | 1.txt、2.txt | 基本とチームスコアリング |
| `simple/koth/` | 1.txt – 6.txt | ヒルタイマー、テリトリー、クレイジーキング |
| `simple/ctf/` | 1.txt – 4.txt | フラッグスポーン、キャプチャ、返却、ニュートラルフラッグ |
| `simple/juggernaut/` | 1.txt | ジャガーノートの割り当てと特性 |

本格的な本番スクリプトは、HREK のメイン `megalo/` フォルダ（例: `slayer_gameplay_triggers.txt`、`3nvasion.txt`）を参照。

## 関連項目

- [はじめに](/ja/language/) — 言語の概要
- [trigger](/ja/language/elements/trigger) — トリガーの種類と実行
- [condition](/ja/language/elements/trigger/condition) — 条件の構文
- [action](/ja/language/elements/trigger/action) — アクションの構文
- [変数モデル](/ja/language/variable-model) — 変数宣言
