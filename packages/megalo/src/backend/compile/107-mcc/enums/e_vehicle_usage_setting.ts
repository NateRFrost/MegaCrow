import { e_vehicle_usage_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  VehicleUsage,
  type VehicleUsage as VehicleUsageName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const VEHICLE_USAGE_TO_BLF = {
  [VehicleUsage.unchanged]: e_vehicle_usage_setting.unchanged,
  [VehicleUsage.none]: e_vehicle_usage_setting.none,
  [VehicleUsage.passenger]: e_vehicle_usage_setting.passenger,
  [VehicleUsage.driver]: e_vehicle_usage_setting.driver,
  [VehicleUsage.gunner]: e_vehicle_usage_setting.gunner,
  [VehicleUsage.not_passenger]: e_vehicle_usage_setting.not_passenger,
  [VehicleUsage.not_driver]: e_vehicle_usage_setting.not_driver,
  [VehicleUsage.not_gunner]: e_vehicle_usage_setting.not_gunner,
  [VehicleUsage.full]: e_vehicle_usage_setting.full,
} as const satisfies Record<VehicleUsageName, e_vehicle_usage_setting>;

export const encodeVehicleUsageSetting = (
  value: VehicleUsageName
): e_vehicle_usage_setting => mapMegaloEnum(value, VEHICLE_USAGE_TO_BLF);
