import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics, SourceLocationType } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import {
  DesignatorSwitchType,
  MultiplayerTeamDesignator,
  PlayerModelChoice,
  TeamOptionsModelOverrideType,
} from "../../../../src/frontend/intermediate-representation/game/game_engine_default";
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

describe("teams lowering", () => {
  it("lowers block options and nested team properties", () => {
    const source = `string_table english
\tteam_name_red "Red"
end
teams
\tmodel by_designator
\tdesignator_switch_type rotate
\tteam
\t\tname team_name_red
\t\tdesignator defenders
\t\tmodel spartan
\t\tcolor 255 0 0
\t\tfireteam_count 2
\tend
\tteam
\t\tdesignator attackers
\t\tfireteam_count 3
\tend
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    const colorWarning = diagnostics.getWarnings()[0]!;
    expect(colorWarning.message).toContain(
      "team color overrides do not apply in the MCC menus"
    );
    expect(colorWarning.location.type).toBe(SourceLocationType.SOURCE_CODE);
    if (colorWarning.location.type === SourceLocationType.SOURCE_CODE) {
      // Spans the full `255 0 0` RGB triple, not just the R component.
      expect(colorWarning.location.start.column).toBeLessThan(
        colorWarning.location.end.column
      );
      expect(
        colorWarning.location.end.localOffset -
          colorWarning.location.start.localOffset
      ).toBe("255 0 0".length);
    }
    const teamOptions = ir.gameVariant.baseVariant.teamOptions;
    expect(teamOptions.model).toBe(TeamOptionsModelOverrideType.by_designator);
    expect(teamOptions.designatorSwitchType).toBe(DesignatorSwitchType.rotate);
    expect(teamOptions.teams).toHaveLength(2);
    expect(teamOptions.teams?.[0]).toMatchObject({
      name: { english: "Red" },
      designator: MultiplayerTeamDesignator.defenders,
      model: PlayerModelChoice.spartan,
      teamColor: { r: 255, g: 0, b: 0 },
      fireteamCount: 2,
    });
    expect(teamOptions.teams?.[1]).toMatchObject({
      designator: MultiplayerTeamDesignator.attackers,
      fireteamCount: 3,
    });
  });

  it("errors on invalid block model and fireteam_count range", () => {
    const source = `teams
\tmodel set_by_team
\tteam
\t\tfireteam_count 17
\tend
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    const messages = diagnostics.getErrors().map((error) => error.message);
    expect(messages.some((message) => message.includes("by_designator"))).toBe(
      true
    );
    expect(messages.some((message) => message.includes("17"))).toBe(true);
  });

  it("lowers more than eight teams without error", () => {
    const teams = Array.from(
      { length: 9 },
      () => `\tteam
\t\tfireteam_count 1
\tend`
    ).join("\n");
    const source = `teams
${teams}
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(diagnostics.getWarnings()).toEqual([]);
    expect(ir.gameVariant.baseVariant.teamOptions.teams).toHaveLength(9);
  });
});
