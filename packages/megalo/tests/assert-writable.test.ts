import { describe, expect, it } from "vitest";
import { compileSource, DiagnosticSeverity, MEGALO_VERSIONS } from "../src";

const version = MEGALO_VERSIONS["107-mcc"];

const withGlobals = (body: string): string => `variables global
\tlocal number n 0
\tlocal object o none
\tlocal player p none
end
${body}
`;

describe("assertWritable", () => {
  it("rejects set LHS to current_player", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction set current_player set_to none
end
`),
      { version }
    );
    expect(
      result.diagnostics.some(
        (d) =>
          d.severity === DiagnosticSeverity.Error &&
          d.message.includes("player reference must be writeable")
      )
    ).toBe(true);
  });

  it("allows set LHS to global player variable", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction set p set_to none
end
`),
      { version }
    );
    expect(
      result.diagnostics.some((d) =>
        d.message.includes("player reference must be writeable")
      )
    ).toBe(false);
  });

  it("rejects random out into a constant", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction random 10 5
end
`),
      { version }
    );
    expect(
      result.diagnostics.some(
        (d) =>
          d.severity === DiagnosticSeverity.Error &&
          d.message.includes("Numeric reference must be writeable")
      )
    ).toBe(true);
  });

  it("allows random out into a number variable", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction random 10 n
end
`),
      { version }
    );
    expect(
      result.diagnostics.some((d) =>
        d.message.includes("Numeric reference must be writeable")
      )
    ).toBe(false);
  });

  it("rejects create_object set out to current_object", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction create_object "warthog" at none set current_object
end
`),
      { version }
    );
    expect(
      result.diagnostics.some(
        (d) =>
          d.severity === DiagnosticSeverity.Error &&
          d.message.includes("Object reference must be writable")
      )
    ).toBe(true);
  });

  it("rejects get_player_holding_object out to current_player", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
\taction get_player_holding_object o current_player
end
`),
      { version }
    );
    expect(
      result.diagnostics.some(
        (d) =>
          d.severity === DiagnosticSeverity.Error &&
          d.message.includes("player reference must be writeable")
      )
    ).toBe(true);
  });
});
