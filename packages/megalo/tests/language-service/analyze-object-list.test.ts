import { describe, expect, it } from "vitest";
import { SourceLocationType } from "../../src/diagnostics";
import {
  analyzeObjectListSource,
  objectListEntryCount,
} from "../../src/language-service/analyze-object-list";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("objectListEntryCount", () => {
  it("counts lines including blanks; ignores trailing newline", () => {
    expect(objectListEntryCount("")).toBe(0);
    expect(objectListEntryCount("a\nb\n")).toBe(2);
    expect(objectListEntryCount("a\n\nb")).toBe(3);
    expect(objectListEntryCount("a\nb")).toBe(2);
  });
});

describe("analyzeObjectListSource", () => {
  it("accepts lists within the objectsUsed limit", () => {
    const source = Array.from({ length: 2048 }, (_, i) => `obj_${i}`).join(
      "\n"
    );
    expect(analyzeObjectListSource(source, { version })).toEqual([]);
  });

  it("errors on contents past the objectsUsed limit", () => {
    const source = Array.from({ length: 2050 }, (_, i) => `obj_${i}`).join(
      "\n"
    );
    const diagnostics = analyzeObjectListSource(source, { version });
    expect(diagnostics).toHaveLength(1);
    const d = diagnostics[0]!;
    expect(d.message).toContain("2050");
    expect(d.message).toContain("2048");
    expect(d.location.type).toBe(SourceLocationType.SOURCE_CODE);
    if (d.location.type === SourceLocationType.SOURCE_CODE) {
      expect(d.location.start.line).toBe(2049);
      expect(d.location.end.line).toBe(2050);
    }
  });

  it("errors on duplicate names (first wins for lookup)", () => {
    const source = [
      "frag_grenade",
      "plasma_grenade",
      "firebomb_grenade",
      "firebomb_grenade",
    ].join("\n");
    const diagnostics = analyzeObjectListSource(source, { version });
    expect(diagnostics).toHaveLength(1);
    const d = diagnostics[0]!;
    expect(d.message).toContain("firebomb_grenade");
    expect(d.message).toContain("3");
    expect(d.message).toContain("4");
    expect(d.location.type).toBe(SourceLocationType.SOURCE_CODE);
    if (d.location.type === SourceLocationType.SOURCE_CODE) {
      expect(d.location.start.line).toBe(4);
    }
  });

  it("allows blank lines between unique names", () => {
    const source = "a\n\nb\n\nc";
    expect(analyzeObjectListSource(source, { version })).toEqual([]);
  });
});
