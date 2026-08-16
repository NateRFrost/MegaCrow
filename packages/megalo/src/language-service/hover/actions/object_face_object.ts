import { defineActionHover } from "src/language-service/hover/registry";

export const objectFaceObjectHover = defineActionHover("object_face_object", {
  grammar:
    "action object_face_object <object> <target> [offset <x> <y> <z> (feet)]",
  params: ["object", "target", "x", "y", "z"],
});
