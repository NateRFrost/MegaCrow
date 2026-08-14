/**
 * Compiles every `.txt` gametype in the HREK megalo root (not nested folders)
 * with MegaCrow and MegaloEdit.exe, then BLF-decodes both `.mglo` files and
 * diffs their JSON.
 *
 * Requires a local HREK install. Skip when MegaloEdit / megalo dir are absent,
 * or force with `HREK_COMPARE=1`.
 *
 * Artifacts: packages/megalo/test-artifacts/hrek-compare/
 *
 * Parity rules (megalo-proto-compile style):
 * - Skip `slayer_bro` (source missing)
 * - Skip scripts MegaloEdit cannot compile (no baseline to compare)
 * - Ignore `m_base_variant.m_metadata`
 * - Decode errors are recorded; they do not abort the corpus loop
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileSource } from "../../../src/compile-source";
import { decodeMglo } from "../../../src/decode-mglo";
import { MEGALO_VERSIONS } from "../../../src/version";
import {
  compileWithMegaloEdit,
  createFsResolvers,
  diffJson,
  ensureArtifactDirs,
  HREK_MEGALO,
  isHrekAvailable,
  type JsonDiff,
  listRootGametypeScripts,
  readTextFile,
  summarizeDiffBuckets,
  toPlainJson,
} from "./helpers";

const FORCE = process.env.HREK_COMPARE === "1";
const available = isHrekAvailable();
const run = FORCE || available;

type ScriptStatus =
  | "ok"
  | "compile_error"
  | "decode_error"
  | "diff"
  | "source_missing"
  | "skipped_megaloedit";

interface ScriptReport {
  decodeError?: string;
  diffCount: number;
  diffs: JsonDiff[];
  fieldBuckets: Record<string, number>;
  megacrowErrors: string[];
  megacrowOk: boolean;
  megaloeditLog: string;
  megaloeditOk: boolean;
  script: string;
  status: ScriptStatus;
}

const formatProtoSummary = (reports: ScriptReport[]): string => {
  const lines: string[] = [];
  const fieldTotals = new Map<string, number>();
  let ok = 0;
  let decodeErrors = 0;
  let diffs = 0;
  let compileErrors = 0;
  let skippedMegaloedit = 0;

  for (const r of reports) {
    if (r.status === "ok") {
      ok++;
      lines.push(`OK  ${r.script}`);
    } else if (r.status === "decode_error") {
      decodeErrors++;
      lines.push(`DEC ${r.script}: ${r.decodeError}`);
    } else if (r.status === "diff") {
      diffs++;
      const buckets = Object.entries(r.fieldBuckets)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${k}(${n})`)
        .join(" ");
      lines.push(`DIFF ${r.script}: ${r.diffCount} ${buckets}`);
      for (const [field, n] of Object.entries(r.fieldBuckets)) {
        fieldTotals.set(field, (fieldTotals.get(field) ?? 0) + n);
      }
    } else if (r.status === "compile_error") {
      compileErrors++;
      lines.push(
        `ERR ${r.script}: ${r.megacrowErrors.slice(0, 2).join("; ") || "compile failed"}`
      );
    } else if (r.status === "skipped_megaloedit") {
      skippedMegaloedit++;
      lines.push(`SKIP ${r.script}: MegaloEdit failed`);
    } else {
      lines.push(`MISS ${r.script}`);
    }
  }

  const header = [
    `Parity summary: ok=${ok} diff=${diffs} decode_error=${decodeErrors} compile_error=${compileErrors} skipped_megaloedit=${skippedMegaloedit} total=${reports.length}`,
    "",
    "Failures by top-level field (diff-path count across scripts):",
    ...[...fieldTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([field, n]) => `  ${field.padEnd(40)} ${n}`),
    "",
    "Per-script:",
  ];

  return [...header, ...lines].join("\n");
};

describe.runIf(run)("HREK root gametype MegaCrow vs MegaloEdit", () => {
  it(
    "compiles every root-folder gametype and reports BLF JSON field diffs",
    async () => {
      expect(available, "HREK MegaloEdit + megalo directory required").toBe(
        true
      );

      const { megacrow, megaloedit, reports } = ensureArtifactDirs();
      const scripts = listRootGametypeScripts();
      expect(scripts.length).toBeGreaterThan(0);

      // Prefer MegaloEdit bases from this run (HREK maps/megalo can be stale/empty
      // for option tables — e.g. shipped koth.mglo has 0 UDOs).
      const { resolveInclude, resolveBaseFile } = createFsResolvers([
        megaloedit,
        megacrow,
      ]);

      const allReports: ScriptReport[] = [];
      const compileFailures: string[] = [];
      const decodeFailures: string[] = [];
      const mismatchSummaries: string[] = [];

      for (const script of scripts) {
        const sourcePath = path.join(HREK_MEGALO, script);
        if (!fs.existsSync(sourcePath)) {
          compileFailures.push(`${script}: source file missing`);
          allReports.push({
            script,
            status: "source_missing",
            megacrowOk: false,
            megaloeditOk: false,
            megacrowErrors: [`source missing: ${sourcePath}`],
            megaloeditLog: "",
            diffCount: 0,
            diffs: [],
            fieldBuckets: {},
          });
          continue;
        }

        const source = readTextFile(sourcePath);
        const baseName = path.basename(script, path.extname(script));

        // MegaloEdit first so bases it writes can optionally seed MegaCrow.
        const editResult = compileWithMegaloEdit(script, megaloedit);
        if (!editResult.ok) {
          // No MegaloEdit baseline → not a MegaCrow parity failure.
          allReports.push({
            script,
            status: "skipped_megaloedit",
            megacrowOk: false,
            megaloeditOk: false,
            megacrowErrors: [],
            megaloeditLog: [editResult.stdout, editResult.stderr]
              .filter(Boolean)
              .join("\n")
              .slice(0, 2000),
            diffCount: 0,
            diffs: [],
            fieldBuckets: {},
          });
          continue;
        }

        const crowResult = await compileSource(source, {
          version: MEGALO_VERSIONS["107-mcc"],
          fromUri: sourcePath,
          resolveInclude,
          resolveBaseFile,
        });
        const crowErrors = crowResult.diagnostics
          .filter((d) => d.severity === 0)
          .map((d) => d.message);
        const crowOk = !!crowResult.bytes && crowErrors.length === 0;
        if (crowOk && crowResult.bytes) {
          fs.writeFileSync(
            path.join(megacrow, `${baseName}.mglo`),
            crowResult.bytes
          );
        } else {
          compileFailures.push(
            `${script}: MegaCrow failed (${crowErrors.slice(0, 3).join("; ")})`
          );
        }

        let diffs: JsonDiff[] = [];
        let decodeError: string | undefined;
        let status: ScriptStatus = "ok";

        if (crowOk && crowResult.bytes) {
          try {
            const crowDecoded = decodeMglo(crowResult.bytes);
            const editBytes = new Uint8Array(
              fs.readFileSync(editResult.outputPath)
            );
            const editDecoded = decodeMglo(editBytes);
            diffs = diffJson(
              toPlainJson(crowDecoded.gametype),
              toPlainJson(editDecoded.gametype)
            );

            if (diffs.length > 0) {
              status = "diff";
              const preview = diffs
                .slice(0, 12)
                .map(
                  (d) =>
                    `  ${d.path}: megacrow=${JSON.stringify(d.megacrow)} megaloedit=${JSON.stringify(d.megaloedit)}`
                )
                .join("\n");
              mismatchSummaries.push(
                `${script}: ${diffs.length} field diff(s)\n${preview}${
                  diffs.length > 12 ? `\n  … +${diffs.length - 12} more` : ""
                }`
              );
            }

            fs.writeFileSync(
              path.join(reports, `${baseName}.diff.json`),
              JSON.stringify(
                {
                  script,
                  diffCount: diffs.length,
                  diffs,
                  fieldBuckets: Object.fromEntries(summarizeDiffBuckets(diffs)),
                },
                null,
                2
              )
            );
          } catch (error) {
            status = "decode_error";
            decodeError =
              error instanceof Error ? error.message : String(error);
            decodeFailures.push(`${script}: ${decodeError}`);
          }
        } else {
          status = "compile_error";
        }

        const fieldBuckets = Object.fromEntries(summarizeDiffBuckets(diffs));
        allReports.push({
          script,
          status,
          megacrowOk: crowOk,
          megaloeditOk: editResult.ok,
          megacrowErrors: crowErrors,
          megaloeditLog: [editResult.stdout, editResult.stderr]
            .filter(Boolean)
            .join("\n")
            .slice(0, 2000),
          decodeError,
          diffCount: diffs.length,
          diffs: diffs.slice(0, 200),
          fieldBuckets,
        });
      }

      const protoSummary = formatProtoSummary(allReports);
      fs.writeFileSync(path.join(reports, "compare-now.txt"), protoSummary);
      fs.writeFileSync(
        path.join(reports, "summary.json"),
        JSON.stringify(
          {
            scriptCount: scripts.length,
            skippedMegaloeditCount: allReports.filter(
              (r) => r.status === "skipped_megaloedit"
            ).length,
            megacrowOkCount: allReports.filter((r) => r.megacrowOk).length,
            megaloeditOkCount: allReports.filter((r) => r.megaloeditOk).length,
            comparedCount: allReports.filter(
              (r) =>
                r.megacrowOk && r.megaloeditOk && r.status !== "decode_error"
            ).length,
            okCount: allReports.filter((r) => r.status === "ok").length,
            decodeErrorCount: allReports.filter(
              (r) => r.status === "decode_error"
            ).length,
            compileFailures,
            decodeFailures,
            mismatchCount: mismatchSummaries.length,
            reports: allReports.map((r) => ({
              script: r.script,
              status: r.status,
              megacrowOk: r.megacrowOk,
              megaloeditOk: r.megaloeditOk,
              diffCount: r.diffCount,
              decodeError: r.decodeError,
              megacrowErrorCount: r.megacrowErrors.length,
              fieldBuckets: r.fieldBuckets,
            })),
          },
          null,
          2
        )
      );

      // Surface mismatches in the vitest failure message.
      const messageParts: string[] = [protoSummary];
      if (compileFailures.length > 0) {
        messageParts.push(
          `Compile failures (${compileFailures.length}):\n${compileFailures.join("\n")}`
        );
      }
      if (decodeFailures.length > 0) {
        messageParts.push(
          `Decode failures (${decodeFailures.length}):\n${decodeFailures.join("\n")}`
        );
      }
      if (mismatchSummaries.length > 0) {
        messageParts.push(
          `JSON field mismatches (${mismatchSummaries.length} scripts):\n${mismatchSummaries.join("\n\n")}`
        );
      }

      expect(
        compileFailures.length +
          decodeFailures.length +
          mismatchSummaries.length,
        messageParts.join("\n\n") || "no issues"
      ).toBe(0);
    },
    30 * 60_000
  );
});
