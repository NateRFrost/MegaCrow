import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completeQuotedPath,
  getQuotedPathCompletionQuery,
  splitPathPrefix,
} from "../../src/language-service";
import { MEGALO_VERSIONS } from "../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("quoted path completion", () => {
  it("splits path prefixes on the last slash", () => {
    expect(splitPathPrefix("")).toEqual({ directory: "", namePrefix: "" });
    expect(splitPathPrefix("foo")).toEqual({
      directory: "",
      namePrefix: "foo",
    });
    expect(splitPathPrefix("foo/")).toEqual({
      directory: "foo",
      namePrefix: "",
    });
    expect(splitPathPrefix("foo/bar/ba")).toEqual({
      directory: "foo/bar",
      namePrefix: "ba",
    });
  });

  it("detects include path queries inside quotes", async () => {
    const source = `include "scripts/hel
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = source.indexOf("hel") + 3;
    const query = getQuotedPathCompletionQuery(snapshot, {
      line: 0,
      character,
    });
    expect(query).toEqual({
      kind: "include",
      directory: "scripts",
      namePrefix: "hel",
    });
  });

  it("detects base path queries", async () => {
    const source = `base "
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = source.indexOf('"') + 1;
    const query = getQuotedPathCompletionQuery(snapshot, {
      line: 0,
      character,
    });
    expect(query).toEqual({
      kind: "base",
      directory: "",
      namePrefix: "",
    });
  });

  it("ignores the path after the closing quote", async () => {
    const source = `include "scripts/hello.txt" 
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = source.indexOf('" ') + 2;
    expect(
      getQuotedPathCompletionQuery(snapshot, { line: 0, character })
    ).toBeNull();
  });

  it("formats file and folder completion items", () => {
    const items = completeQuotedPath(
      { kind: "include", directory: "scripts", namePrefix: "h" },
      [
        { name: "helpers", directory: true },
        { name: "hello.txt", directory: false },
        { name: ".hidden", directory: false },
      ]
    );
    expect(items.map((item) => item.label)).toEqual(["helpers/", "hello.txt"]);
    expect(items.every((item) => item.filterText === "h")).toBe(true);
    expect(items.find((item) => item.label === "helpers/")?.insertText).toBe(
      "helpers/"
    );
  });
});
