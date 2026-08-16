# variables

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

カスタム変数の宣言。`variables` 要素はスコープブロックを開きます。

```megalo
variables global
	local number my_counter 0
end

variables team
	local number team_score 0
end
```

スコープには `global`、`team`、`player`、`object` があります。型、組み込み、使い方は [変数モデル](/ja/language/variable-model) を参照。

<DocsBlock type="tip" title="ビットフィールドのブール">

Megalo に専用のブール型はありません — 真偽値は `number` です（`0` = 偽、非ゼロ = 真）。[変数枠](/ja/language/variable-model#limits) が厳しいとき、一部の作者は複数のオン／オフフラグを **ビットフィールド** として 1 つの `number` 変数に詰めます。各ビットが 1 つのブールを格納します。[ビット演算の数学演算](/ja/language/enums/math-operations)（ビットを立てる `or`、消す `not`）と、各マスク用の名前付き定数を使います。

</DocsBlock>

```megalo
constants
	number k_has_shield 1
	number k_has_speed  2
	number k_has_jump   4
end

variables player
	networked number powerup_flags 0
end

; one variable replaces three separate booleans
action set current_player.powerup_flags or k_has_shield
action set current_player.powerup_flags not k_has_speed
```

条件でビットを読むには、[一時変数](/ja/language/elements/trigger#temporary-variables) にマスクして比較します。

```megalo
temporary number masked 0
action set masked set_to current_player.powerup_flags
action set masked and k_has_jump
condition if masked equal_to k_has_jump
```

## ベース派生スクリプト

`variables` は **完全スクリプト専用** — [ベース派生スクリプト](/ja/language/base-files) では追加できません。

## 関連項目

- [変数モデル](/ja/language/variable-model)
- [constants](/ja/language/elements/constants)
