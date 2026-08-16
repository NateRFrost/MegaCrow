import { defineActionHover } from "src/language-service/hover/registry";

export const objectAttachHover = defineActionHover("object_attach", {
  grammar:
    "action object_attach <child_object> <parent_object> <offset_x> <offset_y> <offset_z> (feet) [absolute_orientation]",
  params: ["child_object", "parent_object", "offset_x", "offset_y", "offset_z"],
});
