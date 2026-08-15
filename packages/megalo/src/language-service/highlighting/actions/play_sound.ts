import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import { emitLocation } from "src/language-service/highlighting/emit";
import {
  highlightOptionalEnum,
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `play_sound [everyone|player …|team …] [immediate] <sound>` */
export const highlightPlaySound = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  if (p.length === 0) {
    return;
  }
  const sound = p.at(-1);
  let i = 0;
  const first = p[0];
  if (
    first !== undefined &&
    first.kind === SyntaxKind.KEYWORD &&
    (first.value === "everyone" ||
      first.value === "player" ||
      first.value === "team")
  ) {
    i = highlightTeamOrPlayerTarget(out, p, 0);
  }
  highlightOptionalEnum(out, p, i, "immediate");
  if (
    sound !== undefined &&
    (sound.kind === SyntaxKind.KEYWORD || sound.kind === SyntaxKind.REFERENCE)
  ) {
    emitLocation(out, sound.location, "enumMember");
  } else {
    highlightStructural(out, sound);
  }
};
