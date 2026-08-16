# Vehicle Set

[`game_options`](/ja/language/elements/game-options) の `vehicle_set` override 用の値構文です。[`vehicle_sets.txt`](/ja/language/object-lists#vehicle_sets) の名前付きプリセットに従い、マップ上に出現できる車両を制限します。

ManagedMegalo は解決した値を、ゲームバリアントのマップ override オプション上の `m_vehicle_set_absolute_index` に格納します。

## センチネル値

これらのトークンは `vehicle_sets.txt` のエントリでは **ありません**。予約済みの負のインデックスを使います:

| トークン | インデックス | 効果 |
|----------|-------------:|------|
| `none` | -1 | 車両セットフィルタを適用しない。 |
| `default` | -2 | **マップのデフォルト** 車両制限を使う。override を書かないとき、標準ゲームタイプはこの値で出荷される。 |
| `random` | -3 | `vehicle_sets.txt` からランダムな名前付きプリセットを選ぶ。 |

```megalo
override vehicle_set none
override vehicle_set default
override vehicle_set random
```

## 名前付きプリセット

それ以外の識別子は [`vehicle_sets.txt`](/ja/language/object-lists#vehicle_sets) のいずれかの行と一致する必要があります。行の順序がプリセットのインデックスです（**0 始まり**; 最初の行 = `0`）。

```megalo
override vehicle_set mongoose_only
override vehicle_set no_vehicles
```

<DocsBlock type="info" title="none vs no_vehicles">

`none` は車両セットフィルタを無効化します。`no_vehicles` はセットテーブル経由で車両を除去する名前付きプリセットです。Invasion バリアントはしばしば `no_vehicles` を使います。Grifball は車両がモードに無関係なとき `none` を使うことがあります。

</DocsBlock>

## 関連

- [Weapon Set](/ja/language/enums/game-options/weapon-set)
- [ゲームオプション](/ja/language/enums/game-options)
- [オブジェクトリスト — vehicle_sets.txt](/ja/language/object-lists#vehicle_sets)
