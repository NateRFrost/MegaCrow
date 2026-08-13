import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import { Lexer } from "../../../../src/frontend/tokens";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { MEGALO_VERSIONS } from "../../../../src/version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(ast, diagnostics, { objectLists });
  return { ir, diagnostics };
};

describe("map_permissions lowering", () => {
  it("lowers default and exception entries", () => {
    const source = `constants
\tnumber k_map_id_boneyard 1080
\tnumber k_map_id_spire 2002
end
map_permissions
\tdefault false
\texception k_map_id_boneyard
\texception k_map_id_spire
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.mapPermissions).toEqual({
      allowByDefault: false,
      exceptMapIds: [1080, 2002],
    });
  });

  it("defaults allowByDefault to true when omitted", () => {
    const source = `map_permissions
\texception 1080
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.mapPermissions).toEqual({
      allowByDefault: true,
      exceptMapIds: [1080],
    });
  });

  it("accepts numeric default values", () => {
    const source = `map_permissions
\tdefault 0
\texception 1080
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.mapPermissions?.allowByDefault).toBe(false);
  });

  it("lowers map ids outside signed 16-bit range without error", () => {
    const source = `map_permissions
\texception 40000
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.mapPermissions?.exceptMapIds).toEqual([40000]);
  });

  it("errors on unknown keys", () => {
    const source = `map_permissions
\tallow 1
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("default");
  });
});
