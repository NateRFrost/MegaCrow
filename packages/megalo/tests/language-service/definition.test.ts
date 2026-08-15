import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../../src/language-service/analyze";
import { definitionAtPosition } from "../../src/language-service/definition";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const positionOf = (
  source: string,
  lineStarts: readonly number[],
  needle: string,
  fromIndex = 0
): { line: number; character: number } => {
  const offset = source.indexOf(needle, fromIndex);
  if (offset < 0) {
    throw new Error(`needle not found: ${needle}`);
  }
  let line = 0;
  while (line + 1 < lineStarts.length && lineStarts[line + 1]! <= offset) {
    line += 1;
  }
  return { line, character: offset - lineStarts[line]! };
};

describe("definitionAtPosition", () => {
  it("jumps to a user variable declaration in the same file", async () => {
    const source = `variables global
\tlocal number score 0
end

trigger initialization
\taction set score = 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const position = positionOf(
      source,
      snapshot.lineStarts,
      "score",
      source.indexOf("action set")
    );

    const target = definitionAtPosition(snapshot, position);
    expect(target?.kind).toBe("current");
    if (target?.kind === "current") {
      expect(target.range.start.line).toBe(1);
    }
  });

  it("jumps via a member reference like global.score", async () => {
    const source = `variables global
\tlocal number score 0
end

trigger initialization
\taction set global.score = 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const position = positionOf(
      source,
      snapshot.lineStarts,
      "score",
      source.indexOf("global.score")
    );

    const target = definitionAtPosition(snapshot, position);
    expect(target?.kind).toBe("current");
    if (target?.kind === "current") {
      expect(target.range.start.line).toBe(1);
    }
  });

  it("does not navigate built-in symbols", async () => {
    const source = `variables global
\tlocal number score 0
end

trigger initialization
\taction set global.score = 1
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const position = positionOf(
      source,
      snapshot.lineStarts,
      "global",
      source.indexOf("global.score")
    );

    expect(definitionAtPosition(snapshot, position)).toBeNull();
  });

  it("resolves a declaration that lives in an include", async () => {
    const files = new Map<string, string>([
      [
        "shared.txt",
        `constants
\tnumber shared_flag 1
end
`,
      ],
    ]);
    const source = `include "shared.txt"
constants
\tnumber local_flag shared_flag
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      resolveInclude: (path) => {
        const text = files.get(path);
        return Promise.resolve(text ? { text, uri: path } : null);
      },
    });
    const position = positionOf(
      source,
      snapshot.lineStarts,
      "shared_flag",
      source.indexOf("local_flag")
    );

    const target = definitionAtPosition(snapshot, position);
    expect(target?.kind).toBe("file");
    if (target?.kind === "file") {
      expect(target.file).toBe("shared.txt");
    }
  });
});
