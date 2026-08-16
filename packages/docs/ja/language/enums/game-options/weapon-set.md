# Weapon Set

[`game_options`](/ja/language/elements/game-options) の `weapon_set` override 用の値構文です。[`weapon_sets.txt`](/ja/language/object-lists#weapon_sets) の名前付きプリセットに従い、マップ上に出現できる武器を制限します。

ManagedMegalo は解決した値を、ゲームバリアントのマップ override オプション上の `m_weapon_set_absolute_index` に格納します。

## センチネル値

これらのトークンは `weapon_sets.txt` のエントリでは **ありません**。予約済みの負のインデックスを使います:

| トークン | インデックス | 効果 |
|----------|-------------:|------|
| `none` | -1 | 武器セットフィルタを適用しない。武器を別経路（ロードアウト、`player_traits`、スクリプトによるスポーン）で制御する場合に使う。 |
| `default` | -2 | **マップのデフォルト** 武器制限を使う。override を書かないとき、標準ゲームタイプはこの値で出荷される。 |
| `random` | -3 | `weapon_sets.txt` からランダムな名前付きプリセットを選ぶ。 |

```megalo
override weapon_set none
override weapon_set default
override weapon_set random
```

## 名前付きプリセット

それ以外の識別子は [`weapon_sets.txt`](/ja/language/object-lists#weapon_sets) のいずれかの行と一致する必要があります。行の順序がプリセットのインデックスです（**0 始まり**; 最初の行 = `0`）。

```megalo
override weapon_set slayer_pro
override weapon_set no_weapons
```

<DocsBlock type="info" title="none vs no_weapons">

`none` は武器セットシステム自体を無効化します。`no_weapons` はセットテーブル経由で武器を積極的に制限する名前付きプリセットです。Infection や Grifball は、実際の武器をトレイト／ロードアウトで定義するため、通常 `none` を使います。

</DocsBlock>

## 関連

- [Vehicle Set](/ja/language/enums/game-options/vehicle-set)
- [ゲームオプション](/ja/language/enums/game-options)
- [オブジェクトリスト — weapon_sets.txt](/ja/language/object-lists#weapon_sets)
