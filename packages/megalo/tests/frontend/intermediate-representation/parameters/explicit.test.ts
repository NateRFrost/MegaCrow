import { describe, expect, it } from "vitest";
import { ExplicitObject } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  parseExplicitObject,
  parseExplicitPlayer,
  parseExplicitTeam,
  parseQualifiedTemporaryName,
  TEAM_DESIGNATOR_INDICES,
  tryParseExplicitObject,
  tryParseExplicitPlayer,
} from "../../../../src/frontend/intermediate-representation/parameters/explicit";

describe("explicit name parsers", () => {
  it("parses explicit players", () => {
    expect(parseExplicitPlayer("current_player")).toBe(ExplicitPlayer.Current);
    expect(parseExplicitPlayer("none")).toBe(ExplicitPlayer.None);
    expect(parseExplicitPlayer("local_player")).toBe(ExplicitPlayer.Hud);
    expect(parseExplicitPlayer("target_player")).toBe(ExplicitPlayer.HudTarget);
    expect(parseExplicitPlayer("object_death_killing_player")).toBe(
      ExplicitPlayer.Killer
    );
    expect(tryParseExplicitPlayer("killer")).toBeUndefined();
    expect(tryParseExplicitPlayer("hud_player")).toBeUndefined();
    expect(parseExplicitPlayer("temporary_player_1")).toBe(
      ExplicitPlayer.Temporary1
    );
  });

  it("parses explicit objects", () => {
    expect(parseExplicitObject("none")).toBe(ExplicitObject.None);
    expect(parseExplicitObject("current_object")).toBe(ExplicitObject.Current);
    expect(parseExplicitObject("target_object")).toBe(ExplicitObject.HudTarget);
    expect(parseExplicitObject("object_death_dead_object")).toBe(
      ExplicitObject.Killed
    );
    expect(parseExplicitObject("object_death_killing_object")).toBe(
      ExplicitObject.Killer
    );
    expect(tryParseExplicitObject("killed_object")).toBeUndefined();
    expect(tryParseExplicitObject("killer_object")).toBeUndefined();
    expect(parseExplicitObject("temporary_object_2")).toBe(
      ExplicitObject.Temporary2
    );
  });

  it("parses explicit teams and designators", () => {
    expect(parseExplicitTeam("current_team")).toBe(ExplicitTeam.CurrentTeam);
    expect(parseExplicitTeam("local_team")).toBe(ExplicitTeam.LocalTeam);
    expect(parseExplicitTeam("target_team")).toBe(ExplicitTeam.TargetTeam);
    expect(parseExplicitTeam("neutral")).toBe(ExplicitTeam.neutral);
    expect(parseExplicitTeam("defenders")).toBe(ExplicitTeam.Team0);
    expect(parseExplicitTeam("attackers")).toBe(ExplicitTeam.Team1);
    expect(TEAM_DESIGNATOR_INDICES.third_party).toBe(2);
  });

  it("parses qualified temporary compiled names", () => {
    expect(parseQualifiedTemporaryName("temporary_object_3")).toEqual({
      storage: "object",
      index: 3,
    });
    expect(parseQualifiedTemporaryName("temporary_0")).toBeUndefined();
  });
});
