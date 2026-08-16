# Team Scoring Method

[`game_options`](/ja/language/elements/game-options) の `team_scoring_mode` override 用の値構文です。チーム上の複数プレイヤーが得点できるとき、チームスコアをどう合成するかを選びます。

ManagedMegalo はトークンをゲームバリアント上の `e_team_scoring_method`（`set_team_scoring_method`）に対応付けます。

## 値

| 値 | 効果 |
|----|------|
| `sum` | 各チームメンバーの貢献を加算 |
| `minimum` | チーム内で最も低い貢献スコアを使用 |
| `maximum` | チーム内で最も高い貢献スコアを使用 |

```megalo
override team_scoring_mode sum
```

## 関連

- [ゲームオプション](/ja/language/enums/game-options)
- [game_options](/ja/language/elements/game-options)
