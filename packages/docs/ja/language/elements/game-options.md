# game_options

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

ロビー向けオプションとエンジン上書き。子要素は組み込みエンジン設定、カスタムロビーオプション、プレイヤー特性プリセットを制御します。

```megalo
game_options
	override score_to_win_round 25
	override teams_enabled true
	override loadout_palette spartan_tier1 slayer_loadouts
end
```

## override

組み込みエンジンオプションを新しいデフォルトに設定します。組み込みオプションは megalo バージョンで変わり得ます — 完全な一覧は [ゲームオプション](/ja/language/enums/game-options) を参照。

```megalo
game_options
	override score_to_win_round 25
	override teams_enabled true
end
```

## lock override

デフォルトを設定し、ロビーからの変更を防ぎます。

```megalo
game_options
	lock override teams_enabled true
end
```

## option

カスタムの離散選択ロビーオプションを宣言します。オプション名の後に名前／説明の文字列記号、デフォルト値、続いて値／ラベルの組が来ます。

```megalo
game_options
	option kill_points
		option_name_kill_points
		option_description_kill_points
		1
		-1 neg_points_1 ""
		0 points_0 ""
		1 points_1 ""
	end
end
```

## ranged_option

最小／最大境界付きの数値ロビーオプションを宣言します。ブロック形または 1 行形を使えます。

```megalo
game_options
	ranged_option float_time
		option_name_float_time
		option_description_float_time
		7
		3
		16
	end

	ranged_option kill_points option_name_kill_points option_description_kill_points 1 -10 10 end
end
```

## lock option と hide option

完全な定義を宣言したままオプションを固定または隠蔽します（Invasion のマップバリアントで多用）。

```megalo
game_options
	lock option phase_2_objective
		option_name_phase_2_objective
		option_description_objective
		k_gametype_territories
		k_gametype_ctf option_ctf ""
	end

	hide option hidden_gametype
		option_hidden_gametype
		""
		0
		0 hidden_slayer ""
		1 hidden_classic ""
	end
end
```

## player_traits

ロビーで選択可能な名前付き特性セットを定義します。[player_traits](/ja/language/elements/game-options/player-traits) を参照。

## weapon_set と vehicle_set

[`weapon_sets.txt`](/ja/language/object-lists#weapon_sets) と [`vehicle_sets.txt`](/ja/language/object-lists#vehicle_sets) のプリセットで武器または車両を制限します。センチネルトークンまたは名前付きプリセットを受け付けます。

```megalo
game_options
	override weapon_set default
	override vehicle_set no_vehicles
end
```

完全なプリセット表は [Weapon Set](/ja/language/enums/game-options/weapon-set) と [Vehicle Set](/ja/language/enums/game-options/vehicle-set) を参照。

## 制限

スクリプトはカスタムロビーオプション（`option` / `ranged_option`）を最大 **16**、プレイヤー特性セットを最大 **16** まで宣言できます。

## ベース派生スクリプト

`game_options` は [ベース派生スクリプト](/ja/language/base-files) に現れて、継承したオプションを上書きできます。[ベースファイル — オプションの再調整](/ja/language/base-files#retuning-options) を参照。

## 関連項目

- [player_traits](/ja/language/elements/game-options/player-traits)
