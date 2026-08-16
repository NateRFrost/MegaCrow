# 107 (MCC)

現行の Halo: The Master Chief Collection Reach megalo ビルドです。@blamnetwork/megalo のコンパイル／デコンパイルにおけるデフォルト megalo バージョンです。

| | |
|---|---|
| **ゲーム** | <ReachGameIcon /> |
| **Megalo バージョン** | 107 |
| **対応 Halo バージョン** | すべての Halo: Reach MCC ビルド。 |

## 前バージョンからの変更

[107](/ja/versions/107/) との比較。

### 追加されたアクション

- [`begin`](/ja/language/actions/begin) (opcode 99)
- [`hs_function_call`](/ja/language/actions/hs-function-call) (opcode 100)
- [`get_button_time`](/ja/language/actions/get-button-time) (opcode 101)
- [`team_set_vehicle_spawning`](/ja/language/actions/team-set-vehicle-spawning) (opcode 102)
- [`player_set_vehicle_spawning`](/ja/language/actions/player-set-vehicle-spawning) (opcode 103)
- [`set_player_respawn_vehicle`](/ja/language/actions/set-player-respawn-vehicle) (opcode 104)
- [`set_team_respawn_vehicle`](/ja/language/actions/set-team-respawn-vehicle) (opcode 105)
- [`hide_object`](/ja/language/actions/hide-object) (opcode 106)

### 言語の変更

Reach MCC は新しいアクションオペコード以外にも megalo 言語機能を追加します — [ビットシフト算術演算子](/ja/language/enums/math-operations)、一時的な明示参照、survival／firefight フラグなど。blf ドキュメントの [Megalo MCC changes](https://blam-network.github.io/blf/guide/megalo-mcc-changes) を参照してください。

## 制限

<VersionLimits />

アクション単位のページはサイドバーの **Actions** に一覧されています。
