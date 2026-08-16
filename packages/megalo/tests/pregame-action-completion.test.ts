import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../src/language-service";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const afterOnLine = (source: string, line: number, needle: string): number => {
  const lineText = source.split(/\n/)[line]!;
  const index = lineText.indexOf(needle);
  if (index < 0) {
    throw new Error(`needle not found: ${needle}`);
  }
  return index + needle.length;
};

describe("pregame action-name completion", () => {
  it("only suggests set / for_each / begin inside trigger pregame", async () => {
    const source = `trigger pregame
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, "action ");
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels.sort()).toEqual(["begin", "for_each", "set"]);
  });

  it("still suggests other actions outside pregame", async () => {
    const source = `trigger general
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 1, "action ");
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("end_round");
    expect(labels).toContain("set");
    expect(labels.length).toBeGreaterThan(3);
  });

  it("filters nested begin body inside pregame", async () => {
    const source = `trigger pregame
\tbegin
\t\taction 
\tend
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 2, "action ");
    const labels = completionsAtPosition(snapshot, {
      line: 2,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("set");
    expect(labels).not.toContain("end_round");
    expect(labels).not.toContain("print_variable");
  });
});
