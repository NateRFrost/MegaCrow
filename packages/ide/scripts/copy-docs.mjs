import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ideRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = resolve(ideRoot, "../docs");
const src = resolve(docsRoot, ".vitepress/dist");
const dest = resolve(ideRoot, "public/docs");

execSync("npm run build", {
  cwd: docsRoot,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DOCS_BASE: "/docs/",
  },
});

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

// Remove prior Tauri packaging path if present.
rmSync(resolve(ideRoot, "public/megalo"), { recursive: true, force: true });

console.log(`Copied docs from ${src} → ${dest}`);
