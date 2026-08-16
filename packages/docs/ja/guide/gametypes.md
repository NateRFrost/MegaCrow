# ゲームタイプと BLF

製品コンテンツ内の Megalo スクリプトは、BLF ファイル内の `gvar`（ゲームバリアント）またはカスタムバリアントチャンクとして格納されています。このパッケージは [@blamnetwork/blf](https://blam-network.github.io/blf/) のチャンク I/O を、Megalo 向けヘルパーでラップします。

## 抽出とデコンパイル

```ts
import { readFileSync } from "node:fs";
import { decompileGvarFromBlf } from "@blamnetwork/megalo";

const blf = new Uint8Array(readFileSync("gametype.blf"));
const source = decompileGvarFromBlf(blf);
```

`extractGametypeFromBlf` と `detectGametypeChunkInBlf` は、デコンパイルせずに下位のバリアントオブジェクトとチャンク種別を公開します。

## カスタムバリアント MGLO のエクスポート

マップバリアント BLF からカスタムバリアントの megalo ビットストリームを取り出します。

```ts
import { exportMgloFromBlf } from "@blamnetwork/megalo";

const mglo = exportMgloFromBlf(blfBytes);
```

## ラウンドトリップとパッチ

| 関数 | 用途 |
|------|------|
| `roundtripGvarSource` | デコンパイル → 再コンパイル → BLF で、更新されたバイト列を返す |
| `roundtripGvarProgram` | 編集した AST を元の BLF に再エンコードする |
| `patchGvarInBlf` | ゲームタイプのスクリプトデータをその場で置換する |
| `compileGvarFromMegaloSource` | ソースをパース＆コンパイルして BLF バッファにする |
| `compileGametypeForSave` | 指定形式のセーブ用 BLF を構築する |

`mergeEditedProgram` は、デコンパイルしたベースプログラムとユーザー編集を結合し、コンパイラコンテキストの一貫性を保ちます。

## 依存関係

BLF チャンク型とバージョンバンドルは `@blamnetwork/blf` から提供されます。タイトルとビルドに合ったインポートパスを選んでください — [blf version guide](https://blam-network.github.io/blf/guide/versions/) を参照。
