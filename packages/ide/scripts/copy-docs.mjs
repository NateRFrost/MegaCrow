import { execSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ideRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = resolve(ideRoot, "../docs");
const src = resolve(docsRoot, ".vitepress/dist");
const dest = resolve(ideRoot, "public/docs");

function normalizeBase(value) {
  const raw = (value ?? "/").trim() || "/";
  if (raw.startsWith(".")) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/**
 * VitePress emits `/./assets/...` for `base: './'`. Browsers treat that as
 * origin-absolute (`https://host/assets/...`), which breaks project Pages
 * under `/<repo>/<branch>/docs/`. Rewrite to relative URLs and inject a
 * `<base href>` anchored at the `/docs/` directory of the current URL.
 */
const RELATIVE_BASE_BOOTSTRAP = `<script>(function(){var p=location.pathname,m="/docs/",i=p.indexOf(m),root=i>=0?p.slice(0,i+m.length):(p.endsWith("/")?p:p.replace(/\\/[^/]*$/,"/"));var b=document.createElement("base");b.href=location.origin+root;document.head.prepend(b);})();</script>`;

function walkFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walkFiles(path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

function rewriteDocsForRelativeBase(docsDir) {
  for (const file of walkFiles(docsDir)) {
    if (!file.endsWith(".html")) {
      continue;
    }
    let html = readFileSync(file, "utf8");
    // `/./foo` → `./foo` so URLs resolve against the injected <base>.
    html = html.replaceAll("/./", "./");
    if (!html.includes('location.pathname,m="/docs/"')) {
      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1>${RELATIVE_BASE_BOOTSTRAP}`
      );
    }
    writeFileSync(file, html);
  }
}

const appBase = normalizeBase(process.env.MEGACROW_BASE);
const useRelativeDocsBase = appBase.startsWith(".");
const docsBase = process.env.DOCS_BASE
  ? normalizeBase(process.env.DOCS_BASE)
  : useRelativeDocsBase
    ? "./"
    : `${appBase}docs/`;

execSync("npm run build", {
  cwd: docsRoot,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DOCS_BASE: docsBase,
  },
});

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

if (docsBase.startsWith(".")) {
  rewriteDocsForRelativeBase(dest);
}

// Remove prior Tauri packaging path if present.
rmSync(resolve(ideRoot, "public/megalo"), { recursive: true, force: true });

console.log(
  `Copied docs from ${src} → ${dest} (DOCS_BASE=${docsBase}${
    docsBase.startsWith(".") ? ", relative rewrite applied" : ""
  })`
);
