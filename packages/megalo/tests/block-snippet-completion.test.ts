import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../src/language-service";
import { snippetTabstop } from "../src/language-service/completion/helpers";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

const expectBlockSnippet = (
  item: { insertText?: string; insertAsSnippet?: boolean },
  label: string,
  headerSuffix = ""
) => {
  expect(item.insertAsSnippet).toBe(true);
  expect(item.insertText).toBe(`${label}${headerSuffix}\n\t$0\nend`);
};

describe("block-end completion snippets", () => {
  it("wraps trigger execution kinds with end and body tabstop", async () => {
    const source = "trigger ";
    const snapshot = await analyzeDocument(source, { version });
    const item = completionsAtPosition(snapshot, {
      line: 0,
      character: source.length,
    }).find((entry) => entry.label === "pregame");
    expect(item).toBeDefined();
    expectBlockSnippet(item!, "pregame");
  });

  it("wraps top-level block keywords", async () => {
    const source = "";
    const snapshot = await analyzeDocument(source, { version });
    const item = completionsAtPosition(snapshot, {
      line: 0,
      character: 0,
    }).find((entry) => entry.label === "game_options");
    expect(item).toBeDefined();
    expectBlockSnippet(item!, "game_options");
  });

  it("wraps top-level trigger with name placeholder", async () => {
    const source = "";
    const snapshot = await analyzeDocument(source, { version });
    const item = completionsAtPosition(snapshot, {
      line: 0,
      character: 0,
    }).find((entry) => entry.label === "trigger");
    expect(item).toBeDefined();
    expectBlockSnippet(item!, "trigger", snippetTabstop(1, "general"));
  });

  it("continues include directives with a trailing space", async () => {
    const source = "";
    const snapshot = await analyzeDocument(source, { version });
    const item = completionsAtPosition(snapshot, {
      line: 0,
      character: 0,
    }).find((entry) => entry.label === "include");
    expect(item).toBeDefined();
    expect(item!.insertAsSnippet).toBeFalsy();
    expect(item!.insertText).toBe("include ");
    expect(item!.triggerSuggestAfterAccept).toBe(true);
  });

  it("wraps begin / for_each action names", async () => {
    const source = `trigger general
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character =
      source.split(/\n/)[1]!.indexOf("action ") + "action ".length;
    const items = completionsAtPosition(snapshot, { line: 1, character });
    const begin = items.find((entry) => entry.label === "begin");
    const forEach = items.find((entry) => entry.label === "for_each");
    expect(begin).toBeDefined();
    expect(forEach).toBeDefined();
    expectBlockSnippet(begin!, "begin");
    expectBlockSnippet(forEach!, "for_each", snippetTabstop(1, "general"));
  });

  it("wraps nested game_options block keywords", async () => {
    const source = `game_options
\t
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const items = completionsAtPosition(snapshot, { line: 1, character: 1 });
    const option = items.find((entry) => entry.label === "option");
    expect(option).toBeDefined();
    expectBlockSnippet(option!, "option");
    const lock = items.find((entry) => entry.label === "lock");
    expect(lock?.insertAsSnippet).toBeFalsy();
  });

  it("wraps nested team inside teams", async () => {
    const source = `teams
\t
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const items = completionsAtPosition(snapshot, { line: 1, character: 1 });
    const team = items.find((entry) => entry.label === "team");
    expect(team).toBeDefined();
    expectBlockSnippet(team!, "team");
  });
});
