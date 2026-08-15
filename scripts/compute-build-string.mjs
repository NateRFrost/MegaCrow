#!/usr/bin/env node
/**
 * Compute the next MegaCrow build string from git tags.
 *
 * Format: {seq}.{yy}.{mm}.{dd}.{hhmm}.{branch}
 * Example: 36735.13.12.02.1953.alpha
 *
 * Prints JSON: { buildString, packageVersion, showWatermark, seq, branch, stamp }
 *
 * Env:
 *   MEGACROW_BRANCH — override branch name (default: git rev-parse --abbrev-ref HEAD)
 *   MEGACROW_UNTRACKED=1 — force untracked version
 */
import { execSync } from "node:child_process";

const BUILD_TAG_RE = /^(\d+)\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{4})\.(.+)$/;

const pad2 = (n) => String(n).padStart(2, "0");

const sanitizeBranch = (branch) =>
  branch
    .trim()
    .replace(/\//g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "_");

const git = (args) => {
  try {
    return execSync(`git ${args}`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const forceUntracked = process.env.MEGACROW_UNTRACKED === "1";
const branchRaw =
  process.env.MEGACROW_BRANCH ||
  git("rev-parse --abbrev-ref HEAD") ||
  "unknown";

if (forceUntracked || branchRaw === "HEAD") {
  const result = {
    buildString: "untracked version",
    packageVersion: "0.0.1",
    showWatermark: true,
    seq: 0,
    branch: branchRaw,
    stamp: "00.00.00.0000",
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(0);
}

const branch = sanitizeBranch(branchRaw);
const tags = git("tag --list")
  .split(/\r?\n/)
  .map((t) => t.trim())
  .filter(Boolean);

let maxSeq = 0;
for (const tag of tags) {
  const match = BUILD_TAG_RE.exec(tag);
  if (!match) {
    continue;
  }
  const seq = Number.parseInt(match[1], 10);
  if (Number.isFinite(seq) && seq > maxSeq) {
    maxSeq = seq;
  }
}

const seq = maxSeq + 1;
const seqPadded = String(seq).padStart(5, "0");
const now = new Date();
const stamp = `${pad2(now.getUTCFullYear() % 100)}.${pad2(now.getUTCMonth() + 1)}.${pad2(now.getUTCDate())}.${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}`;
const buildString = `${seqPadded}.${stamp}.${branch}`;
const packageVersion = `0.${seq}.0`;
const showWatermark = branchRaw !== "release";

const result = {
  buildString,
  packageVersion,
  showWatermark,
  seq,
  branch,
  stamp,
};
process.stdout.write(`${JSON.stringify(result)}\n`);
