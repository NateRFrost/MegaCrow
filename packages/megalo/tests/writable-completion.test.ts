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

describe("writable completion filtering", () => {
  it("omits current_player from set LHS but keeps user player vars", async () => {
    const source = `variables global
\tlocal player p none
\tlocal number n 0
end
trigger player
\taction set 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 5, "set ");
    const labels = completionsAtPosition(snapshot, {
      line: 5,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("p");
    expect(labels).toContain("n");
    expect(labels).not.toContain("current_player");
    expect(labels).not.toContain("true");
    expect(labels).not.toContain("round_index");
  });

  it("still suggests current_player on set RHS", async () => {
    const source = `variables global
\tlocal player p none
end
trigger player
\taction set p set_to 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 4, "set_to ");
    const labels = completionsAtPosition(snapshot, {
      line: 4,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("current_player");
    expect(labels).toContain("p");
  });

  it("omits non-writable objects after create_object set", async () => {
    const source = `variables global
\tlocal object ride none
end
trigger player
\taction create_object "banshee" at none set 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 4, "set ");
    const labels = completionsAtPosition(snapshot, {
      line: 4,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("ride");
    expect(labels).not.toContain("current_object");
    expect(labels).not.toContain("current_player");
    expect(labels).not.toContain("none");
  });

  it("still suggests current_player after create_object at", async () => {
    const source = `variables global
\tlocal object ride none
end
trigger player
\taction create_object "banshee" at 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 4, "at ");
    const labels = completionsAtPosition(snapshot, {
      line: 4,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("ride");
    expect(labels).toContain("current_player");
  });

  it("omits constants from random out slot", async () => {
    const source = `variables global
\tlocal number n 0
end
trigger general
\taction random 10 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const character = afterOnLine(source, 4, "10 ");
    const labels = completionsAtPosition(snapshot, {
      line: 4,
      character,
    }).map((item) => item.label);
    expect(labels).toContain("n");
    expect(labels).not.toContain("true");
    expect(labels).not.toContain("false");
  });
});
