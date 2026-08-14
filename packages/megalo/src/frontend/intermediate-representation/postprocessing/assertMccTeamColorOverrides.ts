import { UNKNOWN_LOCATION } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { IR } from "src/frontend/intermediate-representation";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters";

/**
 * MCC menus ignore team color overrides; warn when any were set so authors
 * know the color only shows in-game.
 */
export function assertMccTeamColorOverrides(
  ir: IR,
  ctx: ElementLowerContext
): void {
  if (ctx.frontend.megaloVersion.flavour !== "mcc") {
    return;
  }

  const teams = ir.gameVariant.baseVariant.teamOptions.teams ?? [];
  for (const team of teams) {
    if (team.teamColor === undefined) {
      continue;
    }
    const location = ir.locations.get(team, "teamColor") ?? UNKNOWN_LOCATION;
    ctx.diagnostics.addWarning(
      diagnosticMessages.teamColorOverridesDoNotApplyInMccMenus(),
      location
    );
  }
}
