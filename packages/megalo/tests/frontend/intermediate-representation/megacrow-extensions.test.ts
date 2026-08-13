import { describe, expect, it } from "vitest";
import { Parser } from "../../../src/frontend/abstract-syntax-tree";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Lowerer } from "../../../src/frontend/intermediate-representation";
import { ActionType } from "../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { MegacrowExtensions } from "../../../src/megacrow-extensions";
import { Lexer } from "../../../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../../../src/version";

const lowerScript = (
  source: string,
  megacrowExtensions?: Partial<MegacrowExtensions>
) => {
  const diagnostics = new Diagnostics();
  const frontend = new MegaloCompilerContext(
    MEGALO_VERSIONS["107-mcc"],
    megacrowExtensions
  );
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  const ir = new Lowerer(frontend).lower(ast, diagnostics);
  return { ir, diagnostics };
};

const TARGET_TEAM_SCRIPT = `variables global
	local team g_team none
end
trigger local
	action set g_team set_to target_team
end
`;

const COOP_SPAWNING_SCRIPT = `variables global
	networked object marker none
end
trigger initialization
	action navpoint_set_icon marker coop spawning
end
`;

describe("megacrowExtensions.targetTeam", () => {
  it("errors at lower when target_team is used without the extension", () => {
    const { diagnostics } = lowerScript(TARGET_TEAM_SCRIPT);
    expect(diagnostics.hasErrors()).toBe(true);
    const messages = diagnostics.getErrors().map((e) => e.message);
    expect(messages.some((m) => m.includes("targetTeam"))).toBe(true);
    expect(messages.some((m) => m.includes("target_team"))).toBe(true);
  });

  it("lowers target_team when the extension is enabled", () => {
    const { diagnostics } = lowerScript(TARGET_TEAM_SCRIPT, {
      targetTeam: true,
    });
    expect(diagnostics.getErrors().map((e) => e.message)).toEqual([]);
  });

  it("allows local_team without the extension", () => {
    const source = `variables global
	local team g_team none
end
trigger local
	action set g_team set_to local_team
end
`;
    const { diagnostics } = lowerScript(source);
    expect(diagnostics.getErrors().map((e) => e.message)).toEqual([]);
  });
});

describe("megacrowExtensions.coopSpawning", () => {
  it("does not join coop spawning without the extension", () => {
    const { diagnostics } = lowerScript(COOP_SPAWNING_SCRIPT);
    expect(diagnostics.hasErrors()).toBe(true);
  });

  it("parses and lowers coop spawning when the extension is enabled", () => {
    const { ir, diagnostics } = lowerScript(COOP_SPAWNING_SCRIPT, {
      coopSpawningWaypointIcon: true,
    });
    expect(diagnostics.getErrors().map((e) => e.message)).toEqual([]);
    const action = ir.gameVariant.gameEngine.actions.find(
      (entry) => entry.type === ActionType.NavpointSetIcon
    );
    expect(action?.parameters).toMatchObject({ icon: 27 });
  });
});

describe("player_set_objective_allegiance_icon", () => {
  it("lowers a constant engine icon index", () => {
    const { ir, diagnostics } = lowerScript(`constants
	number k_engine_icon_elite 7
end
trigger local
	action player_set_objective_allegiance_icon current_player k_engine_icon_elite
end
`);
    expect(diagnostics.getErrors().map((e) => e.message)).toEqual([]);
    const action = ir.gameVariant.gameEngine.actions.find(
      (entry) => entry.type === ActionType.PlayerSetObjectiveAllegianceIcon
    );
    expect(action?.parameters).toMatchObject({ iconIndex: 7 });
  });

  it("rejects icon indexes outside 0..127 (except -1)", () => {
    const { diagnostics } = lowerScript(`trigger local
	action player_set_objective_allegiance_icon current_player 128
end
`);
    expect(diagnostics.hasErrors()).toBe(true);
    expect(
      diagnostics.getErrors().some((e) => e.message.includes("icon index out of range"))
    ).toBe(true);
  });
});
