import { existsSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MEGALO_SEG = `${sep}packages${sep}megalo${sep}`;

function resolveExistingFile(base) {
  const asFile = (path) =>
    existsSync(path) && statSync(path).isFile() ? path : null;

  return (
    asFile(base) ||
    asFile(`${base}.ts`) ||
    asFile(`${base}.tsx`) ||
    asFile(`${base}.js`) ||
    asFile(`${base}.mjs`) ||
    asFile(join(base, "index.ts")) ||
    asFile(join(base, "index.tsx")) ||
    asFile(join(base, "index.js"))
  );
}

function megaloSrcRootFromImporter(importerPath) {
  const normalized = importerPath.split(/[/\\]/).join(sep);
  const index = normalized.indexOf(MEGALO_SEG);
  if (index === -1) {
    return null;
  }
  return join(normalized.slice(0, index), "packages", "megalo", "src");
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier !== "src" && !specifier.startsWith("src/")) {
    return nextResolve(specifier, context);
  }

  const parentURL = context.parentURL;
  if (!parentURL) {
    return nextResolve(specifier, context);
  }

  let importerPath;
  try {
    importerPath = fileURLToPath(parentURL);
  } catch {
    return nextResolve(specifier, context);
  }

  const megaloSrc = megaloSrcRootFromImporter(importerPath);
  if (!megaloSrc) {
    return nextResolve(specifier, context);
  }

  const sub = specifier === "src" ? "" : specifier.slice("src/".length);
  const resolved = resolveExistingFile(join(megaloSrc, sub));
  if (!resolved) {
    return nextResolve(specifier, context);
  }

  return {
    shortCircuit: true,
    url: pathToFileURL(resolved).href,
  };
}
