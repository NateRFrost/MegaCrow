import { TeamOptionsModelOverrideType } from "../../../intermediate-representation/game/game_engine_default";

/** Block-level model override is a 3-bit integer in the BLF layout (not a typed enum). */
export const encodeTeamOptionsModelOverrideType = (
  value: TeamOptionsModelOverrideType
): number => {
  switch (value) {
    case TeamOptionsModelOverrideType.None:
      return 0;
    case TeamOptionsModelOverrideType.Spartan:
      return 1;
    case TeamOptionsModelOverrideType.Elite:
      return 2;
    case TeamOptionsModelOverrideType.SetByTeam:
      return 3;
    case TeamOptionsModelOverrideType.ByDesignator:
      return 4;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
