# ゲームオプション

[`game_options`](/ja/language/elements/game-options) 用の組み込み `override` トークンです。

`game_options` 内の `override` および `lock override` で使います。多くのオプションは条件内の読み取り専用組み込みグローバルとしても現れます — [組み込み変数](/ja/language/enums/built-in-variables) を参照してください。

<EnumVersionTable enum="game-options" />

## 注意

**Type** 列は ManagedMegalo が受け付ける override 値の構文を示します: `integer`、`boolean`、`float`、および名前付き enum（値ページへのリンク付き）。構造化ブロック（`player_traits`、`weapon_set`、`vehicle_set`、`loadout_palette`）は、それぞれの要素またはリストのドキュメントへリンクします。

一部の override は単純なスカラーではなく構造化値を受け付けます — 例: `base_player_traits`、`loadout_palette`、パワーアップオプション上のトレイト参照。宣言構文は [game_options](/ja/language/elements/game-options) を参照してください。

## 関連

- [Weapon Set](/ja/language/enums/game-options/weapon-set) — `weapon_set`
- [Vehicle Set](/ja/language/enums/game-options/vehicle-set) — `vehicle_set`
- [Team Scoring Method](/ja/language/enums/game-options/team-scoring-method) — `team_scoring_mode`
