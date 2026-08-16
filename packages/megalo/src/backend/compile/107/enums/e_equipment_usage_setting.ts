import { e_equipment_usage_setting } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";

export const encodeEquipmentUsageSetting = (
  enabled: boolean
): e_equipment_usage_setting =>
  enabled ? e_equipment_usage_setting.on : e_equipment_usage_setting.off;
