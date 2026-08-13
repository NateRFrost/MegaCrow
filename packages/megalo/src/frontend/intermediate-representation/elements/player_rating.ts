import { SyntaxKind } from "../../abstract-syntax-tree";
import type { PlayerRatingElementNode } from "../../abstract-syntax-tree/elements/player_rating";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { ElementLowerer } from ".";
import { dxAssertionScope } from "../diagnostics";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import type { GameEngineCustomVariant } from "../game/game_variant";
import { lowerConstantNumber } from "../parameters/constantNumber";
import { setField } from "../setField";

type PlayerRatings = NonNullable<GameEngineCustomVariant["playerRatings"]>;
type NumericPlayerRatingKey = Exclude<keyof PlayerRatings, "showInScoreboard">;

const NUMERIC_FIELDS: Record<string, NumericPlayerRatingKey> = {
  rating_scale: "ratingScale",
  kill_weight: "killWeight",
  assist_weight: "assistWeight",
  betrayal_weight: "betrayalWeight",
  death_weight: "deathWeight",
  normalize_by_max_kills: "normalizeByMaxKills",
  base_value: "base",
  range: "range",
  loss_scalar: "lossScalar",
  custom_stat_0: "customStat0",
  custom_stat_1: "customStat1",
  custom_stat_2: "customStat2",
  custom_stat_3: "customStat3",
  expansion_0: "expansion0",
  expansion_1: "expansion1",
};

const PLAYER_RATING_FIELD_NAMES = [
  ...Object.keys(NUMERIC_FIELDS),
  "show_in_scoreboard",
];

export const playerRatingLowerer: ElementLowerer<PlayerRatingElementNode> = (
  element,
  ctx
) => {
  if (ctx.ir.gameVariant.playerRatings === undefined) {
    ctx.ir.gameVariant.playerRatings = {};
  }
  const ratings = ctx.ir.gameVariant.playerRatings;

  for (const field of element.fields) {
    dxAssertionScope(ctx.diagnostics, () => {
      if (field.value.kind === SyntaxKind.INVALID) {
        return;
      }

      assertSyntaxKind(field.value, [
        SyntaxKind.INTEGER,
        SyntaxKind.FLOATING_POINT,
        SyntaxKind.REFERENCE,
      ]);
      const value = lowerConstantNumber(field.value, ctx);

      if (field.key === "show_in_scoreboard") {
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          ratings,
          "showInScoreboard",
          value.value !== 0,
          value.location
        );
        return;
      }

      const irKey = NUMERIC_FIELDS[field.key];
      if (irKey === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            PLAYER_RATING_FIELD_NAMES.map((name) => `'${name}'`),
            field.key
          ),
          field.value.location
        );
      }

      setField(
        ctx.ir.locations,
        ctx.diagnostics,
        ratings,
        irKey,
        value.value,
        value.location
      );
    });
  }
};
