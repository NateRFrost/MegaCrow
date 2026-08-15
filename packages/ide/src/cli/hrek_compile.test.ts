import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileMegaloDirectory } from "./compileDirectory";
import { createNodeFilesystem } from "./nodeFilesystem";

const HREK_MEGALO_DIR =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\HREK\\data\\multiplayer\\megalo";

describe("HREK megalo directory compile", () => {
  it("compiles every Reach stock script in the megalo root", async () => {
    if (!existsSync(HREK_MEGALO_DIR)) {
      return;
    }

    const outputDir = mkdtempSync(path.join(os.tmpdir(), "megacrow-hrek-"));
    try {
      const result = await compileMegaloDirectory({
        sourceDir: HREK_MEGALO_DIR,
        outputDir,
        format: "mglo",
        recursive: false,
        filesystem: createNodeFilesystem(),
      });

      if (result.failures.length > 0) {
        const summary = result.failures
          .slice(0, 20)
          .map(
            (failure) =>
              `${path.relative(HREK_MEGALO_DIR, failure.sourcePath)}: ${failure.error}`
          )
          .join("\n");
        expect.fail(
          `${result.failures.length} compile failure(s):\n${summary}${
            result.failures.length > 20 ? "\n..." : ""
          }`
        );
      }

      expect(result.compiled.length).toBeGreaterThan(0);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
