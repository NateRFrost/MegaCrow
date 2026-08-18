import { describe, expect, it } from "vitest";
import { compileSource } from "../src/compile-source";
import { DiagnosticSeverity } from "../src/diagnostics";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["49"];

const wrap = (body: string): string => `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end

${body}
`;

describe("set_score unresolved value DX", () => {
  it("reports unresolved value without splitting trailing target tokens", async () => {
    const result = await compileSource(
      wrap(`trigger player
\taction set_score add death_points player current_player
end
`),
      { version }
    );

    const errors = result.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(errors.map((d) => d.message)).toEqual([
      "Unresolved identifier 'death_points'.",
    ]);
    expect(errors.some((d) => d.message.includes("Unrecognized element"))).toBe(
      false
    );
    expect(
      errors.some((d) => d.message.includes("Expected 2 parameters"))
    ).toBe(false);
  });
});
