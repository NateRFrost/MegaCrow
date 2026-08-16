# 開発

リポジトリルートから:

```bash
npm install
npm run validate   # test, typecheck, docs build
```

## スクリプト

| スクリプト | 用途 |
|------------|------|
| `npm run docs:highlight -w @megacrow/docs` | VitePress 用に Megalo セマンティックハイライターをバンドル |
| `npm run dev -w @megacrow/docs` | VitePress 開発サーバー（先に `docs:highlight` を実行） |
| `npm run build -w @megacrow/docs` | 本番用ドキュメントサイト（先に `docs:highlight` を実行） |
| `npm run preview -w @megacrow/docs` | ビルド済みドキュメントのプレビュー |
| `npm test` | ユニットテストを実行（`tests/local/**` を除く） |
| `npm run test:local` | ローカル統合テスト（フィクスチャ、ゲームインストール） |
| `npm run build` | ESM `dist/` と CJS `dist-cjs/` をコンパイル |
| `npm run typecheck` | TypeScript チェック |

## ドキュメントサイト

ユーザーガイド: `packages/docs/` の VitePress（[@blamnetwork/blf](https://blam-network.github.io/blf/) と同じレイアウト）。

バージョンページ、`docs/language/actions/` 配下のアクションページ、およびサイドバー用メタデータ（`docs/.vitepress/language-versions.json`、`language-actions.json`、`action-context-grammar.json`）はリポジトリ内で **手作業で維持** されています。アクション markdown を生成・上書きするスクリプトはありません — それらの `.md` を直接編集してください。

`docs:highlight` は [`.vitepress/megalo-code-html.ts`](../../.vitepress/megalo-code-html.ts) を `@megacrow/megalo` の `analyzeDocumentSync` + `getSemanticTokens` に対して esbuild し、`.vitepress/megalo-highlight.bundle.mjs` を出力します。VitePress の markdown フックがそのバンドルを読み込み、` ```megalo ` フェンスに IDE 級のハイライトを付けます。

Megalo フェンスは解析に十分な完成度である必要があります（文法スケッチは通常の ` ``` ` フェンスに置きます）。ハイライトのために周囲の宣言が必要だが読者には見せたくない場合は、その行末に `; [!code hide]` を付けます — 解析には使われ、描画 HTML からは省略されます。

HREK の ManagedMegalo.dll からアクションオペランド名を更新するには:

```bash
python scripts/extract-action-context-grammar.py
```

CI は `main` へのプッシュ時に VitePress サイトを GitHub Pages へデプロイします。

## ローカル blf のリンク

未公開の `@blamnetwork/blf` ビルドに対して開発する場合:

```bash
npm run link:blf
# ... work ...
npm run unlink:blf
```
