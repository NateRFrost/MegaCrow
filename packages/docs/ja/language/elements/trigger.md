# trigger

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

実行の中核となる要素です。各トリガーはイベントハンドラです。エンジンが条件を評価し、すべて通ればトリガーのアクションを実行します。いずれかの条件が失敗すると、現在の評価の実行は **停止** し — 同じトリガー内の後続の条件とアクションはスキップされます。

トリガー数を含むコンパイル時制限は各 [megalo バージョンページ](/ja/versions/) の **Limits** にあります — 例: [49](/ja/versions/49/#limits)、[73](/ja/versions/73/#limits)、[107](/ja/versions/107/#limits)、[107 (MCC)](/ja/versions/107-mcc/#limits)。`trigger` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 構文

```
trigger <kind> [<name>]
	[<conditions and actions>]
end
```

- **kind** — 実行コンテキストを決める（[トリガーの種類](#trigger-kinds) を参照）
- **name** — 任意。スクリプト内で一意。省略すると匿名トリガー。

```megalo
trigger initialization
	; runs once when the variant loads
end

trigger player
	condition player_died current_player enemy
	action set_score add 1 player killing_player
end

trigger bro_spawn_location
	action object_set_invincibility current_object true
end
```

## トリガーの種類

種類は、どの暗黙コンテキスト変数が使えるかと、トリガーの実行頻度を制御します。

| 種類 | コンテキスト変数 | 実行タイミング |
|------|-----------------|-------|
| `general` | （なし） | 毎ティック 1 回、グローバル |
| `player` | `current_player` | プレイヤーごと、毎ティック |
| `random_player` | `current_player` | 毎ティック 1 回、ランダムなプレイヤー |
| `team` | `current_team` | チームごと、毎ティック |
| `object` | `current_object` | オブジェクトごと、毎ティック |
| `initialization` | （なし） | バリアント読み込み時に 1 回 |
| `local_initialization` | （なし） | 読み込み時にマシンごと 1 回 |
| `host_migration` | （なし） | ホスト移行の後 |
| `double_migration` | （なし） | 二重ホスト移行の後 |
| `object_death` | `current_object` | 束縛されたオブジェクトが破壊されたとき |
| `local` | （なし） | ローカル専用スコープ |
| `pregame` | （なし） | ロビー／試合前フェーズ中 |

### オブジェクトフィルタトリガー

トリガーの種類が [`map_object`](/ja/language/elements/map-object) のラベル名のとき、トリガーはマップ上の一致するオブジェクトごとに 1 回実行され、`current_object` がそのオブジェクトに設定されます。

```megalo
map_object invasion_respawn_phase_1
	label "inv_res_p1"
end

trigger invasion_respawn_phase_1
	action set_respawn_filter current_object no_one
	action object_set_invincibility current_object true
end
```

これは、そのラベルまたは型に一致するオブジェクトにフィルタした `object` 種トリガーと等価です。

## アクションスコープ

`trigger` ブロックと `action for_each` サブトリガー内では、本体は **アクションスコープ** です。有効なキーワードは次だけです。

| 要素 | 用途 |
|---------|---------|
| `condition` | 述語。偽ならブロックを停止 |
| `or` | 前後の条件を論理 OR でつなぐ |
| `action` | 命令文 |
| `temporary` | このブロック用の一時変数を宣言 |
| [`begin`](/ja/language/elements/begin) | 明示的なサブブロックを開く（稀） |
| `end` | 現在のスコープまたはサブブロックを閉じる |

```megalo
trigger player
	condition player_died current_player enemy or
	condition if current_player.is_leader equal_to true
	action set_score add 1 player killing_player
end
```

**`or` チェーン** — `or` は `condition` の直後になければならず、さらに別の `condition` が続かなければなりません。`or` の後にアクションや他のキーワードがあるとコンパイルエラーです。

**容量** — スクリプト全体で条件は最大 **512**、アクションは最大 **1024** です。

**`pregame` 内の `temporary`** — `pregame` トリガー内では `temporary` 宣言は許可されません。

**`begin` / `end`** — 明示的なサブブロックは if/elseif 風の分岐を実装します。[begin](/ja/language/elements/begin) を参照。

## 実行モデル

トリガーはスクリプト内で定義された順に、同じティックで実行されます。`player`、`team`、`object` トリガーでは、エンジンが全インスタンスを反復し、インスタンスごとにトリガー本体を 1 回実行します。

トリガー内では、条件とアクションは **上から下** に評価されます。

1. 各 `condition` が順に検査される。
2. 条件が **偽** なら、トリガーは **停止** — この評価では残りの条件とアクションはスキップされる。
3. すべての条件が通る（または条件がない）場合、アクションが順に実行される。

アクションは条件の前にも置けます。アクションの後の条件が失敗してもトリガーは停止します — すでに実行したアクションは取り消されません。

```megalo
trigger player
	action timer_set_rate current_player.game_start_vo 1

	condition if current_player.heard_game_start == 0
	condition timer_expired current_player.game_start_vo

	action submit_incident game_start_slayer player current_player player none
	action set current_player.heard_game_start = 1
end
```

## インターバル

既定ではトリガーは毎ティック実行されます。`interval` 行で実行頻度を制限できます。

```megalo
trigger general
	interval 5
	; runs once every 5 seconds instead of every tick
end
```

## for_each サブトリガー

`action for_each` 文は、ターゲットごとに 1 回走る入れ子のトリガー本体を埋め込みます。

```megalo
action for_each player
	condition if current_player.team equal_to attackers
	action set current_player.fireteam set_to 0
end

action for_each invasion_objective
	condition if current_object.user_data equal_to k_territory_id_main_switch
	action navpoint_set_visible current_object everyone
end
```

| ターゲット | 反復対象 |
|--------|---------------|
| `player` | 全プレイヤー |
| `team` | 全チーム |
| `object` | 全オブジェクト |
| `general` | 1 回実行（反復なし） |
| `<map_object label>` | そのフィルタに一致する全オブジェクト |

`for_each` ブロック内では、偽になる条件はトリガー全体を停止するのではなく、**現在の反復をスキップ** します（C の `continue` のような挙動）。

```megalo
action for_each invasion_objective
	temporary object buy_zone current_object

	action for_each player
		condition object_in_area current_player current_object
		action set total_in_area add 1
	end
end
```

## 一時変数

一時変数はトリガーの先頭、または `for_each` や `begin` ブロック内で宣言できます。

```megalo
trigger player
	temporary number temp 0
	temporary object my_body current_player

	condition player_died current_player enemy
	temporary player killer none
	action player_death_get_killing_player current_player killer
end
```

[変数モデル — 一時変数](/ja/language/variable-model#temporary-variables) を参照。

## 特殊なトリガー

- **`initialization`** — ゲームタイプ読み込み時に 1 回実行。プレイ前のセットアップ（目標、タイマー、イントロサウンド）に使う。
- **`host_migration`** — 試合中にホストが変わった後に実行。移行で失われた状態の復元に使う。
- **`pregame`** — ロビーフェーズ中に実行。許可リストに載った条件とアクションの部分集合だけが有効。`temporary` は不可。

```megalo
trigger initialization
	action play_sound team defenders bone_cv_ph1_intro
	action timer_set_rate buy_zone_timer 1
end

trigger host_migration
	action for_each invasion_gates
		condition if current_object.user_data equal_to buy_zone.user_data
		action delete_object current_object
	end
end
```

## 関連項目

- [condition](/ja/language/elements/trigger/condition) — 条件の構文と演算子
- [action](/ja/language/elements/trigger/action) — アクションの構文と系統
- [begin](/ja/language/elements/begin) — 明示的なサブブロック
- [サンプルスクリプト](/ja/language/examples) — 注釈付きトリガーのウォークスルー
