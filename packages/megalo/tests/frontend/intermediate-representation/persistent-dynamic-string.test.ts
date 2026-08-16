import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Parser } from "../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../src/frontend/intermediate-representation";
import { Lexer } from "../../../src/frontend/tokens";
import objectLists from "../../../src/object-lists/haloreach_mcc/default";
import { MEGALO_VERSIONS } from "../../../src/version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(ast, diagnostics, { objectLists });
  return { ir, diagnostics };
};

const PERSISTENT_MSG =
  "Can't use transient variables when reading a persistent string";

describe("persistent dynamic string replacements", () => {
  it("errors when hud_widget_set_text uses a temporary object replacement", () => {
    const source = `string_table english
\tlabel "%o"
end
hud_widgets
\twatermark bottom_center
end
trigger player
\ttemporary object ride none
\taction hud_widget_set_text watermark label ride
end
`;
    const { diagnostics } = lower(source);
    expect(diagnostics.getErrors().map((e) => e.message)).toContain(
      PERSISTENT_MSG
    );
  });

  it("errors when hud_widget_set_text uses current_player as %p", () => {
    const source = `string_table english
\tlabel "%p"
end
hud_widgets
\twatermark bottom_center
end
trigger player
\taction hud_widget_set_text watermark label current_player
end
`;
    const { diagnostics } = lower(source);
    expect(diagnostics.getErrors().map((e) => e.message)).toContain(
      PERSISTENT_MSG
    );
  });

  it("allows temporary numbers in persistent hud_widget_set_text", () => {
    const source = `string_table english
\tlabel "%n"
end
hud_widgets
\twatermark bottom_center
end
trigger player
\ttemporary number hold 0
\taction hud_widget_set_text watermark label hold
end
`;
    const { diagnostics } = lower(source);
    expect(diagnostics.getErrors().map((e) => e.message)).not.toContain(
      PERSISTENT_MSG
    );
  });

  it("allows temporary object replacements in non-persistent print_variable", () => {
    const source = `string_table english
\tlabel "%o"
end
trigger player
\ttemporary object ride none
\taction print_variable label ride
end
`;
    const { diagnostics } = lower(source);
    expect(diagnostics.getErrors().map((e) => e.message)).not.toContain(
      PERSISTENT_MSG
    );
  });

  it("errors for navpoint_set_text / player_set_objective with current_player", () => {
    const nav = `string_table english
\tlabel "%p"
end
variables global
\tlocal object flag none
end
trigger player
\taction navpoint_set_text flag label current_player
end
`;
    expect(
      lower(nav)
        .diagnostics.getErrors()
        .map((e) => e.message)
    ).toContain(PERSISTENT_MSG);

    const objective = `string_table english
\tlabel "%p"
end
trigger player
\taction player_set_objective current_player label current_player
end
`;
    expect(
      lower(objective)
        .diagnostics.getErrors()
        .map((e) => e.message)
    ).toContain(PERSISTENT_MSG);
  });
});
