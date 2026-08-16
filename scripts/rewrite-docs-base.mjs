#!/usr/bin/env node
/**
 * Rewrite a built VitePress `docs/` tree to use an absolute `base`.
 *
 * VitePress does not support `base: './'` — it causes hydration mismatches and
 * a flash-then-404 on nested hosts (e.g. GitHub Pages `/<repo>/<branch>/docs/`).
 *
 * Usage:
 *   node scripts/rewrite-docs-base.mjs --dir path/to/docs --base /MegaCrow/alpha/docs/
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function parseArgs(argv) {
  let dir = "";
  let base = "";
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      dir = argv[++i] ?? "";
    } else if (arg === "--base") {
      base = argv[++i] ?? "";
    }
  }
  if (!(dir && base)) {
    console.error(
      "Usage: node scripts/rewrite-docs-base.mjs --dir <docsDir> --base </repo/branch/docs/>"
    );
    process.exit(1);
  }
  const normalized = base.startsWith("/") ? base : `/${base}`;
  return {
    dir,
    base: normalized.endsWith("/") ? normalized : `${normalized}/`,
  };
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

/** Detect a previously baked VitePress base from site payload / asset URLs. */
function detectOldBase(docsDir) {
  const indexPath = join(docsDir, "index.html");
  let html = "";
  try {
    html = readFileSync(indexPath, "utf8");
  } catch {
    return null;
  }

  const fromJson = html.match(/"base":"(\\.\/[^"]*|\/[^"]*)"/);
  if (fromJson) {
    const raw = fromJson[1].replaceAll("\\/", "/");
    return raw.endsWith("/") ? raw : `${raw}/`;
  }

  const fromHref = html.match(/\b(?:href|src)="(\/[^"]*\/docs\/)assets\//);
  if (fromHref) {
    return fromHref[1];
  }

  return null;
}

function rewriteContents(text, oldBase, newBase) {
  if (oldBase === newBase) {
    return text;
  }

  let next = text.split(oldBase).join(newBase);

  // JSON / JS string escape form: \/MegaCrow\/alpha\/docs\/
  const oldEscaped = oldBase.replaceAll("/", "\\/");
  const newEscaped = newBase.replaceAll("/", "\\/");
  if (oldEscaped !== oldBase) {
    next = next.split(oldEscaped).join(newEscaped);
  }

  // Any other /<repo>/<segment>/docs/ → newBase (release root remap).
  const wildcard = oldBase.match(/^\/([^/]+)\/[^/]+\/docs\/$/);
  if (wildcard) {
    const repo = wildcard[1];
    const re = new RegExp(`/${repo}/[^/"'\\s]+/docs/`, "g");
    next = next.replace(re, newBase);
    const reEsc = new RegExp(
      `\\\\/${repo}\\\\/[^\\\\/"'\\s]+\\\\/docs\\\\/`,
      "g"
    );
    next = next.replace(reEsc, newBase.replaceAll("/", "\\/"));
  }

  return next;
}

function main() {
  const { dir, base: newBase } = parseArgs(process.argv);
  const oldBase = detectOldBase(dir) ?? "./";

  let changedFiles = 0;
  for (const file of walkFiles(dir)) {
    if (
      !(
        file.endsWith(".html") ||
        file.endsWith(".js") ||
        file.endsWith(".json") ||
        file.endsWith(".css")
      )
    ) {
      continue;
    }
    const before = readFileSync(file, "utf8");
    const after = rewriteContents(before, oldBase, newBase);
    if (after !== before) {
      writeFileSync(file, after);
      changedFiles++;
    }
  }

  console.log(
    `rewrite-docs-base: ${oldBase} → ${newBase} (${changedFiles} files updated in ${dir})`
  );
}

main();
