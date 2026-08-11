import { e_boolean_trait } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";

export const encodeBooleanTrait = (enabled: boolean): e_boolean_trait =>
  enabled ? e_boolean_trait.on : e_boolean_trait.off;
