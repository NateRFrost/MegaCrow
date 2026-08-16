import { e_equipment_usage_setting } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";

export const encodeEquipmentUsageSetting = (
  enabled: boolean
): e_equipment_usage_setting =>
  enabled ? e_equipment_usage_setting.on : e_equipment_usage_setting.off;
