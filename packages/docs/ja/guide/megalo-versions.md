# Megalo バージョン

MCC 上の Halo: Reach は、Xbox 360 Title Update 1 より新しい megalo スクリプティングビルドを使います。@blamnetwork/megalo はコンパイル／デコンパイル用に 2 つの **Megalo バージョン** をサポートします。より古い Reach ビルドはオペコード参照用にのみ文書化されています。

| Megalo バージョン | ID | 主な用途 |
|-------------------|-----|----------|
| Reach MCC | `mcc` | MCC Reach のゲームタイプとカスタムバリアント（デフォルト） |
| Xbox 360 TU1 | `tu1` | レガシー Xbox 360 Reach コンテンツ |

リテール発売（エンコーディングバージョン **106**）と TU1（**107**）は同じアクションオペコード表を共有します。ビルド固有のバリアントレイアウトのメモは [106 - Halo: Reach Release](/ja/versions/106/) と [107 - Halo: Reach TU 1](/ja/versions/107/) を参照してください。

```ts
import { getMegaloVersion, mccVersion, tu1Version } from "@blamnetwork/megalo";

// getMegaloVersion selects a Megalo version by profile id
const tu1 = getMegaloVersion("tu1");
const program = tu1.decompileGameVariant(variant);
const recompiled = tu1.compileGameVariant(program, variant);
```

`mccVersion` と `tu1Version` は、同じハンドラを名前付きエクスポートとして公開したものです。バージョンページは [Megalo Versions](/ja/versions/) にあり、オペコード単位のリファレンスページはサイドバーの **Actions** に一覧されています。

## MCC と TU1 の違い

MCC には Xbox 360 に存在しない megalo 機能 — [ビットシフト算術演算子](/ja/language/enums/math-operations)、一時的な明示参照、survival／firefight フラグ、追加のアクション型 — があります。MCC 専用機能を使うスクリプトは、変更なしでは TU1 向けにコンパイルできません。

ビルド間の BLF レベル変換には、`@blamnetwork/blf/helpers` の [`convert_reach_gametype`](https://blam-network.github.io/blf/guide/converting-reach-gametypes) を使ってください。

機能レベルの比較は、blf ドキュメントの [Megalo MCC changes](https://blam-network.github.io/blf/guide/megalo-mcc-changes) ページも参照してください。
