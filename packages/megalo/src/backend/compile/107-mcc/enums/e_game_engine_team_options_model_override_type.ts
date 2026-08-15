import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  TeamOptionsModelOverrideType,
  type TeamOptionsModelOverrideType as TeamOptionsModelOverrideTypeName,
} from "src/frontend/intermediate-representation/game/game_engine_default";

/** Block-level model override is a 3-bit integer in the BLF layout (not a typed enum). */
const TEAM_OPTIONS_MODEL_OVERRIDE_TYPE_TO_BLF = {
  [TeamOptionsModelOverrideType.none]: 0,
  [TeamOptionsModelOverrideType.spartan]: 1,
  [TeamOptionsModelOverrideType.elite]: 2,
  [TeamOptionsModelOverrideType.set_by_team]: 3,
  [TeamOptionsModelOverrideType.by_designator]: 4,
} as const satisfies Record<TeamOptionsModelOverrideTypeName, number>;

export const encodeTeamOptionsModelOverrideType = (
  value: TeamOptionsModelOverrideTypeName
): number => mapMegaloEnum(value, TEAM_OPTIONS_MODEL_OVERRIDE_TYPE_TO_BLF);
