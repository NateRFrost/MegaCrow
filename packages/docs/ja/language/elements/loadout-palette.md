# loadout_palette

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

[`loadout`](/ja/language/elements/loadout) 定義を選択可能なパレットプリセットにまとめます。`game_options` 経由で割り当てると、パレットはリスポーン時のロードアウト選択メニューとして現れます。

![Loadout selection menu in Reach multiplayer — a palette of five loadouts (Sprint, Armor Lock, Jet Pack, Active Camo, Hologram)](/images/language/loadout-palette.png)

*ゲーム内のパレット UI。`loadout_palette` ブロック内の各 `item` 行が選択可能な 1 行になります。*

```megalo
loadout_palette slayer_loadouts
	item loadout_scout
	item loadout_guard
end
```

各 `item` 行はスクリプトの他の場所で宣言されたロードアウト名を参照します。パレットは `override loadout_palette spartan_tier1 slayer_loadouts` のような `game_options` の override で割り当てます。

スクリプトは最大 **16** のロードアウトパレットを宣言できます。

## ベース派生スクリプト

`loadout_palette` は [ベース派生スクリプト](/ja/language/base-files) に現れられます。

## 関連項目

- [loadout](/ja/language/elements/loadout)
- [game_options](/ja/language/elements/game-options)
