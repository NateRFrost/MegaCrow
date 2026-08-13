import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../src/diagnostics";
import { Lexer } from "../../../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../../../src/version";
import { MegaloCompilerContext } from "../../../src/context";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  return { ast, diagnostics };
};

describe("baseParser", () => {
  it("parses a base element with a quoted file path", () => {
    const source = `base "gametypes/slayer/slayer_base.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.BASE);
    if (element.elementKind !== ElementKind.BASE) {
      return;
    }

    expect(element.file).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "gametypes/slayer/slayer_base.megalo",
    });
  });

  it("reports a missing quoted file path", () => {
    const source = `base slayer_base.megalo
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.BASE) {
      return;
    }

    expect(element.file).toMatchObject({ kind: SyntaxKind.INVALID });
  });
});
