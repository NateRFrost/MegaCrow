import { defineActionHover } from "src/language-service/hover/registry";

export const setBoundaryHover = defineActionHover("set_boundary", {
  grammar:
    "action set_boundary <object> {none|sphere|cylinder|box} [width/radius] [length (box)] [neg_height] [pos_height] (feet)",
  params: ["object", "shape"],
});
