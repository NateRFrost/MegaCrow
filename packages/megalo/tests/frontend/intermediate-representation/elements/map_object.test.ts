import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import { ObjectTeamFilter } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import { ObjectListType } from "../../../../frontend/object-lists";
import { Lexer } from "../../../../frontend/tokens";
import { VersionConfiguration107MCC } from "../../../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../../../version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(new VersionConfiguration107MCC()).lower(
    ast,
    diagnostics,
    { objectLists }
  );
  return { ir, diagnostics };
};

describe("map_object lowering", () => {
  it("lowers label, team, type, user_data, and min", () => {
    const source = `string_table english
\tctf_flag_spawn "CTF Flag Spawn"
end
map_object flag_spawn_point
\tlabel ctf_flag_spawn
\tteam each
end
map_object health_packs
\ttype "health_station"
end
map_object phase_markers
\tlabel "phase_marker"
\tuser_data 2
\tmin 1
end
`;
    const { ir, diagnostics } = lower(source);
    const filters = ir.gameVariant.gameEngine.objectFilters;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(filters).toHaveLength(3);
    expect(filters[0]).toMatchObject({
      label: expect.any(Number),
      team: ObjectTeamFilter.Each,
    });
    const healthStationIndex = objectLists[ObjectListType.Objects]!.indexOf(
      "health_station"
    );
    expect(filters[1]?.objectType).toBe(healthStationIndex);
    expect(ir.gameVariant.gameEngine.objectsUsed[healthStationIndex]).toBe(
      true
    );
    expect(filters[2]).toMatchObject({
      label: expect.any(Number),
      userData: 2,
      min: 1,
    });
  });

  it("errors on invalid team keywords", () => {
    const source = `map_object stuff
\tteam not_a_team
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("each");
  });
});
