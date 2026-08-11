import { describe, expect, it } from "vitest";
import objectLists from "../../../../object-lists/haloreach_mcc/default";
import { Parser } from "../../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../frontend/diagnostics";
import { Lowerer } from "../../../../frontend/intermediate-representation";
import {
  DesignatorSwitchType,
  MultiplayerTeamDesignator,
  PlayerModelChoice,
  TeamOptionsModelOverrideType,
} from "../../../../frontend/intermediate-representation/game/game_engine_default";
import { Lexer } from "../../../../frontend/tokens";
import { VersionConfiguration107MCC } from "../../../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../../../version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(new VersionConfiguration107MCC()).lower(
    ast,
    diagnostics,
    { objectLists }
  );
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
    const teamOptions = ir.gameVariant.baseVariant.teamOptions;
    expect(teamOptions.model).toBe(TeamOptionsModelOverrideType.ByDesignator);
    expect(teamOptions.designatorSwitchType).toBe(DesignatorSwitchType.Rotate);
    expect(teamOptions.teams).toHaveLength(2);
    expect(teamOptions.teams?.[0]).toMatchObject({
      name: { english: "Red" },
      designator: MultiplayerTeamDesignator.Defenders,
      model: PlayerModelChoice.Spartan,
      teamColor: { r: 255, g: 0, b: 0 },
      fireteamCount: 2,
    });
    expect(teamOptions.teams?.[1]).toMatchObject({
      designator: MultiplayerTeamDesignator.Attackers,
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
    expect(ir.gameVariant.baseVariant.teamOptions.teams).toHaveLength(9);
  });
});
