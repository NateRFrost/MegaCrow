/**
 * Extract ## Description sections from this package's language MD into
 * `.vitepress/hover-descriptions.json` for MegaCrow hover/completions.
 *
 * Usage (from MegaCrow root):
 *   npm run extract-hover -w @megacrow/docs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const outFile = path.join(packageRoot, ".vitepress", "hover-descriptions.json");
const docsRoot = process.env.MEGALO_DOCS ?? packageRoot;

const stripMarkdownLinks = (text) =>
  text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();

const extractDescription = (markdown) => {
  const match = markdown.match(
    /##\s+Description\s*\r?\n([\s\S]*?)(?=\r?\n##\s|\r?\n<ActionParameters|\r?\n$)/i
  );
  if (!match) {
    return;
  }
  const body = match[1]
    .replace(/<[^>]+>/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("<"))
    .join(" ")
    .trim();
  if (!body) {
    return;
  }
  return stripMarkdownLinks(body);
};

const collectFromDir = (dir, kind) => {
  const entries = {};
  if (!fs.existsSync(dir)) {
    return entries;
  }
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md") || file === "index.md") {
      continue;
    }
    const slug = file.replace(/\.md$/, "");
    const name = slug.replace(/-/g, "_");
    const markdown = fs.readFileSync(path.join(dir, file), "utf8");
    const description = extractDescription(markdown);
    if (description) {
      entries[name] = { kind, description, slug };
    }
  }
  return entries;
};

const actionsDir = path.join(docsRoot, "language", "actions");
const elementsDir = path.join(docsRoot, "language", "elements");

if (!fs.existsSync(docsRoot)) {
  console.error(`Docs root not found: ${docsRoot}`);
  process.exit(1);
}

const actions = collectFromDir(actionsDir, "action");
const elements = collectFromDir(elementsDir, "element");

const triggerDir = path.join(elementsDir, "trigger");
if (fs.existsSync(triggerDir)) {
  for (const file of fs.readdirSync(triggerDir)) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const slug = file.replace(/\.md$/, "");
    const name = slug.replace(/-/g, "_");
    const markdown = fs.readFileSync(path.join(triggerDir, file), "utf8");
    const description = extractDescription(markdown);
    if (description) {
      elements[name] = {
        kind: "element",
        description,
        slug: `trigger/${slug}`,
      };
    }
  }
}

const payload = {
  generatedFrom: path.resolve(docsRoot),
  generatedAt: new Date().toISOString(),
  actions,
  elements,
  conditions: {},
};

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `Wrote ${Object.keys(actions).length} actions, ${Object.keys(elements).length} elements → ${outFile}`
);
