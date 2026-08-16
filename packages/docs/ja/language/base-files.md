# ベースファイル

一部の Megalo スクリプトは、`base` ディレクティブでコンパイル済みの親バリアントから継承します。これが Bungie の **バリアントファミリー** の作り方です — 1 本の完全なゲームタイプスクリプトがベースになり、短い派生スクリプトがメタデータ、チーム、オプションだけを再調整します。

## 構文

派生スクリプトは、コンパイル済み `.mglo` ファイルを指す 1 行の `base` で始まります。

```megalo
base "ctf.mglo"
```

`.mglo` 拡張子はコンパイル済み Megalo バリアントを指し、ソースの `.txt` ではありません。エディタはコンパイル時にベースを解決し、派生スクリプトの要素を上にマージします。

ベースファイルはコンパイルの **出力フォルダ** — MegaloEdit.exe では `maps/megalo` — から読みます。参照する派生バリアントをビルドする前に、親スクリプトをコンパイルして `.mglo` を用意してください。

<DocsBlock type="warning" title="同じ megalo バージョン">

派生スクリプトとそのベース `.mglo` は **同じ megalo エンコーディングバージョン** を対象にしなければなりません。ビルドの混在（たとえば TU1 のベースと MCC 専用の派生、または異なる [Megalo バージョン](/ja/versions/) のベース）はサポートされません — ベースと派生を同じ Reach ビルド向けにコンパイルしてください。

</DocsBlock>

## 何が継承されるか

ベースファイルは **コンパイル済みスクリプト全体** を派生バリアントに寄与します。

- すべてのトリガー、条件、アクション
- すべての変数宣言と初期値
- HUD ウィジェット、マップオブジェクトフィルタ、統計
- ロードアウト定義とリクジションパレット

派生スクリプトはトップレベル要素の **制限された部分集合** だけを再指定します。派生ファイルで宣言できるもの:

| 要素 | 用途 |
|---------|---------|
| `engine_data` | ゲームタイプ名、説明、アイコン、カテゴリの上書き |
| `teams` | チームモデル、色、デザイネータの再調整 |
| `game_options` | 組み込みオプションの上書き、カスタムオプションの追加／ロック |
| `constants` | 定数の追加または置換 |
| `string_table` / `include` | ローカライズ文字列の追加 |
| `loadout` / `loadout_palette` | ロードアウト定義の上書き |
| `map_permissions` | Forge 配置ルールの変更 |
| `player_rating` | レーティングパラメータの上書き |

派生ファイルでは次を **追加できません**:

- `variables`
- `trigger`
- `hud_widgets`
- `map_object`
- `requisition_palette`
- `game_stats`

ゲームロジックを変えるには、ベーススクリプトを編集するか、`base` 行なしの完全な新規スクリプトを作ってください。

## オプションの再調整

派生スクリプトは同じ `game_options` 要素で継承したゲームオプションを上書きします。

```megalo
base "headhunter.mglo"

engine_data
	name team_headhunter_title
end

game_options
	override teams_enabled 1
	override score_to_win_round 50
end
```

派生スクリプトでよくあるパターン:

- **`override`** — 組み込みエンジンオプションを新しいデフォルトに設定
- **`lock override`** — デフォルトを設定し、ロビーからの変更を禁止
- **`option "Name" value`** — カスタムオプションを新しいデフォルトで再宣言（一部の派生で使われる短縮形）

## 実例

Bungie は多くのバリアントファミリーを出荷しました。各ベース `.mglo` に複数の派生 `.txt` があります。

| ベース | 派生バリアント |
|------|-----------------|
| `ctf.mglo` | `ctf_1flag.txt`、`ctf_multiteam.txt`、`ctf_neutralflag.txt` |
| `headhunter.mglo` | `headhunter_team.txt`、`headhunter_pro.txt`、`headhunter_pro_team.txt` |
| `assault.mglo` | `assault_one_bomb.txt`、`assault_neutral_bomb.txt`、`grifball.txt` |
| `koth.mglo` | `koth_team.txt`、`koth_pro.txt`、`koth_crazyking.txt` |
| `infection.mglo` | `infection_safehavens.txt`、`infection_newhavens.txt` |
| `slayer.mglo` | `slayer_team.txt`、`slayer_pro.txt`、`slayer_classic.txt`、`SWAT.txt` |

典型的な派生スクリプトは非常に短いです。

```megalo
base "ctf.mglo"
include "strings/ctf_strings.txt"

engine_data
	name ctf_1flag_title
end

game_options
	lock override teams_enabled true
	override round_count 4
	override score_to_win_round 1
end
```

## base と include

これらは異なる 2 つの合成メカニズムです。

| | `base "x.mglo"` | `include "x.txt"` |
|--|-----------------|-------------------|
| **マージするもの** | コンパイル済みバリアント（バイナリ） | ソーステキスト |
| **ロジックを継承** | はい — トリガー、変数、すべて | インクルードされた要素だけ |
| **トリガーを追加できる** | いいえ | はい |
| **典型的な用途** | バリアントファミリー（CTF から 1-Flag CTF） | 共有文字列、ロードアウト、共通ロジック |

両方を使うこともできます — 派生スクリプトがコンパイル済み親を `base` し、追加の文字列テーブルやヘルパーロジックを `include` する、など。

## 関連項目

- [構文とファイル形式](/ja/language/syntax) — include、ファイル構造、[要素モデル](/ja/language/syntax#the-element-model)
- [サンプルスクリプト](/ja/language/examples) — `base` 行なしの完全スクリプト
