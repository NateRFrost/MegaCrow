# コンパイル

`MegaloProgram` を Reach のバリアントデータにコンパイルします。

## カスタムバリアント（`.mglo`）

```ts
import { parse, compileCustomVariant, encodeCustomVariantMglo } from "@blamnetwork/megalo";
import { decodeCustomVariantMglo } from "@blamnetwork/megalo";

const program = parse(source);
const base = decodeCustomVariantMglo(existingMgloBytes); // optional template
const variant = compileCustomVariant(program, base);
const mglo = encodeCustomVariantMglo(variant);
```

編集したスクリプトを再コンパイルするときは、元のバリアントを `base` として渡すと、変更していないフィールド（マップ権限、HUD レイアウトなど）が保持されます。

## ゲームバリアント（ゲームタイプ）

```ts
import { parse, compileGameVariant } from "@blamnetwork/megalo";

const program = parse(source);
const variant = compileGameVariant(program, baseGameVariant);
```

ターゲットビルドがデフォルトの MCC レイアウトと異なる場合は、適切な megalo バージョンを使ってください — [Megalo バージョン](/ja/guide/megalo-versions) を参照。

## BLF 出力

`.blf` ファイルへ書き戻すには、[ゲームタイプと BLF](/ja/guide/gametypes) のゲームタイプ用ヘルパー（`compileGametypeForSave`、`patchGvarInBlf`、および関連エクスポート）を使います。
