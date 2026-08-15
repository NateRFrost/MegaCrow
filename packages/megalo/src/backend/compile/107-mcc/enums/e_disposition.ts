import { e_disposition } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  Disposition,
  type Disposition as DispositionName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const DISPOSITION_TO_BLF = {
  [Disposition.neutral]: e_disposition.neutral,
  [Disposition.friendly]: e_disposition.friendly,
  [Disposition.enemy]: e_disposition.enemy,
} as const satisfies Record<DispositionName, e_disposition>;

export const encodeDisposition = (value: DispositionName): e_disposition =>
  mapMegaloEnum(value, DISPOSITION_TO_BLF);
