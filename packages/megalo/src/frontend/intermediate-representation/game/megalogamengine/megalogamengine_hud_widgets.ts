import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";

export const hudWidgetPosition = megaloEnum([
  "top_left",
  "top_center",
  "top_right",
  "high_left",
  "high_center",
  "high_right",
  "low_left",
  "low_center",
  "low_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
] as const);
export const HudWidgetPosition = hudWidgetPosition.enum;
export type HudWidgetPosition = MegaloEnumNames<typeof hudWidgetPosition>;

export const hudMeterInputType = megaloEnum([
  "none",
  { name: "off", aliasOf: "none" },
  "number",
  "timer",
] as const);
export const HUDMeterInputType = hudMeterInputType.enum;
export type HUDMeterInputType = MegaloEnumNames<typeof hudMeterInputType>;
