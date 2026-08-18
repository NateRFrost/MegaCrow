export type RequisitionPaletteBaseline = "empty" | "spartan" | "elite" | "full";

export type RequisitionItemState = "enabled" | "disabled" | "full";

export interface RequisitionPaletteItem {
  /** Numeric cost when present (`item "needler" 100`). */
  cost?: number;
  /** Absolute object type index from objects list / quoted name resolution. */
  objectTypeIndex: number;
  /** Identifier state when no numeric cost is given. */
  state?: RequisitionItemState;
}

export interface RequisitionPalette {
  baseline: RequisitionPaletteBaseline;
  items: RequisitionPaletteItem[];
  name: string;
}
