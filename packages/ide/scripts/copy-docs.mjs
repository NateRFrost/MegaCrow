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
 * VitePress does **not** support `base: './'` — it causes hydration mismatches
 * and a flash-then-404 (https://github.com/vuejs/vitepress/issues/3988).
 *
 * Prefer an absolute docs base:
 * - Explicit `DOCS_BASE`
 * - CI web / Pages artifact (`MEGACROW_BASE` relative): `/<repo>/<branch>/docs/`
 * - Tauri / local default: `/docs/` (app origin root)
 */
function resolveDocsBase(appBase) {
  if (process.env.DOCS_BASE) {
    return normalizeBase(process.env.DOCS_BASE);
  }

  const onActions = process.env.GITHUB_ACTIONS === "true";
  const eventName = process.env.GITHUB_EVENT_NAME ?? "";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const refName = process.env.GITHUB_REF_NAME ?? "";
  const repoName = repository.includes("/")
    ? repository.split("/")[1]
    : repository;

  // Only the GitHub Pages web artifact uses a relative SPA base (`./`). Tauri
  // builds also run on Actions but must keep docs at `/docs/`.
  if (
    onActions &&
    appBase.startsWith(".") &&
    eventName !== "pull_request" &&
    repoName &&
    refName &&
    // Branch / tag names that are safe as a single path segment.
    !refName.includes("/")
  ) {
    return `/${repoName}/${refName}/docs/`;
  }

  if (appBase.startsWith(".")) {
    return "/docs/";
  }

  return `${appBase}docs/`;
}

/**
 * VitePress sometimes emits `/./assets/...` or origin-absolute `/images/...`
 * even with an absolute base. Rewrite those to be base-correct.
 */
function polishDocsHtml(docsDir, docsBase) {
  for (const file of walkFiles(docsDir)) {
    if (!file.endsWith(".html")) {
      continue;
    }
    let html = readFileSync(file, "utf8");
    html = html.replaceAll("/./", "./");
    // Stray root-absolute static assets → under docs base.
    html = html.replace(
      /\b(href|src)="\/((?:assets|images)\/[^"]*|vp-icons\.css)"/g,
      `$1="${docsBase}$2"`
    );
    writeFileSync(file, html);
  }
}

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

const appBase = normalizeBase(process.env.MEGACROW_BASE);
const docsBase = resolveDocsBase(appBase);

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

polishDocsHtml(dest, docsBase);

// Remove prior Tauri packaging path if present.
rmSync(resolve(ideRoot, "public/megalo"), { recursive: true, force: true });

console.log(`Copied docs from ${src} → ${dest} (DOCS_BASE=${docsBase})`);
