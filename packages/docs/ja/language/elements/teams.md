# teams

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">
</AvailabilityCard>

ゲームタイプで利用可能なチームを定義します。

```megalo
teams
	team
		designator defenders
	end
	team
		designator attackers
	end
end
```

各チームは入れ子の `team` … `end` ブロックです。チームのフィールドには次があります。

| フィールド | 用途 |
|-------|---------|
| `name` | チーム名の文字列テーブル記号 |
| `designator` | 役割（`defenders`、`attackers`、`third_party`、…） |
| `model` | プレイヤーモデル（`spartan`、`elite`、または `by_designator`） |
| `color` | RGB の 3 値 |
| `fireteam_count` | ファイアチーム数 |

<DocsBlock type="warning" title="MCC のサポート">
Halo: Reach の Master Chief Collection 版では、チーム名と色の上書きは MCC メニューではサポートされていません。その結果、MCC メニューとゲーム内の Halo: Reach メニューでプレイヤーの所属チームが異なって見える混乱が起き得ます。
</DocsBlock>

`teams` ブロックレベルでの `model by_designator` 行は、全チームの既定モデル規則を設定します。各チームの `designator` がそのモデルを選びます — たとえばチームごとの `model` で上書きしない場合、`defenders` はスパルタン、`attackers` はエリートとしてスポーンします。

HREK の `megalo/3nvasion.txt` より:

```megalo
teams
	model by_designator

	team
		fireteam_count 3
	end

	team
		fireteam_count 3
	end
end
```

対照的に `megalo/slayer_classic.txt` は、ブロックレベルで全チームに 1 つのモデルを設定します。

```megalo
teams
	model spartan
end
```

## ベース派生スクリプト

`teams` は [ベース派生スクリプト](/ja/language/base-files) に現れて、チームモデル、色、デザイネータを再調整できます。
