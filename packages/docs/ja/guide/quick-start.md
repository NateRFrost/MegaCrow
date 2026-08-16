# インストールとクイックスタート

## インストール

```bash
npm install @blamnetwork/megalo
```

`@blamnetwork/blf` と `@craftycodie/cstruct` は依存関係として自動インストールされます。

## Megalo ソースのパース

最小の `engine_data` 要素を AST にパースします。

```ts
import { parse } from "@blamnetwork/megalo";

const source = `engine_data
begin
name "my_gametype"
end
`;

const program = parse(source);
```

エディタ向けのエラー報告には、`parse` の代わりに `tryParse` を使います。例外を投げず、`{ ok: true, program }` または `{ ok: false, message, line, column }` を返します。

## カスタムバリアントのデコンパイル

コンパイル済み `.mglo` ビットストリームを読み、Megalo ソースを出力します。

```ts
import { readFileSync, writeFileSync } from "node:fs";
import {
  decodeCustomVariantMglo,
  decompileCustomVariant,
  emitSource,
} from "@blamnetwork/megalo";

const mglo = new Uint8Array(readFileSync("variant.mglo"));
const variant = decodeCustomVariantMglo(mglo);
const program = decompileCustomVariant(variant);
const source = emitSource(program);

writeFileSync("variant.txt", source, "utf8");
```

次のステップ: [ソースのパース](/ja/guide/parsing)、[コンパイル](/ja/guide/compiling)、または完全な BLF ラウンドトリップについては [ゲームタイプと BLF](/ja/guide/gametypes)。
