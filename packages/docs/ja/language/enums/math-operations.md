# 算術演算

数値をその場で変更するアクション用の演算子です。オペランドの順序は常に `<target> <operation> <value>` です（例: `action set my_counter add 1`）。

[`set`](/ja/language/actions/set)、[`set_score`](/ja/language/actions/set-score)、[`player_adjust_money`](/ja/language/actions/player-adjust-money)、[`adjust_grenades`](/ja/language/actions/adjust-grenades)、および [`object_adjust_*`](/ja/language/actions/object-adjust-health) のヘルス／シールド系アクションで使います。

値は [@blamnetwork/blf](https://github.com/Blam-Network/blf/blob/main/blf-ts/src/blam/haloreach_mcc/v_untracked_25_08_16_1352/game/megalogamengine/megalogamengine_actions.ts) の `e_math_operation` と一致します。Reach のスクリプトは演算子を単語で書きます（`add`、`set_to`、`multiply`）。デコンパイラは代入風の記号（`+=`、`=`、`*=`）を出力します。どちらの形式も受け付けます。

| 演算子 | 記号 | 効果 | 追加バージョン |
|--------|------|------|----------------|
| `add` | `+=` | 現在値に加算 | [49](/ja/versions/49/) |
| `subtract` | `-=` | 現在値から減算 | [49](/ja/versions/49/) |
| `multiply` | `*=` | 現在値に乗算 | [49](/ja/versions/49/) |
| `divide` | `/=` | 現在値を除算 | [49](/ja/versions/49/) |
| `set_to` | `=` | 現在値を代入（置き換え） | [49](/ja/versions/49/) |
| `modulo` | `%=` | 除算の余りで置き換え | [49](/ja/versions/49/) |
| `and` | `&=` | オペランドとのビット AND | [49](/ja/versions/49/) |
| `or` | `\|=` | オペランドとのビット OR | [49](/ja/versions/49/) |
| `xor` | `^=` | オペランドとのビット XOR | [73](/ja/versions/73/) |
| `not` | `~=` | ビット NOT マージ（`a not b` → `a &= ~b`） | [73](/ja/versions/73/) |
| `abs` | — | オペランドの絶対値を設定 | [73](/ja/versions/73/) |
| `lshift` | `<<` | 左ビットシフトして代入 | [107 (MCC)](/ja/versions/107-mcc/) |
| `rshift` | `>>` | 右ビットシフトして代入 | [107 (MCC)](/ja/versions/107-mcc/) |

## 注意

Omaha Alpha（ビルド **49**）は演算を 3 ビットで格納するため、上記のうち最初の 8 演算子のみエンコード可能です。Omaha Delta（**73**）はフィールドを 4 ビットに広げ、XOR・NOT・絶対値代入を追加します。Reach MCC（**107 MCC**）はビットシフト演算子を追加します。MCC ビルドでは `abs` の enum インデックスは **12** です（Xbox 360 TU1 ではインデックス **10**）。

@blamnetwork/megalo は単語名と記号の両方を受け付けます。レガシー blf の enum 名（`multiply_by`、`set_to_absolute` など）も、古いスクリプトのパース時には引き続き受け付けます。

## 例

```megalo
action set my_counter set_to 0
action set my_counter add 1
action set temp modulo 5
action set_score add kill_points player killing_player
action object_adjust_shield current_player set_to 100
```
