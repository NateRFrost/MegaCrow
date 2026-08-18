import { compileSource } from "src/compile-source";
import { MegaloCompilerContext } from "src/context";
import { Diagnostics } from "src/diagnostics";
import { Parser, SyntaxKind } from "src/frontend/abstract-syntax-tree";
import { ElementKind } from "src/frontend/abstract-syntax-tree/elements";
import { Lexer } from "src/frontend/tokens";
import { analyzeDocumentSync } from "src/language-service/analyze";
import { MEGALO_VERSIONS } from "src/version";
import { describe, expect, it } from "vitest";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  return { ast, diagnostics };
};

const bugcheck = `game_options
    override round_time_limit 0
    override score_to_win_round 0

    override base_player_traits
        infinite_ammo 1
    end

end

variables global
    local number player_shield 0
    local number player_health 0
    local number player_velocity 0
end

hud_widgets
    vel_widget low_left
    health_widget low_left
    funny_text high_center
end

trigger player
    temporary object body current_player
    condition if body != none

    action object_get_health current_player player_health
    action object_get_shield current_player player_shield
    action object_get_velocity current_player player_velocity

    action hud_widget_set_text health_widget "Health: %n \\nShield: %n" player_health player_shield
    action hud_widget_set_text vel_widget "Velocity: %n" player_velocity
end

trigger player
    condition player_died current_player any
    condition not player_died current_player enemy
    condition not player_died current_player betrayal

    ;Player stats
    action hud_widget_set_text health_widget ""
    action hud_widget_set_text vel_widget ""
    action hud_widget_set_text vel_widget ""
end

variables global
    local number crap 0
    local number piss 100
end

trigger object
    action set piss set_to 100
    action set crap set_to 0
    action object_get_velocity current_object crap
    condition if crap > 1

    action set piss add crap
    action object_set_scale current_object piss
end

variables global
    object my_banshee
end

trigger local
    action create_object "banshee" at current_player set my_banshee never_garbage
    action player_set_vehicle current_player my_banshee
end
`;

describe("bugcheck variables parse resilience", () => {
  it("parses omitted-network object vars without throwing", () => {
    expect(() =>
      analyzeDocumentSync(bugcheck, { version: MEGALO_VERSIONS["107-mcc"] })
    ).not.toThrow();
  });

  it("does not throw when computing variant limit usage", async () => {
    await expect(
      compileSource(bugcheck, { version: MEGALO_VERSIONS["107-mcc"] })
    ).resolves.toMatchObject({
      limitUsage: expect.objectContaining({ items: expect.any(Array) }),
    });
  });

  it("defaults omitted network to local and keeps end for the block", () => {
    const source = `variables global
\tobject my_banshee
end
`;
    const { ast, diagnostics } = parse(source);
    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.VARIABLES);
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }
    expect(element.entries).toHaveLength(1);
    expect(element.entries[0]).toMatchObject({
      network: { value: "local" },
      type: { value: "object" },
      name: { value: "my_banshee" },
      initial: { kind: SyntaxKind.INVALID },
    });
    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toMatch(
      /Expected variable reference but got 'end'/
    );
  });
});
