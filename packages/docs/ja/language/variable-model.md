# 変数モデル

Megalo の変数は、条件とアクションが使う型付きの値を保持します。種類はいくつかあります。自分で宣言するカスタム変数、読み取り専用の組み込みエンジン状態、プレイヤー／チーム／オブジェクトに付くメンバー変数です。

## カスタム変数

カスタム変数はスクリプトのトップレベルにある `variables` ブロックで宣言します。

### 宣言構文

```megalo
variables global
	local number special_death_type 0
end
```

各エントリ行は 4 つの部分からなります（スコープは `variables` 行そのものにあります）。

| 部分 | 値 |
|------|--------|
| **スコープ** | `global`、`player`、`team`、`object` |
| **ネットワーク状態** | `local`、`networked`、`networked_high` |
| **型** | `number`、`timer`、`object`、`team`、`player` |
| **初期値** | 型に合うリテラルまたは定数 |

```megalo
variables global
	local player killing_player none
	local number special_death_type 0
end

variables player
	local number is_leader 0
	networked timer game_start_vo 5
	networked number heard_game_start 0
	networked object body none
end

variables object
	networked timer lifetime 1
end

variables team
	networked object goal none
	networked timer vehicle_refresh 30
end
```

スコープキーワードは `variables` 行そのものに現れます（`variables global`、`variables player` など）。

### 制限

カスタム変数スロット数は各 [megalo バージョンページ](/ja/versions/) の **Limits** にあります — 例: [49](/ja/versions/49/#limits)、[73](/ja/versions/73/#limits)、[107](/ja/versions/107/#limits)、[107 (MCC)](/ja/versions/107-mcc/#limits)。上限を超えるとコンパイルに失敗します。

MCC Reach では、オーバーフローが有効なとき [`temporary`](/ja/language/elements/trigger#action-scope) 変数が未使用グローバルスロットへ溢れ得ます — [107 (MCC) — Limits](/ja/versions/107-mcc/#limits) と [コンパイラ設定](/ja/language/compiler-settings#temporary-variable-overflow) を参照。

### 型

| 型 | 保持するもの | 初期値の例 |
|------|-------|----------------------|
| `number` | 整数 | `0`、`25`、`k_hidden_slayer` |
| `timer` | カウントダウンタイマー | `5`、`flag_return_time` |
| `object` | マップオブジェクト参照 | `none` |
| `team` | チーム参照 | `none`、`attackers` |
| `player` | プレイヤー参照 | `none` |

Megalo は型安全です。変数の宣言型は引数として使われるときに検査され、不一致はコンパイル時エラーになります。

### ネットワーク状態

| 状態 | 挙動 |
|-------|----------|
| `local` | ネットワークで同期されない。誤用防止のため、毎ティック開始時に初期値へリセットされる。 |
| `networked` | 全マシン間で同期される。帯域コストがある。 |
| `networked_high` | より高い優先度で同期される。 |

タイマーは常にネットワーク同期です — `local timer` の宣言はコンパイル時エラーです。

### スコープ

各スコープは、その種類のインスタンスごとに変数のコピーを持ちます。

| スコープ | コピー単位 | アクセス例 |
|-------|---------------|--------------|
| `global` | マッチ | `my_counter` |
| `player` | プレイヤー | `current_player.is_leader` |
| `team` | チーム | `current_team.goal` |
| `object` | オブジェクト | `current_object.lifetime` |

## メンバー変数

オブジェクトスコープの変数（および組み込みプロパティ）はドット記法でアクセスします。

```megalo
action set current_player.score add 1
action set current_player.is_leader set_to 0
action set buy_zone.phase_1_timer set_to haxoring_time_phase_1
```

よく使う組み込みメンバー変数（`variables` ブロックでは宣言しない）:

| メンバー | 対象 | 型 | 説明 |
|--------|----|------|-------------|
| `.score` | player | number | プレイヤーの現在スコア |
| `.team` | player, object | team | 所属チーム |
| `.rating` | player | number | Arena レーティング |
| `.body` | player | object | プレイヤーの物理オブジェクト |
| `.user_data` | object | number | Forge のユーザーデータフィールド |

## 定数

定数は `constants` ブロックで宣言する名前付き数値です。実行時に変更できず、変数ストレージコストもかかりません。

```megalo
constants
	number k_special_death_type_none 0
	number k_special_death_type_melee 1
	number k_special_death_type_headshot 5
	number k_cross_map_distance 400
end
```

定数は他の数値と同様、条件とアクションで名前により参照されます。

```megalo
condition if special_death_type equal_to k_special_death_type_headshot
action set_score add headshot_bonus player killing_player
```

## 組み込み変数

Megalo スクリプトは、`variables` ブロックで宣言しない組み込み変数名を通じてエンジン状態を読めます。条件や `set` のオペランドに通常の識別子として現れます。

型とゲームごとの可用性を含む完全な一覧は [組み込み変数](/ja/language/enums/built-in-variables) を参照。

`game_options` ブロックで宣言したゲームオプションも、読み取り可能な定数になります（例: `kill_points`、`hidden_gametype`、`flag_return_time`）。

組み込み変数は `game_options` の `override` で上書きできます。

```megalo
game_options
	override score_to_win_round 25
	override round_count 1
	override round_time_limit 10
end
```

完全な一覧は [組み込み変数](/ja/language/enums/built-in-variables) と [ゲームオプション](/ja/language/enums/game-options) を参照。

## 一時変数

一時変数は [アクションスコープ](/ja/language/elements/trigger#action-scope) — トリガー本体、`for_each` サブブロック、または [`begin`](/ja/language/elements/begin) サブブロック — 内で宣言され、そのスコープの間だけ存在します。

```megalo
trigger player
	condition player_died current_player enemy
	temporary player killer none
	action player_death_get_killing_player current_player killer
	action set killer.score add 1
end
```

構文: `temporary <type> <name> <initial_value>`

有効な型は `number`、`object`、`team`、`player` です。`timer` の一時変数はありません。

一時変数は、永続的な [`variables`](#custom-variables) スロットを宣言せずにゲッターアクションの結果や中間値を格納するのに便利です。各 `temporary` 行は初期値のための内部 `set` をコンパイラが出すため、スクリプトの 1024 アクション上限に対して **アクション 1 つ** としてもカウントされます。

一時プールのサイズとオーバーフロー上限は megalo バージョンに依存します。[バージョンページ](/ja/versions/) の **Limits** を参照 — [107 (MCC)](/ja/versions/107-mcc/#limits) は [アクションスコープ](/ja/language/elements/trigger#action-scope) ごとの専用一時プールを使い、[107](/ja/versions/107/#limits) などの Xbox 360 ビルドは一時変数を直接グローバルにマップします。オーバーフロー挙動は [コンパイラ設定 — 一時変数のオーバーフロー](/ja/language/compiler-settings#temporary-variable-overflow) で制御されます。

## 特殊リテラル

Megalo 全体で現れる 3 つの特殊な組み込み値:

| リテラル | 意味 |
|---------|---------|
| `true` | 真（1 として評価） |
| `false` | 偽（0 として評価） |
| `none` | オブジェクト／プレイヤー／チームの null／空参照 |

```megalo
condition if current_team.flag equal_to none
action set current_player.body = my_body
```

## 関連項目

- [要素 — variables](/ja/language/elements/variables) と [constants](/ja/language/elements/constants)
- [参照](/ja/language/references) — 変数がオペランドとして現れる方法
- [action](/ja/language/elements/trigger/action) — `set` アクションと [数学演算](/ja/language/enums/math-operations)
- [trigger](/ja/language/elements/trigger) — トリガー内の `temporary` 変数
- [Megalo バージョン](/ja/versions/) — エンコーディングバージョンごとのコンパイル時制限
