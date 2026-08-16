import { describe, expect, it } from "vitest";
import { compileSource, DiagnosticSeverity, MEGALO_VERSIONS } from "../src";

const version = MEGALO_VERSIONS["107-mcc"];

const withGlobals = (body: string): string => `variables global
\tlocal number n 0
end
${body}
`;

describe("pregame action allowlist", () => {
  it("allows set inside trigger pregame", async () => {
    const result = await compileSource(
      withGlobals(`trigger pregame
\taction set n set_to 0
end
`),
      { version }
    );
    expect(
      result.diagnostics.some((d) =>
        d.message.includes("can't be used inside a pregame trigger")
      )
    ).toBe(false);
  });

  it("rejects unsupported actions inside trigger pregame", async () => {
    const result = await compileSource(
      withGlobals(`trigger pregame
\taction end_round
end
`),
      { version }
    );
    const errors = result.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(
      errors.some((d) =>
        d.message.includes("can't be used inside a pregame trigger")
      )
    ).toBe(true);
  });

  it("rejects unsupported actions nested under begin in pregame", async () => {
    const result = await compileSource(
      withGlobals(`trigger pregame
\tbegin
\t\taction print_variable n
\tend
end
`),
      { version }
    );
    expect(
      result.diagnostics.some(
        (d) =>
          d.severity === DiagnosticSeverity.Error &&
          d.message.includes("can't be used inside a pregame trigger")
      )
    ).toBe(true);
  });
});
