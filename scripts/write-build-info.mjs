#!/usr/bin/env node
/**
 * Write MegaCrow build-info into packages/megalo/src/build-info.ts and
 * sync Tauri/Cargo package versions.
 *
 * Usage:
 *   node scripts/write-build-info.mjs
 *   node scripts/write-build-info.mjs --untracked
 *   node scripts/write-build-info.mjs --from-json '{"buildString":"...","packageVersion":"0.1.0","showWatermark":true}'
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const parseArgs = () => {
  const args = process.argv.slice(2);
  let untracked = false;
  let fromJson = null;
  let i = 0;
  while (i < args.length) {
    const arg = args[i++];
    if (arg === "--untracked") {
      untracked = true;
    } else if (arg === "--from-json") {
      fromJson = args[i++] ?? null;
    }
  }
  return { untracked, fromJson };
};

const { untracked, fromJson } = parseArgs();

let info;
if (fromJson) {
  info = JSON.parse(fromJson);
} else {
  const env = { ...process.env };
  if (untracked) {
    env.MEGACROW_UNTRACKED = "1";
  }
  const stdout = execFileSync(
    process.execPath,
    [join(root, "scripts/compute-build-string.mjs")],
    { encoding: "utf8", env }
  );
  info = JSON.parse(stdout.trim());
}

const buildString = String(info.buildString ?? "untracked version");
const packageVersion = String(info.packageVersion ?? "0.0.1");
const showWatermark = Boolean(info.showWatermark ?? true);

const buildInfoPath = join(root, "packages/megalo/src/build-info.ts");
const buildInfoSource = `/** MegaCrow app build identity (Bungie-style). Overwritten by CI via scripts/write-build-info.mjs. */
export const MEGACROW_BUILD_STRING = ${JSON.stringify(buildString)};

/** Pre-release watermark; false only for CI builds on the \`release\` branch. */
export const MEGACROW_SHOW_WATERMARK = ${showWatermark ? "true" : "false"};

/** Windows/Tauri-safe package version (\`0.{seq}.0\` or \`0.0.1\` when untracked). */
export const MEGACROW_PACKAGE_VERSION = ${JSON.stringify(packageVersion)};
`;

writeFileSync(buildInfoPath, buildInfoSource, "utf8");

const tauriConfPath = join(root, "packages/ide/src-tauri/tauri.conf.json");
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
tauriConf.version = packageVersion;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`, "utf8");

const cargoPath = join(root, "packages/ide/src-tauri/Cargo.toml");
const cargo = readFileSync(cargoPath, "utf8");
const nextCargo = cargo.replace(
  /^version\s*=\s*"[^"]*"/m,
  `version = "${packageVersion}"`
);
writeFileSync(cargoPath, nextCargo, "utf8");

const idePkgPath = join(root, "packages/ide/package.json");
const idePkg = JSON.parse(readFileSync(idePkgPath, "utf8"));
idePkg.version = packageVersion;
writeFileSync(idePkgPath, `${JSON.stringify(idePkg, null, 2)}\n`, "utf8");

process.stdout.write(
  `Wrote build-info: ${buildString} (package ${packageVersion}, watermark=${showWatermark})\n`
);
