import { describe, expect, it } from "vitest";
import { isNewerBuild, parseBuildSeq } from "./buildString";

describe("parseBuildSeq", () => {
  it("parses zero-padded seq from a build tag", () => {
    expect(parseBuildSeq("00042.26.08.15.0534.alpha")).toBe(42);
  });

  it("returns null for untracked builds", () => {
    expect(parseBuildSeq("untracked version")).toBeNull();
  });
});

describe("isNewerBuild", () => {
  it("compares seq only", () => {
    expect(
      isNewerBuild("00043.26.08.15.1000.main", "00042.26.08.14.0900.alpha")
    ).toBe(true);
    expect(
      isNewerBuild("00041.26.08.15.1000.main", "00042.26.08.14.0900.alpha")
    ).toBe(false);
  });

  it("returns false when either side is untracked", () => {
    expect(isNewerBuild("00043.26.08.15.1000.main", "untracked version")).toBe(
      false
    );
  });
});
