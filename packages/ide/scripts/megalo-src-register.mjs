/**
 * Resolve Megalo's `src/...` path alias under Node/tsx (mirrors vite megaloSrcAlias).
 * Usage: tsx --import ./scripts/megalo-src-register.mjs src/cli/main.ts
 */
import { register } from "node:module";

register("./megalo-src-resolve.mjs", import.meta.url);
