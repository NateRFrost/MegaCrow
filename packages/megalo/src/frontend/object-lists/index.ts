import {
  type Diagnostics,
  type ObjectListLocation,
  SourceLocationType,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

// files that live under <megalo source folder>/object_lists/
export enum ObjectListType {
  // Halo: Reach - Pre-Release
  LoadoutPalettes = "loadout_palettes",

  Objects = "objects",
  Weapons = "weapons",
  Vehicles = "vehicles",
  Equipment = "equipment",
  Grenades = "grenades",
  Incidents = "incidents",
  Effects = "effects",
  Medals = "medals",
  Loadouts = "loadouts",
  HudWidgetIcons = "hud_widget_icons",
  WeaponSets = "weapon_sets",
  VehicleSets = "vehicle_sets",
  Strings = "strings",

  // Halo 4
  Ordnances = "ordnances",
  CustomApps = "customapps",
  EquipmentSets = "equipment_sets",
}

export const OBJECT_LIST_TYPES: readonly ObjectListType[] = [
  ObjectListType.Objects,
  ObjectListType.Weapons,
  ObjectListType.Vehicles,
  ObjectListType.Equipment,
  ObjectListType.Grenades,
  ObjectListType.Incidents,
  ObjectListType.Effects,
  ObjectListType.Medals,
  ObjectListType.Loadouts,
  ObjectListType.LoadoutPalettes,
  ObjectListType.HudWidgetIcons,
  ObjectListType.WeaponSets,
  ObjectListType.VehicleSets,
  ObjectListType.EquipmentSets,
  ObjectListType.Ordnances,
  ObjectListType.Strings,
];

export type ObjectListEntries = readonly string[];

export interface ObjectListFileSource {
  readonly entries: ObjectListEntries;
  readonly file: string;
}

export type ObjectListData = ObjectListEntries | ObjectListFileSource;

export type ObjectLists = Readonly<
  Partial<Record<ObjectListType, ObjectListData>>
>;

export const isObjectListFileSource = (
  data: ObjectListData | undefined
): data is ObjectListFileSource =>
  data !== undefined && !Array.isArray(data) && "entries" in data;

export const objectListEntries = (
  data: ObjectListData | undefined
): ObjectListEntries => {
  if (data === undefined) {
    return [];
  }
  return isObjectListFileSource(data) ? data.entries : data;
};

export const objectListSourceFile = (
  data: ObjectListData | undefined
): string | undefined => (isObjectListFileSource(data) ? data.file : undefined);

export const objectListLocation = (
  objectType: ObjectListType,
  index: number,
  file?: string
): ObjectListLocation => ({
  type: SourceLocationType.OBJECT_LIST,
  objectType,
  // `line` is the 0-based entry index (same as file line when blank lines count).
  source: { localOffset: -1, absoluteOffset: -1, line: index, column: 0 },
  ...(file === undefined ? {} : { file }),
});

export class ObjectListParser {
  public parse(
    text: string,
    diagnostics: Diagnostics,
    objectType: ObjectListType,
    file?: string
  ): string[] {
    const lines = text.split(/\r?\n/).map((line) => line.replace(/\r$/, ""));
    if (lines.length > 0 && lines.at(-1) === "") {
      lines.pop();
    }
    const objectList: string[] = [];
    const firstLineByName = new Map<string, number>();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      objectList.push(line);
      if (line.trim() === "") {
        continue;
      }
      const previousLine0 = firstLineByName.get(line);
      if (previousLine0 !== undefined) {
        diagnostics.addError(
          diagnosticMessages.objectListDuplicateEntry(
            line,
            previousLine0 + 1,
            i + 1
          ),
          objectListLocation(objectType, i, file)
        );
        // When we have a failure we dont compile,
        // so its fine to continue parsing the rest of the file.
        continue;
      }
      firstLineByName.set(line, i);
    }
    return objectList;
  }
}
