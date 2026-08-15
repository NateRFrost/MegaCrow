# Development

From the repository root:

```bash
npm install
npm run validate   # test, typecheck, docs build
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run docs:highlight -w @megacrow/docs` | Bundle Megalo semantic highlighter for VitePress |
| `npm run dev -w @megacrow/docs` | VitePress dev server (runs `docs:highlight` first) |
| `npm run build -w @megacrow/docs` | Production docs site (runs `docs:highlight` first) |
| `npm run preview -w @megacrow/docs` | Preview built docs |
| `npm test` | Run unit tests (excludes `tests/local/**`) |
| `npm run test:local` | Local integration tests (fixtures, game installs) |
| `npm run build` | Compile ESM `dist/` and CJS `dist-cjs/` |
| `npm run typecheck` | TypeScript check |

## Docs site

User guide: VitePress in `packages/docs/` (same layout as [@blamnetwork/blf](https://blam-network.github.io/blf/)).

Version pages, action pages under `docs/language/actions/`, and sidebar metadata (`docs/.vitepress/language-versions.json`, `language-actions.json`, `action-context-grammar.json`) are **hand-authored** in the repo. No script generates or overwrites action markdown — edit those `.md` files directly.

`docs:highlight` esbuilds [`.vitepress/megalo-code-html.ts`](../.vitepress/megalo-code-html.ts) against `@megacrow/megalo`’s `analyzeDocumentSync` + `getSemanticTokens` into `.vitepress/megalo-highlight.bundle.mjs`. VitePress’s markdown hook loads that bundle so ` ```megalo ` fences get IDE-class highlighting.

Megalo fences should be complete enough to analyze (grammar sketches belong in plain ` ``` ` fences). When a snippet needs surrounding declarations for correct highlighting but readers should not see them, mark those lines with a trailing `; [!code hide]` — they are still analyzed, then omitted from the rendered HTML.

To refresh action operand names from HREK ManagedMegalo.dll:

```bash
python scripts/extract-action-context-grammar.py
```

CI deploys the VitePress site to GitHub Pages on pushes to `main`.

## Linking local blf

While developing against an unpublished `@blamnetwork/blf` build:

```bash
npm run link:blf
# ... work ...
npm run unlink:blf
```
