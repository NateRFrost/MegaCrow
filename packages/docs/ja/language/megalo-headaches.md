# Megalo の頭痛の種

ゲームタイプを書くときに出会うかもしれない、予期しない挙動を起こす Megalo の奇妙な点です。

## 1. 壊れた変数シャドーイング

MegaloEdit は重複名の変数定義を許しますが、一部の変数型は **常に最初の宣言** を参照するため、後続の宣言は静かに参照不能になり、ゲームタイプのスロットを無駄にします。

### 影響あり（最初の宣言が勝つ）

同じ名前を再宣言しても、名前解決では **最初** の宣言が残ります。後続の宣言もスロットは消費しますが、参照解決時には無視されます。

**変数**

| スコープ | 型 |
|-------|--------|
| `variables global` | `timer` のみ |
| `variables player` | `number`、`timer`、`object`、`player`、`team` |
| `variables team` | `number`、`timer`、`object`、`player`、`team` |
| `variables object` | `number`、`timer`、`object`、`player`、`team` |

**名前付き宣言**（同じ append + `FindIndex` パターン）

| 要素 | 名前 |
|---------|--------|
| `map_object` | フィルタ名 |
| `game_options` | `option` / `ranged_option` 名 |
| `game_options` | `player_traits` 受取人名 |
| `game_stats` | 統計名 |
| `hud_widgets` | ウィジェット名 |
| `loadout` | ロードアウト名 |
| `loadout_palette` | パレット名 |
| `requisition_palette` | パレット名 |

```megalo
variables global
	networked timer shared_timer 5
	networked timer shared_timer 99   ; slot taken, but name still means the first
end

variables player
	local number flag 0
	local number flag 1               ; same: first `flag` wins
end

map_object shared_filter
	label "first"
end
map_object shared_filter
	label "second"                    ; slot taken; references resolve to the first
end
```

### 影響なし（最後の宣言が勝つ）

これらは `FindLastIndex` を使うため、同じ名前の後続宣言が名前解決で正しく前のものをシャドーします（両方ともスロットは消費します）。

| スコープ | 型 |
|-------|--------|
| `variables global` | `number`、`object`、`player`、`team` |
| 一時変数 | すべての型（トリガー内の `temporary`） |

```megalo
variables global
	local number counter 0
	local number counter 7            ; references resolve to this one
end
```

文字列は別ケースです。MegaloEdit は同じ言語内の重複文字列名に対してシャドーせず **エラー** にします。

## 2. アクセスできない `target_team`

エンジンは [`target_player`](/ja/language/references#context-references) を所有するチーム用の明示的なチームスロット（ワイヤ上の `ExplicitTeam.TargetTeam`）を公開しています。MegaloEdit のオートコンプリートは `target_team` さえ一覧に出しますが、チームパーサーは HUD のローカルプレイヤー所有チームとして `local_team` だけを受け付け — `target_team`（または古い別名 `hud_target_player_owner_team`）には一致しません。

したがって MegaloEdit では次を書けません。

```megalo
action set some_team set_to target_team
```

この参照は死んだキーワードです。オートコンプリートとバイナリエンコーディングにはあるが、パースにはありません。

## 3. アクセスできない `coop spawning` ナビポイントアイコン

`navpoint_set_icon` の名前テーブルには、文字列が文字どおり **`coop spawning`**（スペース付き）の最終エントリがあります。

MegaloEdit はアイコン名を `read_enumerated_string` で解決し、これは **1 つ** の識別子トークンを消費して各テーブル文字列と比較します。1 トークンでは `"coop spawning"` と等しくなり得ないため、このアイコンは書けません。

```megalo
action navpoint_set_icon marker coop spawning   ; never matches
```
