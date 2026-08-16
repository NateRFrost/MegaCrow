# Grenade Count

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `initial_grenades` フィールド用の値構文です。[`player_traits`](/ja/language/elements/game-options/player-traits) ブロック内、および [`game_options`](/ja/language/elements/game-options) の `override base_player_traits`（など）で使います。

ManagedMegalo は単一トークン、または個数＋グレネード種別を受け付けます。Reach スクリプトはワイヤ上で **frag** と **plasma** の個数のみを使います（`each` は両方を同数に設定します）。

## 特殊値

| 値 | 効果 |
|----|------|
| `none` | 開始グレネードなし |
| `default` | マップのデフォルトグレネードロードアウトを使用 |

## 個数形式

個数は **1–4** である必要があります。種別は `frag`、`plasma`、または `each` です。

| 構文 | 開始グレネード |
|------|----------------|
| `1 frag` | frag 1 個 |
| `2 frag` | frag 2 個 |
| `3 frag` | frag 3 個 |
| `4 frag` | frag 4 個 |
| `1 plasma` | plasma 1 個 |
| `2 plasma` | plasma 2 個 |
| `3 plasma` | plasma 3 個 |
| `4 plasma` | plasma 4 個 |
| `1 each` | frag 1 個と plasma 1 個 |
| `2 each` | frag 2 個と plasma 2 個 |
| `3 each` | frag 3 個と plasma 3 個 |
| `4 each` | frag 4 個と plasma 4 個 |

不等な frag と plasma の個数を混ぜるには、**別々の行**を使います — 各行がロードアウトの片側を更新します:

```megalo
override base_player_traits
	initial_grenades 1 frag
	initial_grenades 1 plasma
end
```

```megalo
player_traits infected_traits
	initial_grenades none
end
```

[`grenades.txt`](/ja/language/object-lists) のグレネード種別（spike、firebomb など）はここでは無効です。Megalo パーサが受け付けるのは `frag`、`plasma`、`each` のみです。

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
