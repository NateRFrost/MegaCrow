import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import { Lexer } from "../../../../frontend/tokens";

import { MEGALO_VERSIONS } from "../../../../version";
import { FrontendContext } from "../../../../frontend/context";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new FrontendContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(
    ast,
    diagnostics,
    { objectLists }
  );
  return { ir, diagnostics };
};

describe("base-derived IR lower constraints", () => {
  it("rejects top-level elements MegaloEdit disallows after base", () => {
    const { diagnostics } = lower(`base "parent.mglo"
variables
\tglobal.number foo
end
`);

    expect(
      diagnostics
        .getErrors()
        .some((error) =>
          error.message.includes("not allowed in a base-derived script")
        )
    ).toBe(true);
  });

  it("allows MegaloEdit base-file top-level elements", () => {
    const { diagnostics } = lower(`base "parent.mglo"
string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
teams
end
constants
\tnumber foo 1
end
`);

    expect(
      diagnostics
        .getErrors()
        .filter((error) =>
          error.message.includes("not allowed in a base-derived script")
        )
    ).toEqual([]);
  });

  it("rejects defining new options in a base-derived script", () => {
    const { diagnostics } = lower(`base "parent.mglo"
string_table english
\topt_name "Points"
\topt_desc "Points"
\tval "1"
end
game_options
\toption points
\t\topt_name
\t\topt_desc
\t\t1
\t\t1 val ""
\tend
end
`);

    expect(
      diagnostics
        .getErrors()
        .some((error) =>
          error.message.includes("cannot define new entries in a base-derived")
        )
    ).toBe(true);
  });

  it("rejects ranged_option in a base-derived script", () => {
    const { diagnostics } = lower(`base "parent.mglo"
game_options
\tranged_option score
\t\t"Score"
\t\t""
\t\t10
\t\t0
\t\t100
\tend
end
`);

    expect(
      diagnostics
        .getErrors()
        .some((error) => error.message.includes("ranged_option"))
    ).toBe(true);
  });

  it("lowers option override shorthand into baseOverrides", () => {
    const { ir, diagnostics } = lower(`base "parent.mglo"
game_options
\toption "Kill Points" 5
end
`);

    expect(
      diagnostics
        .getErrors()
        .filter((error) => error.message.includes("option"))
    ).toEqual([]);
    expect(ir.baseOverrides.userDefinedOptions).toHaveLength(1);
    expect(ir.baseOverrides.userDefinedOptions[0]).toMatchObject({
      target: { kind: "name", value: "Kill Points" },
      value: 5,
    });
  });

  it("lowers player_traits override shorthand into baseOverrides", () => {
    const { ir, diagnostics } = lower(`base "parent.mglo"
game_options
\tplayer_traits "VIP Traits"
\t\tspeed 200
\tend
end
`);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.baseOverrides.playerTraits).toHaveLength(1);
    expect(ir.baseOverrides.playerTraits[0]).toMatchObject({
      target: { kind: "name", value: "VIP Traits" },
      traits: { movement: { speedPercentage: 200 } },
    });
    expect(ir.gameVariant.playerTraits).toHaveLength(0);
  });

  it("rejects option override shorthand without a base", () => {
    const { diagnostics } = lower(`game_options
\toption "Kill Points" 5
end
`);

    expect(
      diagnostics
        .getErrors()
        .some((error) =>
          error.message.includes("override form requires a base-derived")
        )
    ).toBe(true);
  });
});
