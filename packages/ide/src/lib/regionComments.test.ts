import { describe, expect, it } from "vitest";
import {
  isRegionEndLine,
  isRegionStartLine,
  regionStartPattern,
} from "./regionComments";
import {
  getRegionFoldLineNumbers,
  getStringTableFoldLineNumbers,
} from "./stringTableGroups";

describe("MegaCrow region comment extension", () => {
  it("recognizes ;#region and ;#endregion markers", () => {
    expect(isRegionStartLine(";#region STRINGS")).toBe(true);
    expect(isRegionStartLine("  ;#region OPTIONS")).toBe(true);
    expect(isRegionEndLine(";#endregion")).toBe(true);
    expect(isRegionStartLine(";region TEAMS")).toBe(false);
    expect(isRegionStartLine("  ; region OPTIONS")).toBe(false);
    expect(isRegionEndLine(";endregion")).toBe(false);
    expect(isRegionStartLine(";* TEAMS *")).toBe(false);
  });

  it("finds named region fold lines with # markers only", () => {
    const lines = [
      ";region TEAMS",
      "teams",
      "end",
      ";endregion",
      ";#region STRINGS",
      "string_table english",
      "end",
      ";#endregion",
    ];
    expect(getRegionFoldLineNumbers(lines, "TEAMS")).toEqual([]);
    expect(getRegionFoldLineNumbers(lines, "STRINGS")).toEqual([5]);
    expect(regionStartPattern("STRINGS").test(";#region STRINGS")).toBe(true);
    expect(regionStartPattern("STRINGS").test("; region STRINGS")).toBe(false);
  });

  it("auto-folds STRINGS regions on load", () => {
    const lines = [
      ";#region STRINGS",
      "string_table english",
      '\ttitle "Slayer"',
      "end",
      ";#endregion",
    ];
    expect(getStringTableFoldLineNumbers(lines)).toEqual([1]);
  });
});
