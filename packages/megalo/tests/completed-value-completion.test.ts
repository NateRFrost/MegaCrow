import { describe, expect, it } from "vitest";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../src/language-service";
import { ALL_MEGACROW_EXTENSIONS } from "../src/megacrow-extensions";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("completed-value completion", () => {
  it("does not suggest after a finished quoted engine_data name", async () => {
    const source = `engine_data
\tname "MegaCrow Test 2"
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    });
    const line = source.split(/\n/)[1]!;
    const character =
      line.indexOf('"MegaCrow Test 2"') + '"MegaCrow Test 2"'.length;
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels).toEqual([]);
  });

  it("does not suggest object types after a finished map_object type quote", async () => {
    const source = `map_object created_banshee
\ttype "banshee"
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    });
    const line = source.split(/\n/)[1]!;
    const character = line.indexOf('"banshee"') + '"banshee"'.length;
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels).not.toContain("banshee");
    expect(labels).not.toContain("warthog");
  });

  it("still suggests object types inside an open map_object type quote", async () => {
    const source = `map_object created_banshee
\ttype "ban
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    });
    const line = source.split(/\n/)[1]!;
    const character = line.indexOf('"ban') + '"ban'.length;
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);
    expect(labels, JSON.stringify({ line, character, labels })).toContain(
      "banshee"
    );
  });

  it("hides megacrow_version from string autocomplete", async () => {
    const source = `engine_data
\tname 
end
`;
    const snapshot = await analyzeDocument(source, {
      version,
      megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    });
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character: "\tname ".length,
    }).map((item) => item.label);
    expect(labels).not.toContain("megacrow_version");
    expect(labels).not.toContain("mc_version");
  });
});
