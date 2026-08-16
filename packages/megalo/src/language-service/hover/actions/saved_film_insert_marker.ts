import { defineActionHover } from "src/language-service/hover/registry";

export const savedFilmInsertMarkerHover = defineActionHover(
  "saved_film_insert_marker",
  {
    grammar: "action saved_film_insert_marker <offset (s)> <label>",
    params: ["offset", "label"],
  }
);
