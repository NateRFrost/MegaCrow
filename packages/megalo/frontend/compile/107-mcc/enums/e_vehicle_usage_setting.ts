import { e_vehicle_usage_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { VehicleUsage } from "../../../intermediate-representation/game/game_engine_player_traits";

export const encodeVehicleUsageSetting = (
  value: VehicleUsage
): e_vehicle_usage_setting => {
  switch (value) {
    case VehicleUsage.Unchanged:
      return e_vehicle_usage_setting.unchanged;
    case VehicleUsage.None:
      return e_vehicle_usage_setting.none;
    case VehicleUsage.Full:
      return e_vehicle_usage_setting.full;
    case VehicleUsage.Passenger:
      return e_vehicle_usage_setting.passenger;
    case VehicleUsage.NotPassenger:
      return e_vehicle_usage_setting.not_passenger;
    case VehicleUsage.Driver:
      return e_vehicle_usage_setting.driver;
    case VehicleUsage.Gunner:
      return e_vehicle_usage_setting.gunner;
    case VehicleUsage.NotDriver:
      return e_vehicle_usage_setting.not_driver;
    case VehicleUsage.NotGunner:
      return e_vehicle_usage_setting.not_gunner;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
