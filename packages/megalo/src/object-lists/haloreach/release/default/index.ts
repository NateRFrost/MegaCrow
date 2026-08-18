import { type ObjectLists, ObjectListType } from "src/frontend/object-lists";
import equipment from "src/object-lists/haloreach/release/default/equipment";
import grenades from "src/object-lists/haloreach/release/default/grenades";
import hudWidgetIcons from "src/object-lists/haloreach/release/default/hud_widget_icons";
import incidents from "src/object-lists/haloreach/release/default/incidents";
import loadouts from "src/object-lists/haloreach/release/default/loadouts";
import objects from "src/object-lists/haloreach/release/default/objects";
import strings from "src/object-lists/haloreach/release/default/strings";
import vehicleSets from "src/object-lists/haloreach/release/default/vehicle_sets";
import vehicles from "src/object-lists/haloreach/release/default/vehicles";
import weaponSets from "src/object-lists/haloreach/release/default/weapon_sets";
import weapons from "src/object-lists/haloreach/release/default/weapons";

const objectLists = {
  [ObjectListType.Equipment]: equipment,
  [ObjectListType.Grenades]: grenades,
  [ObjectListType.HudWidgetIcons]: hudWidgetIcons,
  [ObjectListType.Incidents]: incidents,
  [ObjectListType.Loadouts]: loadouts,
  [ObjectListType.Objects]: objects,
  [ObjectListType.Strings]: strings,
  [ObjectListType.Vehicles]: vehicles,
  [ObjectListType.VehicleSets]: vehicleSets,
  [ObjectListType.Weapons]: weapons,
  [ObjectListType.WeaponSets]: weaponSets,
} satisfies ObjectLists;

export default objectLists;
