# デコンパイル

コンパイル済みバリアントデータから Megalo ソースを復元します。

<DocsBlock type="warning" title="Lossy decompilation">

デコンパイルは完全なラウンドトリップでは**ありません**。コンパイル済みバイナリは元ソースのすべてを保持しないため、復元されたスクリプトは不完全です。

- **変数名** — スロットは著者が付けた名前ではなく、生成名（例: `global_number_0`、`object_1`）で出力されます。
- **定数** — 名前付き定数はバイナリに保存されないため、デコンパイル結果には空の `constants` プレースホルダーブロックが含まれます。
- **コメント** — 元ファイルの `;` コメントや要素バナーコメントは保持されません（デコンパイラが追加する構造ヘッダーを除く）。

ロジック、トリガー、アクションは復元できますが、出力を正式なソースとして扱う前に、変数のリネームや定数・コメントの再追加が必要になることを想定してください。

</DocsBlock>

## カスタムバリアント

```ts
import {
  decodeCustomVariantMglo,
  decompileCustomVariant,
  emitSource,
} from "@blamnetwork/megalo";

const variant = decodeCustomVariantMglo(mgloBytes);
const program = decompileCustomVariant(variant);
const source = emitSource(program);
```

`emitSource` は、要素、トリガー、文字列テーブル、識別子を Reach ツールが期待するスタイルで整形します。

## ゲームバリアント

```ts
import { decompileGameVariant } from "@blamnetwork/megalo";

const program = decompileGameVariant(gameVariant);
```

## BLF から

まず BLF バッファからゲームタイプデータを抽出し、その後デコンパイルします。

```ts
import { extractGametypeFromBlf, decompileGvarFromBlf } from "@blamnetwork/megalo";

const source = decompileGvarFromBlf(blfBytes);
```

チャンク検出とラウンドトリップのワークフローは [ゲームタイプと BLF](/ja/guide/gametypes) を参照してください。
