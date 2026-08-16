import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../src/language-service";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("continue-completion (space + reopen suggest)", () => {
  it("appends a space after action / condition / temporary", async () => {
    const source = `trigger general
\t
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const items = completionsAtPosition(snapshot, { line: 1, character: 1 });
    for (const label of ["action", "condition", "temporary"] as const) {
      const item = items.find((entry) => entry.label === label);
      expect(item, label).toBeDefined();
      expect(item!.insertText).toBe(`${label} `);
      expect(item!.triggerSuggestAfterAccept).toBe(true);
    }
    const end = items.find((entry) => entry.label === "end");
    expect(end?.insertText).toBeUndefined();
    expect(end?.triggerSuggestAfterAccept).toBeFalsy();
  });

  it("appends a space after action names that take operands", async () => {
    const source = `trigger general
\taction 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character =
      source.split(/\n/)[1]!.indexOf("action ") + "action ".length;
    const items = completionsAtPosition(snapshot, { line: 1, character });
    const set = items.find((entry) => entry.label === "set");
    expect(set).toBeDefined();
    expect(set!.insertText).toBe("set ");
    expect(set!.triggerSuggestAfterAccept).toBe(true);

    const endRound = items.find((entry) => entry.label === "end_round");
    expect(endRound).toBeDefined();
    expect(endRound!.insertText).toBeUndefined();
    expect(endRound!.triggerSuggestAfterAccept).toBeFalsy();
  });

  it("appends a space after property keys that take values", async () => {
    const source = `engine_data
\t
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const items = completionsAtPosition(snapshot, { line: 1, character: 1 });
    const name = items.find((entry) => entry.label === "name");
    expect(name).toBeDefined();
    expect(name!.insertText).toBe("name ");
    expect(name!.triggerSuggestAfterAccept).toBe(true);
  });
});
