# Sprinting

[プレイヤートレイト](/ja/language/enums/player-traits) enum の `sprinting` フィールド用の値構文です。トレイトセットでスプリントを有効／無効にします。

ManagedMegalo はトークンをワイヤ上の `m_sprint_setting`（blf では `player-traits-movement-sprint`）に対応付けます。このフィールドは Reach megalo エンコーディングバージョン **49**〜**73**（Omaha Alpha と Omaha Delta）でのみエンコード可能です。Release / TU1 以降のトレイトブロックからは削除されています。

## 値

| 値 | 効果 |
|----|------|
| `off` | スプリント無効 |
| `on` | スプリント有効 |
| `enabled` | スプリント有効 |
| `disabled` | スプリント無効 |

`enabled` / `disabled` と `on` / `off` は同義語として受け付けられます（4 エントリのスプリント設定文字列テーブル）。

```megalo
override base_player_traits
	sprinting disabled
end
```

## 関連

- [プレイヤートレイト](/ja/language/enums/player-traits)
- [player_traits](/ja/language/elements/game-options/player-traits)
