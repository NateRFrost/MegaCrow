import { describe, expect, it } from "vitest";
import { mathOperation } from "../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  analyzeDocument,
  completionsAtPosition,
} from "../src/language-service";
import { MEGALO_VERSIONS } from "../src/version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("megaloEnum aliases in completion", () => {
  it("suggests canonical mathOperation names, not aliases like %=", async () => {
    const source = `trigger general
\taction set global.a 
end
`;
    const snapshot = await analyzeDocument(source, { version });
    const line = source.split(/\n/)[1]!;
    const character = line.length;
    const labels = completionsAtPosition(snapshot, {
      line: 1,
      character,
    }).map((item) => item.label);

    expect(labels).toContain("modulo");
    expect(labels).toContain("add");
    expect(labels).not.toContain("%=");
    expect(labels).not.toContain("+=");
    expect(labels).not.toContain("=");

    for (const alias of mathOperation.acceptedNames) {
      if (
        mathOperation.names.includes(
          alias as (typeof mathOperation.names)[number]
        )
      ) {
        continue;
      }
      expect(labels, `alias ${alias}`).not.toContain(alias);
    }
  });
});
