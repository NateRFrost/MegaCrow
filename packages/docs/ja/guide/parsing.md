# ソースのパース

Megalo ソースはプレーンテキストで、要素キーワード（`engine_data`、`trigger`、`string_table` など）を使います。パーサーは `MegaloProgram` AST を生成します。

## `parse` と `tryParse`

`parse(source)` は失敗時に `MegaloError` を投げます。`tryParse(source)` は IDE やリンター向けの結果オブジェクトを返します。

```ts
import { tryParse } from "@blamnetwork/megalo";

const result = tryParse(source);
if (!result.ok) {
  console.error(`${result.line}:${result.column} ${result.message}`);
  return;
}

const program = result.program;
```

## インクルード

ソースファイルは `#include "path.txt"` で他のファイルを参照できます。パースまたはコンパイルの前にインクルードを展開してください。

```ts
import { expandMegaloIncludes, parse } from "@blamnetwork/megalo";
import { readFileSync } from "node:fs";

const expanded = expandMegaloIncludes(source, {
  readFile: (path) => readFileSync(path, "utf8"),
  baseDir: "/path/to/project",
});

const program = parse(expanded);
```

コンパイル用ヘルパーに `includes` を渡すと自動展開されます（[コンパイル](/ja/guide/compiling) を参照）。

## 解析ヘルパー

`analyzeMegaloSource(source)` は、エディタが使うパース警告と語彙メタデータ（シンタックスハイライト、予約キーワード）を返します。

関連: [コンパイル](/ja/guide/compiling)、[デコンパイル](/ja/guide/decompiling)。
