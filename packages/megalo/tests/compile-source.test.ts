import { bitstream } from "@blamnetwork/blf";
import { c_game_engine_custom_variant as AlphaCustomVariant } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import { describe, expect, it } from "vitest";
import { compileSource } from "../src/compile-source";
import { MegaloCompilerContext } from "../src/context";
import { Diagnostics, SourceLocationType } from "../src/diagnostics";
import { Parser } from "../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../src/frontend/abstract-syntax-tree/elements";
import { Lexer } from "../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../src/version";

const { c_bitstream_writer, e_bitstream_byte_order } = bitstream;

const version = MEGALO_VERSIONS["107-mcc"];
const frontend = new MegaloCompilerContext(version);

const encodeAlphaMglo = (): Uint8Array => {
  const gametype = new AlphaCustomVariant();
  gametype.initialize();
  const writer = c_bitstream_writer.new(
    0,
    e_bitstream_byte_order._bitstream_byte_order_big_endian
  );
  writer.begin_writing();
  gametype.encode(writer);
  writer.finish_writing();
  return writer.get_data();
};

const minimalScript = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
`;

describe("compileSource includes", () => {
  it("expands includes so later symbols can see included declarations", async () => {
    const files = new Map<string, string>([
      [
        "shared.txt",
        `constants
\tnumber shared_flag 1
end
`,
      ],
    ]);

    const result = await compileSource(
      `include "shared.txt"
constants
\tnumber local_flag shared_flag
end
`,
      {
        version,
        resolveInclude: (path) => {
          const text = files.get(path);
          return text ? { text, uri: path } : null;
        },
      }
    );

    expect(
      result.diagnostics.some((d) => d.message.includes("shared_flag"))
    ).toBe(false);
  });

  it("blames unresolved include DX on the include line", async () => {
    const source = `include "missing.txt"
`;
    const result = await compileSource(source, {
      version,
      resolveInclude: () => Promise.resolve(null),
    });

    const error = result.diagnostics.find((d) =>
      d.message.includes('Could not resolve include "missing.txt"')
    );
    expect(error).toBeDefined();
    expect(error?.location.type).toBe(SourceLocationType.SOURCE_CODE);
    if (error?.location.type === SourceLocationType.SOURCE_CODE) {
      expect(error?.location.start.line).toBe(1);
    }
  });

  it("tags nested include parse errors as IncludeLocation on the outer include", async () => {
    const files = new Map<string, string>([
      ["outer.txt", `include "inner.txt"\n`],
      ["inner.txt", "this_is_not_a_valid_element\n"],
    ]);

    const source = `include "outer.txt"
`;
    const result = await compileSource(source, {
      version,
      resolveInclude: (path) => {
        const text = files.get(path);
        return text ? { text, uri: path } : null;
      },
    });

    const includeErrors = result.diagnostics.filter(
      (d) => d.location.type === SourceLocationType.INCLUDE
    );
    expect(includeErrors.length).toBeGreaterThan(0);
    for (const d of includeErrors) {
      if (d.location.type === SourceLocationType.INCLUDE) {
        expect(d.location.declaration.start.line).toBe(1);
        expect(d.location.file).toBe("inner.txt");
        expect(d.location.source.type).toBe(SourceLocationType.SOURCE_CODE);
        expect(d.location.source.start.line).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("errors when the same string token is redefined for a language across includes", async () => {
    const files = new Map<string, string>([
      [
        "a.txt",
        `string_table french
\tfoo "un"
end
`,
      ],
      [
        "b.txt",
        `string_table french
\tfoo "deux"
end
`,
      ],
    ]);

    const result = await compileSource(
      `include "a.txt"
include "b.txt"
`,
      {
        version,
        resolveInclude: (path) => {
          const text = files.get(path);
          return text ? { text, uri: path } : null;
        },
      }
    );

    expect(
      result.diagnostics.some((d) =>
        d.message.includes("already has a string for token foo")
      )
    ).toBe(true);
  });

  it("expands a repeated include path only once (MegaloEdit parity)", async () => {
    let resolveCount = 0;
    const result = await compileSource(
      `include "shared.txt"
include "shared.txt"
constants
\tnumber x once
end
`,
      {
        version,
        resolveInclude: () => {
          resolveCount += 1;
          return {
            text: `constants
\tnumber once 1
end
`,
            uri: "shared.txt",
          };
        },
      }
    );

    expect(resolveCount).toBe(1);
    expect(result.diagnostics.some((d) => d.message.includes("once"))).toBe(
      false
    );
  });
});

describe("compileSource base files", () => {
  it("reports DX when more than one base is present", async () => {
    const result = await compileSource(
      `base "a.mglo"
base "b.mglo"
`,
      { version }
    );

    const multi = result.diagnostics.filter((d) =>
      d.message.includes("Only one base directive is allowed")
    );
    expect(multi.length).toBeGreaterThanOrEqual(1);
    expect(result.bytes).toBeUndefined();
  });

  it("compiles with a matching encoding base file", async () => {
    const baseResult = await compileSource(minimalScript, { version });
    expect(baseResult.bytes).toBeDefined();

    const result = await compileSource(`base "base.mglo"\n${minimalScript}`, {
      version,
      resolveBaseFile: async () => baseResult.bytes!,
    });

    expect(
      result.diagnostics.filter((d) =>
        d.message.toLowerCase().includes("encoding version")
      )
    ).toHaveLength(0);
    expect(result.bytes).toBeDefined();
  });

  it("reports DX when base encoding version does not match", async () => {
    const alphaBytes = encodeAlphaMglo();
    const result = await compileSource(`base "alpha.mglo"\n${minimalScript}`, {
      version,
      resolveBaseFile: async () => alphaBytes,
    });

    const mismatch = result.diagnostics.find((d) =>
      d.message.includes("encoding version")
    );
    expect(mismatch).toBeDefined();
    expect(result.bytes).toBeUndefined();
  });
});

describe("compileSource object lists", () => {
  it("loads bundled defaults so known object-list names resolve", async () => {
    const source = `map_object health_packs
\ttype "health_station"
end
`;

    const withDefaults = await compileSource(source, { version });
    const withoutDefaults = await compileSource(source, {
      version,
      objectLists: {},
    });

    expect(
      withDefaults.diagnostics.some((d) =>
        d.message.includes("not a valid object type")
      )
    ).toBe(false);
    expect(
      withoutDefaults.diagnostics.some((d) =>
        d.message.includes("not a valid object type")
      )
    ).toBe(true);
  });
});

describe("Parser.parseAsync include expansion", () => {
  it("splices included elements into the parent AST", async () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(frontend).lex(
      `include "c.txt"
constants
\tnumber x 1
end
`,
      diagnostics
    );

    const ast = await new Parser(frontend).parseAsync(tokens, diagnostics, {
      resolveInclude: () => ({
        text: `constants
\tnumber y 2
end
`,
        uri: "c.txt",
      }),
    });

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.elements.length).toBeGreaterThanOrEqual(2);
    expect(
      ast.elements.every((e) => e.elementKind !== ElementKind.INCLUDE)
    ).toBe(true);
  });
});
