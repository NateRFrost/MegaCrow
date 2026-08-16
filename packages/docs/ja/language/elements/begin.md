# begin

<AvailabilityCard reach="partial" halo4="yes" h2a="yes">

`begin` アクションは Halo: Reach の Master Chief Collection 版で追加され、Xbox 360 版の Halo: Reach では利用できません。

</AvailabilityCard>

[アクションスコープ](/ja/language/elements/trigger#action-scope) 内に明示的な **サブブロック** を開きます。コンパイラは `begin` をアクションオペコードへ下げますが、ソース上では `condition`、`action`、`temporary`、`or` と並ぶスコープ要素のように振る舞います。

出荷での主な用途は **if/elseif 風の分岐** です。連続する複数の `begin`/`end` ペアがあり、各ブロックが独自の条件を持ちます。あるブロック内の条件が失敗しても、そのブロックだけが停止し — 次の `begin` ブロックは依然として実行されます。

## Winter Contingency からの例

Reach MCC の `tu1_winter_contingency.txt` は、`action for_each team` 内の `begin` ブロックでラウンドタイムアウト時の勝者判定を書き換えました。各ブロックが異なる凍結プレイヤー数を検査し、引き分け追跡状態を更新します。

```megalo
trigger general
	condition if round_time_limit > 0
	condition timer_expired round_timer

	temporary number least_frozen_players k_maximum_team_size
	temporary team least_frozen_players_team none

	action for_each team
		action set active_teams_count += 1
		condition team_is_active current_team

		begin
			condition if current_team.players_frozen == least_frozen_players
			action set teams_tied = true
		end
		begin
			condition if current_team.players_frozen < least_frozen_players
			action set least_frozen_players = current_team.players_frozen
			action set least_frozen_players_team = current_team
		end
	end
end
```

`begin` がなければ、フラットな条件は **AND** でつながるため — 最初の失敗した比較が残りの反復を止めてしまいます。別ブロックにすると、各分岐が独立に走り、`if` / `else if` のようになります。

HREK の同じトリガーには、コメントとして古い Reach パターンが残っています。単一の `for_each` 本体で、`or` チェーン条件が elseif 分岐として働く形です。MCC は（Halo 4 から移植した）`begin` オペコードを追加し、そのロジックを明示的なサブブロックとして書けるようにしました。

## 構文

`begin` は `action begin` ではなく、単独行で書きます。

```megalo
begin
	[<conditions, actions, temporaries, nested begin/end pairs>]
end
```

合法な内容は他のアクションスコープと同じです。`condition`、`or`、`action`、`temporary`、および入れ子の `begin`/`end` ペア。

## 現れる場所

`begin` ブロックはアクションスコープが有効なところならどこでも有効です。

- [`trigger`](/ja/language/elements/trigger) 本体内
- `action for_each` サブトリガー内
- 別の `begin` ブロック内に入れ子

## 規則

**独立ブロック** — 連続する `begin`/`end` ペアは順に評価されます。ブロック *N* 内の偽条件は、ブロック *N + 1* の実行を妨げません。

**アクション予算** — 各 `begin` 行は、ブロック内のアクションに加えて、スクリプトの 1024 アクション上限に対して **アクション 1 つ** としてカウントされます。

**一時変数** — `begin` ブロック内の [`temporary`](/ja/language/variable-model#temporary-variables) 宣言は、そのブロック（およびその中の入れ子ブロック）にスコープされます。

## 関連項目

- [trigger — アクションスコープ](/ja/language/elements/trigger#action-scope) — トリガー内で有効なキーワード
- [trigger](/ja/language/elements/trigger) — 実行と `for_each`
- [条件 — OR](/ja/language/elements/trigger/condition#or) — `begin` 以前の elseif パターン
- [action](/ja/language/elements/trigger/action) — ブロック内の命令オペコード
- [変数モデル — 一時変数](/ja/language/variable-model#temporary-variables)
