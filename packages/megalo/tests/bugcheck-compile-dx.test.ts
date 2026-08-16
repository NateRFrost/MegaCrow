import { compileSource } from "src/compile-source";
import { DiagnosticSeverity, SourceLocationType } from "src/diagnostics";
import { MEGALO_VERSIONS } from "src/version";
import { describe, expect, it } from "vitest";

const src = `;monitor spawn
trigger player
    condition not if current_player.player_money equal_to none
    condition player_is_spartan current_player or
    condition player_is_elite current_player

    temporary object new_monitor none
    action create_object "monitor" at current_player set new_monitor never_garbage
    action player_set_unit current_player new_monitor
end

trigger player
    condition if current_player.player_money equal_to none

    temporary object new_monitor none
    action create_object "monitor" at initial_spawn_point set new_monitor never_garbage
    action player_set_unit current_player new_monitor
end
`;

describe("bugcheck compile diagnostics", () => {
  it("rejects unknown player_money member and object-type-as-ref", async () => {
    const result = await compileSource(src, {
      version: MEGALO_VERSIONS["107-mcc"],
      fileType: "mglo",
    });
    const errors = result.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(result.bytes).toBeUndefined();
    expect(errors.map((d) => d.message)).toEqual([
      "Unresolved identifier current_player.'player_money'.",
      "Unresolved identifier current_player.'player_money'.",
      "'initial_spawn_point' is an object type (use create_object \"initial_spawn_point\" …), not an object reference.",
    ]);
    for (const error of errors) {
      expect(error.location.type).toBe(SourceLocationType.SOURCE_CODE);
    }
  });

  it("accepts current_player.money as PlayerMoney", async () => {
    const result = await compileSource(
      `trigger player
    action set current_player.money = 0
end
`,
      {
        version: MEGALO_VERSIONS["107-mcc"],
        fileType: "mglo",
      }
    );
    const errors = result.diagnostics.filter(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    expect(errors).toEqual([]);
    expect(result.bytes).toBeDefined();
  });
});
