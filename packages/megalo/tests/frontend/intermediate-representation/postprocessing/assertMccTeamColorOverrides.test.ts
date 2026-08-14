import { describe, expect, it } from "vitest";
import { Diagnostics, SourceLocationType } from "../../../../src/diagnostics";
import type { IR } from "../../../../src/frontend/intermediate-representation";
import { createFieldLocations } from "../../../../src/frontend/intermediate-representation/locations";
import type { ElementLowerContext } from "../../../../src/frontend/intermediate-representation/parameters";
import { assertMccTeamColorOverrides } from "../../../../src/frontend/intermediate-representation/postprocessing/assertMccTeamColorOverrides";

const makeIrWithTeamColor = (recordLocation: boolean): IR => {
  const locations = createFieldLocations();
  const team = { teamColor: { r: 255, g: 0, b: 0 } };
  if (recordLocation) {
    locations.record(team, "teamColor", {
      type: SourceLocationType.SOURCE_CODE,
      start: {
        line: 1,
        column: 1,
        localOffset: 0,
        absoluteOffset: 0,
      },
      end: {
        line: 1,
        column: 5,
        localOffset: 4,
        absoluteOffset: 4,
      },
    });
  }
  return {
    locations,
    gameVariant: {
      baseVariant: {
        teamOptions: {
          teams: [team],
        },
      },
    },
  } as unknown as IR;
};

const makeCtx = (
  flavour: "mcc" | undefined,
  diagnostics: Diagnostics,
  ir: IR
): ElementLowerContext =>
  ({
    diagnostics,
    frontend: {
      megaloVersion: { version: 107, flavour },
    },
    ir,
  }) as ElementLowerContext;

describe("assertMccTeamColorOverrides", () => {
  it("warns for MCC when a team color override is present", () => {
    const ir = makeIrWithTeamColor(true);
    const diagnostics = new Diagnostics();
    assertMccTeamColorOverrides(ir, makeCtx("mcc", diagnostics, ir));

    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain(
      "team color overrides do not apply in the MCC menus"
    );
    expect(diagnostics.getWarnings()[0]?.location.type).toBe(
      SourceLocationType.SOURCE_CODE
    );
  });

  it("uses UNKNOWN_LOCATION when no sidecar span was recorded", () => {
    const ir = makeIrWithTeamColor(false);
    const diagnostics = new Diagnostics();
    assertMccTeamColorOverrides(ir, makeCtx("mcc", diagnostics, ir));

    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.location.type).toBe(
      SourceLocationType.UNKNOWN
    );
  });

  it("does not warn when flavour is not MCC", () => {
    const ir = makeIrWithTeamColor(true);
    const diagnostics = new Diagnostics();
    assertMccTeamColorOverrides(ir, makeCtx(undefined, diagnostics, ir));

    expect(diagnostics.getWarnings()).toEqual([]);
  });
});
