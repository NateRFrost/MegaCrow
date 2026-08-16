# map_permissions

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

どの Forge オブジェクトをどのマップに配置できるかを制御します。

```megalo
map_permissions
	default false
	exception k_map_id_boneyard
	exception k_map_id_spire
end
```

| フィールド | 用途 |
|-------|---------|
| `default` | マップが一覧にないときの既定パーミッション |
| `exception` | 許可（または `default` に応じて拒否）されるマップ ID |

## ベース派生スクリプト

`map_permissions` は [ベース派生スクリプト](/ja/language/base-files) に現れて、Forge 配置ルールを変更できます。
