import { e_boolean_trait } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";

export const encodeBooleanTrait = (enabled: boolean): e_boolean_trait =>
  enabled ? e_boolean_trait.on : e_boolean_trait.off;
