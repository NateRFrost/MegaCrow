#!/usr/bin/env node
/**
 * Compute the MegaCrow build string.
 *
 * Format: {seq}.{yy}.{mm}.{dd}.{hhmm}.{branch}
 * Example: 00042.26.08.15.0534.alpha
 *
 * Seq comes from MEGACROW_SEQ / GITHUB_RUN_NUMBER (CI run number) when set.
 * Otherwise falls back to max matching git tag + 1 (local convenience).
 *
 * Prints JSON: { buildString, packageVersion, showWatermark, seq, branch, stamp }
 *
 * Env:
 *   MEGACROW_BRANCH — override branch name (default: git rev-parse --abbrev-ref HEAD)
 *   MEGACROW_SEQ / GITHUB_RUN_NUMBER — build sequence (GitHub Actions run number)
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

const seqFromEnv = Number.parseInt(
  process.env.MEGACROW_SEQ || process.env.GITHUB_RUN_NUMBER || "",
  10
);

let seq;
if (Number.isFinite(seqFromEnv) && seqFromEnv > 0) {
  seq = seqFromEnv;
} else {
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
    const tagSeq = Number.parseInt(match[1], 10);
    if (Number.isFinite(tagSeq) && tagSeq > maxSeq) {
      maxSeq = tagSeq;
    }
  }
  seq = maxSeq + 1;
}

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
