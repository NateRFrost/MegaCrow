import { e_navpoint_priority } from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
import {
  NavpointPriority,
  type NavpointPriority as NavpointPriorityName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const NAVPOINT_PRIORITY_TO_BLF = {
  [NavpointPriority.low]: e_navpoint_priority.low,
  [NavpointPriority.normal]: e_navpoint_priority.normal,
  [NavpointPriority.high]: e_navpoint_priority.high,
  [NavpointPriority.blink]: e_navpoint_priority.blink,
} as const satisfies Record<NavpointPriorityName, e_navpoint_priority>;

export const encodeNavpointPriority = (
  value: NavpointPriorityName
): e_navpoint_priority => mapMegaloEnum(value, NAVPOINT_PRIORITY_TO_BLF);
