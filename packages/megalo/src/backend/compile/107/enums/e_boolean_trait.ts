import { e_boolean_trait } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";

export const encodeBooleanTrait = (enabled: boolean): e_boolean_trait =>
  enabled ? e_boolean_trait.on : e_boolean_trait.off;
