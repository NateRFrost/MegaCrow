import { describe, expect, it } from "vitest";
import { compileSource } from "../src/compile-source";
import { DiagnosticSeverity } from "../src/diagnostics";
import { MEGALO_VERSIONS } from "../src/version";

const wrap = (body: string): string => `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end

${body}
`;

describe("object_set_scale float vs variable", () => {
  it("Alpha encodes float scale and rejects number variables", async () => {
    const floatOk = await compileSource(
      wrap(`trigger local
\taction object_set_scale current_object 1.5
end
`),
      { version: MEGALO_VERSIONS["49"] }
    );
    expect(
      floatOk.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error)
    ).toEqual([]);

    const integerOk = await compileSource(
      wrap(`trigger local
\taction object_set_scale current_object 2
end
`),
      { version: MEGALO_VERSIONS["49"] }
    );
    expect(
      integerOk.diagnostics.filter(
        (d) => d.severity === DiagnosticSeverity.Error
      )
    ).toEqual([]);

    const variableDx = await compileSource(
      wrap(`variables global
\tlocal number scale_value 1
end
trigger local
\taction object_set_scale current_object scale_value
end
`),
      { version: MEGALO_VERSIONS["49"] }
    );
    const errors = variableDx.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(errors.map((d) => d.message)).toContain(
      "object_set_scale number variable is not supported by Halo: Reach - Alpha; use a float literal."
    );
  });

  it("Retail encodes number variables and rejects float scale", async () => {
    const variableOk = await compileSource(
      wrap(`variables global
\tlocal number scale_value 100
end
trigger local
\taction object_set_scale current_object scale_value
end
`),
      { version: MEGALO_VERSIONS["106"] }
    );
    expect(
      variableOk.diagnostics.filter(
        (d) => d.severity === DiagnosticSeverity.Error
      )
    ).toEqual([]);

    const floatDx = await compileSource(
      wrap(`trigger local
\taction object_set_scale current_object 1.5
end
`),
      { version: MEGALO_VERSIONS["106"] }
    );
    const errors = floatDx.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(errors.map((d) => d.message)).toContain(
      "object_set_scale float scale is not supported by Halo: Reach - Release; use a number variable."
    );
  });
});
