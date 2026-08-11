import { e_equipment_usage_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";

export const encodeEquipmentUsageSetting = (
  enabled: boolean
): e_equipment_usage_setting =>
  enabled ? e_equipment_usage_setting.on : e_equipment_usage_setting.off;
