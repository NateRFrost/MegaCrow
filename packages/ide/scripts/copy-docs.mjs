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
import { dirname, join, relative, resolve } from "node:path";
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
 * under `/<repo>/<branch>/docs/`.
 *
 * A JS-injected `<base href>` is too late: the preload scanner resolves
 * `./assets/...` against the page URL first, so nested clean URLs request
 * `.../language/elements/assets/...` (404) instead of `.../docs/assets/...`.
 *
 * Fix: rewrite site-root-relative `./` URLs in each HTML file to a
 * depth-correct relative prefix (`../../` from `language/elements/*.html`).
 */
const OLD_BASE_BOOTSTRAP_RE =
  /<script>\(function\(\)\{var p=location\.pathname,m="\/docs\/"[\s\S]*?<\/script>/;

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

/** `language/elements/hud-widgets.html` → `../../`; `index.html` → `./` */
function docsRootPrefix(htmlFile, docsDir) {
  const rel = relative(docsDir, htmlFile).replace(/\\/g, "/");
  const dir = dirname(rel);
  if (dir === ".") {
    return "./";
  }
  const depth = dir.split("/").filter(Boolean).length;
  return "../".repeat(depth);
}

function rewriteDocsForRelativeBase(docsDir) {
  for (const file of walkFiles(docsDir)) {
    if (!file.endsWith(".html")) {
      continue;
    }
    let html = readFileSync(file, "utf8");
    html = html.replace(OLD_BASE_BOOTSTRAP_RE, "");
    // `/./foo` → `./foo` (VitePress relative-base quirk).
    html = html.replaceAll("/./", "./");

    const prefix = docsRootPrefix(file, docsDir);
    if (prefix !== "./") {
      // Site-root-relative URLs from VitePress (`./assets/...`, `./language/...`).
      html = html.replace(/\b(href|src)="\.\//g, `$1="${prefix}`);
    }
    // VitePress sometimes normalizes `./images/...` to origin-absolute `/images/...`.
    html = html.replace(
      /\b(href|src)="\/((?:assets|images)\/[^"]*|vp-icons\.css)"/g,
      `$1="${prefix}$2"`
    );

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
