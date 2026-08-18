import { type ObjectLists, ObjectListType } from "src/frontend/object-lists";
import equipment from "src/object-lists/haloreach/beta/default/equipment";
import grenades from "src/object-lists/haloreach/beta/default/grenades";
import hudWidgetIcons from "src/object-lists/haloreach/beta/default/hud_widget_icons";
import incidents from "src/object-lists/haloreach/beta/default/incidents";
import loadoutPalettes from "src/object-lists/haloreach/beta/default/loadout_palettes";
import loadouts from "src/object-lists/haloreach/beta/default/loadouts";
import objects from "src/object-lists/haloreach/beta/default/objects";
import strings from "src/object-lists/haloreach/beta/default/strings";
import vehicleSets from "src/object-lists/haloreach/beta/default/vehicle_sets";
import vehicles from "src/object-lists/haloreach/beta/default/vehicles";
import weaponSets from "src/object-lists/haloreach/beta/default/weapon_sets";
import weapons from "src/object-lists/haloreach/beta/default/weapons";

const objectLists = {
  [ObjectListType.Equipment]: equipment,
  [ObjectListType.Grenades]: grenades,
  [ObjectListType.HudWidgetIcons]: hudWidgetIcons,
  [ObjectListType.Incidents]: incidents,
  [ObjectListType.Loadouts]: loadouts,
  [ObjectListType.LoadoutPalettes]: loadoutPalettes,
  [ObjectListType.Objects]: objects,
  [ObjectListType.Strings]: strings,
  [ObjectListType.Vehicles]: vehicles,
  [ObjectListType.VehicleSets]: vehicleSets,
  [ObjectListType.Weapons]: weapons,
  [ObjectListType.WeaponSets]: weaponSets,
} satisfies ObjectLists;

export default objectLists;
