import type { MegaloVersion } from "../../../../version";
import type { MegaloCompilerContext } from "../../../../context";
import {
  type SourceCodeLocation,
  SourceLocationType,
} from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { type Token, TokenKind } from "../../../tokens";
import type { ParserContext } from "../../context";
import { type ASTNode, SyntaxKind } from "../../kinds";
import {
  type ASTParameterNode,
  parameterParserBuilder as buildParameterParser,
  KeywordParameter,
  ObjectListParameter,
  OptionalParameter,
  type ParameterParser,
  type ParameterSignature,
  type ParameterSlot,
  ParameterType,
  parseParameterValue,
} from "../../parameters";
import {
  type BeginStatementNode,
  type ForEachStatementNode,
  parseBegin,
  parseForEach,
} from "./index";

export type ActionStatementNode = ASTNode<SyntaxKind.ACTION> & {
  name: { value: string; location: SourceCodeLocation };
  parameters: ASTParameterNode[];
};

export type TriggerActionStatementNode =
  | ActionStatementNode
  | BeginStatementNode
  | ForEachStatementNode;

const locationSpan = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
});

const parseActionName = (
  ctx: ParserContext,
  anchor: Token
): ActionStatementNode["name"] | undefined => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return;
  }

  const nameToken = ctx.getToken();
  return {
    value: nameToken.value,
    location: nameToken.location,
  };
};

export const parseAction = (
  ctx: ParserContext,
  actionToken: Token
): TriggerActionStatementNode => {
  const name = parseActionName(ctx, actionToken);
  if (name === undefined) {
    return {
      kind: SyntaxKind.ACTION,
      name: {
        value: "",
        location: actionToken.location,
      },
      parameters: [],
      location: actionToken.location,
    };
  }

  if (name.value === "begin") {
    return parseBegin(ctx, actionToken);
  }

  if (name.value === "for_each") {
    return parseForEach(ctx, actionToken);
  }

  const parser = ctx.actionParserRepository.getParser(name.value);
  const parameters = parser
    ? parser(ctx, name.location)
    : (ctx.diagnostics.addError(
        diagnosticMessages.unknownAction(name.value),
        name.location
      ),
      []);

  const lastParameter = parameters.at(-1);
  const endLocation = lastParameter?.location ?? name.location;

  return {
    kind: SyntaxKind.ACTION,
    name,
    parameters,
    location: locationSpan(actionToken.location, endLocation),
  };
};

const MATH_OPERATION = ParameterType.MathOperation;

const BOOLEAN = ParameterType.Integer;

const ANY_VARIABLE = [
  ParameterType.Integer,
  ParameterType.Timer,
  ParameterType.Team,
  ParameterType.Player,
  ParameterType.Object,
] as const;

const VISIBILITY_KEYWORDS = [
  KeywordParameter("no_one"),
  KeywordParameter("everyone"),
  KeywordParameter("allies"),
  KeywordParameter("enemies"),
] as const;

const BOUNDARY_SHAPE_KEYWORDS = [
  KeywordParameter("none"),
  KeywordParameter("sphere"),
  KeywordParameter("cylinder"),
  KeywordParameter("box"),
] as const;

/** MegaloEdit: `none` | `all` | integer 0–3. */
const FIRETEAM_FILTER_SLOT = [
  KeywordParameter("none"),
  KeywordParameter("all"),
  ParameterType.Integer,
] as const;

/** MegaloEdit `ReadLoadoutPaletteType` enum names. */
const LOADOUT_PALETTE_TYPE_SLOT = [
  KeywordParameter("none"),
  KeywordParameter("spartan_tier1"),
  KeywordParameter("elite_tier1"),
  KeywordParameter("spartan_tier2"),
  KeywordParameter("elite_tier2"),
  KeywordParameter("spartan_tier3"),
  KeywordParameter("elite_tier3"),
] as const;

const GRENADE_TYPE_KEYWORDS = [
  KeywordParameter("frag"),
  KeywordParameter("plasma"),
] as const;

const PURCHASE_STATE_KEYWORDS = [
  KeywordParameter("alive"),
  KeywordParameter("dead"),
  KeywordParameter("both"),
] as const;

const NAVPOINT_PRIORITY_KEYWORDS = [
  KeywordParameter("low"),
  KeywordParameter("normal"),
  KeywordParameter("high"),
  KeywordParameter("blink"),
] as const;

const WEAPON_PICKUP_PRIORITY_KEYWORDS = [
  KeywordParameter("normal"),
  KeywordParameter("special"),
  KeywordParameter("auto"),
] as const;

const WEAPON_SLOT_KEYWORDS = [
  KeywordParameter("primary"),
  KeywordParameter("secondary"),
] as const;

const BIPED_WEAPON_SLOT_KEYWORDS = [
  KeywordParameter("primary"),
  KeywordParameter("secondary"),
  KeywordParameter("force"),
] as const;

const teamOrPlayerTargetSuffixes: ParameterSignature[] = [
  [KeywordParameter("everyone")],
  [KeywordParameter("player"), ParameterType.Player],
  [KeywordParameter("team"), ParameterType.Team],
];

const appendSignatures = (
  prefix: readonly ParameterSlot[],
  suffixes: readonly ParameterSignature[]
): ParameterSignature[] => suffixes.map((suffix) => [...prefix, ...suffix]);

const teamOrPlayerTargetSignatures = (
  prefix: readonly ParameterSlot[] = []
): ParameterSignature[] => appendSignatures(prefix, teamOrPlayerTargetSuffixes);

const visibilityFilterSignatures = (
  prefix: readonly ParameterSlot[],
  suffix: readonly ParameterSlot[] = []
): ParameterSignature[] => [
  [...prefix, VISIBILITY_KEYWORDS, ...suffix],
  [
    ...prefix,
    KeywordParameter("player"),
    ParameterType.Player,
    BOOLEAN,
    ...suffix,
  ],
];

const pairTeamOrPlayerTargetSignatures = (
  prefix: readonly ParameterSlot[],
  suffix: readonly ParameterSlot[] = []
): ParameterSignature[] => {
  const signatures: ParameterSignature[] = [];
  for (const cause of teamOrPlayerTargetSuffixes) {
    for (const effect of teamOrPlayerTargetSuffixes) {
      signatures.push([...prefix, ...cause, ...effect, ...suffix]);
    }
  }
  return signatures;
};

/** MegaloEdit: quoted object type, then `at`/`set`/flags in any order. */
const CREATE_OBJECT_OPTIONAL_KEYWORDS = new Set([
  "at",
  "set",
  "label",
  "never_garbage",
  "suppress_effect",
  "absolute_orientation",
  "offset",
  "variant",
]);

const createObjectLegacy: ParameterSignature = [
  ParameterType.Keyword,
  ParameterType.Object,
  ParameterType.Object,
];

const parseCreateObjectV73: ParameterParser = (ctx, anchor) => {
  const parameters: ASTParameterNode[] = [];

  const typeToken = ctx.peekToken();
  if (typeToken?.kind === TokenKind.QuotedString) {
    const consumed = ctx.getToken();
    const symbolId = ctx.symbolParser.lookupObjectListItem(
      ObjectListType.Objects,
      consumed.value
    );
    if (symbolId !== undefined) {
      ctx.symbolParser.recordReference(symbolId, consumed.location);
      parameters.push({
        kind: SyntaxKind.REFERENCE,
        identifier: consumed.value,
        symbolId,
        location: consumed.location,
      });
    } else {
      parameters.push({
        kind: SyntaxKind.KEYWORD,
        value: consumed.value,
        location: consumed.location,
      });
    }
  } else {
    // MegaloEdit requires a quoted type; also accept an unquoted name.
    parameters.push(
      parseParameterValue(
        ctx,
        anchor,
        ObjectListParameter(ObjectListType.Objects),
        ParameterType.Keyword
      )
    );
  }

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (
      token?.kind !== TokenKind.Identifier ||
      !CREATE_OBJECT_OPTIONAL_KEYWORDS.has(token.value)
    ) {
      break;
    }

    const keywordToken = ctx.getToken();
    parameters.push({
      kind: SyntaxKind.KEYWORD,
      value: keywordToken.value,
      location: keywordToken.location,
    });

    switch (keywordToken.value) {
      case "at":
      case "set":
        parameters.push(
          parseParameterValue(ctx, keywordToken.location, ParameterType.Object)
        );
        break;
      case "label":
        parameters.push(
          parseParameterValue(
            ctx,
            keywordToken.location,
            ParameterType.ObjectFilter
          )
        );
        break;
      case "offset":
        parameters.push(
          parseParameterValue(ctx, keywordToken.location, ParameterType.Integer),
          parseParameterValue(ctx, keywordToken.location, ParameterType.Integer),
          parseParameterValue(ctx, keywordToken.location, ParameterType.Integer)
        );
        break;
      case "variant":
        parameters.push(
          parseParameterValue(
            ctx,
            keywordToken.location,
            ParameterType.Keyword,
            ParameterType.QuotedString
          )
        );
        break;
      default:
        break;
    }
  }

  return parameters;
};

/** MegaloEdit: positional custom-variable dimensions after shape (no keywords). */
const setBoundarySignatures: ParameterSignature[] = [
  [ParameterType.Object, KeywordParameter("none")],
  [ParameterType.Object, KeywordParameter("sphere"), ParameterType.Integer],
  [
    ParameterType.Object,
    KeywordParameter("cylinder"),
    ParameterType.Integer,
    ParameterType.Integer,
    ParameterType.Integer,
  ],
  [
    ParameterType.Object,
    KeywordParameter("box"),
    ParameterType.Integer,
    ParameterType.Integer,
    ParameterType.Integer,
    ParameterType.Integer,
  ],
];

const setBoundarySignatureLegacyKeywords: ParameterSignature = [
  ParameterType.Object,
  BOUNDARY_SHAPE_KEYWORDS,
  OptionalParameter("width", ParameterType.Integer),
  OptionalParameter("radius", ParameterType.Integer),
  OptionalParameter("length", ParameterType.Integer),
  OptionalParameter("neg_height", ParameterType.Integer),
  OptionalParameter("pos_height", ParameterType.Integer),
];

const playSoundSignatures: ParameterSignature[] =
  teamOrPlayerTargetSignatures().map((signature) => [
    ...signature,
    OptionalParameter("immediate"),
    ParameterType.String,
  ]);

const parseNavpointSetIcon = (
  allowCoopSpawning: boolean
): ParameterParser => {
  return (ctx, anchor) => {
    const object = parseParameterValue(ctx, anchor, ParameterType.Object);
    const iconFirst = ctx.peekToken();
    if (
      allowCoopSpawning &&
      iconFirst?.kind === TokenKind.Identifier &&
      iconFirst.value === "coop" &&
      ctx.peekToken(1)?.kind === TokenKind.Identifier &&
      ctx.peekToken(1)?.value === "spawning"
    ) {
      const coop = ctx.getToken();
      const spawning = ctx.getToken();
      const icon: ASTParameterNode = {
        kind: SyntaxKind.KEYWORD,
        value: "coop spawning",
        location: locationSpan(coop.location, spawning.location),
      };
      return [object, icon];
    }

    const icon = parseParameterValue(ctx, anchor, ParameterType.Keyword);
    if (icon.kind === SyntaxKind.KEYWORD && icon.value === "num") {
      const number = parseParameterValue(ctx, anchor, ParameterType.Integer);
      return [object, icon, number];
    }
    return [object, icon];
  };
};

export class ActionParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: string, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(
    megaloVersion: MegaloVersion,
    megacrowExtensions: MegaloCompilerContext["megacrowExtensions"]
  ) {
    this.registerParser(
      "set_score",
      buildParameterParser(
        ...teamOrPlayerTargetSignatures([MATH_OPERATION, ParameterType.Integer])
      )
    );

    if (megaloVersion.version >= 73) {
      this.registerParser("create_object", parseCreateObjectV73);
    } else {
      this.registerParser(
        "create_object",
        buildParameterParser(createObjectLegacy)
      );
    }

    this.registerParser(
      "delete_object",
      buildParameterParser([ParameterType.Object])
    );

    this.registerParser(
      "navpoint_set_visible",
      buildParameterParser(
        ...visibilityFilterSignatures([ParameterType.Object])
      )
    );

    // Longer form first: `num` requires a following number variable.
    // Megalo Headache #3: optional `coop spawning` when extension enabled.
    this.registerParser(
      "navpoint_set_icon",
      parseNavpointSetIcon(megacrowExtensions.coopSpawningWaypointIcon)
    );

    this.registerParser(
      "navpoint_set_priority",
      buildParameterParser([ParameterType.Object, NAVPOINT_PRIORITY_KEYWORDS])
    );

    this.registerParser(
      "navpoint_set_timer",
      buildParameterParser([ParameterType.Object, ParameterType.Timer])
    );

    this.registerParser(
      "navpoint_set_visible_range",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Integer,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "set",
      buildParameterParser([ANY_VARIABLE, MATH_OPERATION, ANY_VARIABLE])
    );

    this.registerParser(
      "set_boundary",
      buildParameterParser(
        ...setBoundarySignatures,
        setBoundarySignatureLegacyKeywords
      )
    );

    this.registerParser(
      "apply_player_traits",
      buildParameterParser([ParameterType.Player, ParameterType.PlayerTraits])
    );

    this.registerParser(
      "set_pickup_filter",
      buildParameterParser(
        ...visibilityFilterSignatures([ParameterType.Object])
      )
    );

    this.registerParser(
      "set_respawn_filter",
      buildParameterParser(
        ...visibilityFilterSignatures([ParameterType.Object])
      )
    );

    this.registerParser(
      "set_fireteam_respawn_filter",
      buildParameterParser([ParameterType.Object, FIRETEAM_FILTER_SLOT])
    );

    // MegaloEdit: timer is omitted when the filter is `no_one`.
    this.registerParser(
      "set_progress_bar",
      buildParameterParser(
        [ParameterType.Object, KeywordParameter("no_one")],
        ...visibilityFilterSignatures(
          [ParameterType.Object],
          [ParameterType.Timer]
        )
      )
    );

    this.registerParser(
      "hud_post_message",
      buildParameterParser(
        ...teamOrPlayerTargetSignatures().map((signature) => [
          ...signature,
          ParameterType.String,
          ParameterType.DynamicString,
        ])
      )
    );

    this.registerParser(
      "timer_set_rate",
      buildParameterParser([ParameterType.Timer, ParameterType.Float])
    );

    this.registerParser(
      "print_variable",
      buildParameterParser([ParameterType.DynamicString])
    );

    this.registerParser(
      "get_player_holding_object",
      buildParameterParser([ParameterType.Object, ParameterType.Player])
    );

    this.registerParser(
      "for_each",
      buildParameterParser([ParameterType.Keyword])
    );

    this.registerParser("end_round", buildParameterParser());

    this.registerParser("begin", buildParameterParser());

    this.registerParser(
      "boundary_set_visible",
      buildParameterParser(
        ...visibilityFilterSignatures([ParameterType.Object])
      )
    );

    this.registerParser(
      "object_destroy",
      buildParameterParser([
        ParameterType.Object,
        OptionalParameter("no_statistics"),
      ])
    );

    this.registerParser(
      "object_set_invincibility",
      buildParameterParser([ParameterType.Object, BOOLEAN])
    );

    this.registerParser(
      "random",
      buildParameterParser([ParameterType.Integer, ParameterType.Integer])
    );

    this.registerParser("break_into_debugger", buildParameterParser());

    this.registerParser(
      "object_get_orientation",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "object_get_velocity",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "player_death_get_killing_player",
      buildParameterParser([ParameterType.Player, ParameterType.Player])
    );

    this.registerParser(
      "player_death_get_damage_type",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "player_death_get_special_type",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "debugging_enable_tracing",
      buildParameterParser([BOOLEAN])
    );

    this.registerParser(
      "object_attach",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Object,
        ParameterType.Integer,
        ParameterType.Integer,
        ParameterType.Integer,
        OptionalParameter("absolute_orientation"),
      ])
    );

    this.registerParser(
      "object_detach",
      buildParameterParser([ParameterType.Object])
    );

    this.registerParser(
      "player_get_place",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "team_get_place",
      buildParameterParser([ParameterType.Team, ParameterType.Integer])
    );

    this.registerParser(
      "player_get_killing_spree_count",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "player_adjust_money",
      buildParameterParser([
        ParameterType.Player,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "player_enable_purchases",
      buildParameterParser([
        ParameterType.Player,
        PURCHASE_STATE_KEYWORDS,
        BOOLEAN,
      ])
    );

    this.registerParser(
      "player_get_vehicle",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "player_set_vehicle",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "player_set_unit",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "timer_reset",
      buildParameterParser([ParameterType.Timer])
    );

    this.registerParser(
      "weapon_set_pickup_priority",
      buildParameterParser([
        ParameterType.Object,
        WEAPON_PICKUP_PRIORITY_KEYWORDS,
      ])
    );

    this.registerParser(
      "object_bounce",
      buildParameterParser([ParameterType.Object])
    );

    this.registerParser(
      "hud_widget_set_text",
      buildParameterParser([
        ParameterType.HudWidget,
        ParameterType.DynamicString,
      ])
    );

    this.registerParser(
      "hud_widget_set_value",
      buildParameterParser([
        ParameterType.HudWidget,
        ParameterType.DynamicString,
      ])
    );

    this.registerParser(
      "hud_widget_set_meter",
      buildParameterParser(
        [ParameterType.HudWidget, KeywordParameter("off")],
        [ParameterType.HudWidget, ParameterType.Timer],
        [ParameterType.HudWidget, ParameterType.Integer, ParameterType.Integer]
      )
    );

    this.registerParser(
      "hud_widget_set_icon",
      buildParameterParser([
        ParameterType.HudWidget,
        [
          KeywordParameter("none"),
          ObjectListParameter(ObjectListType.HudWidgetIcons),
        ],
      ])
    );

    this.registerParser(
      "hud_widget_set_visibility",
      buildParameterParser([
        ParameterType.HudWidget,
        ParameterType.Player,
        BOOLEAN,
      ])
    );

    this.registerParser(
      "play_sound",
      buildParameterParser(...playSoundSignatures)
    );

    this.registerParser(
      "object_set_scale",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "navpoint_set_text",
      buildParameterParser([ParameterType.Object, ParameterType.DynamicString])
    );

    this.registerParser(
      "object_get_shield",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "object_get_health",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "player_set_objective",
      buildParameterParser([ParameterType.Player, ParameterType.DynamicString])
    );

    // MegaloEdit / HREK: two args only. Docs grammar wrongly listed a third
    // engine_icon_index (copied onto both allegiance actions); requiring it
    // made the lenient parser eat the next `action` token and desync triggers.
    this.registerParser(
      "player_set_objective_allegiance",
      buildParameterParser([ParameterType.Player, ParameterType.DynamicString])
    );

    this.registerParser(
      "player_set_objective_allegiance_icon",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "team_set_coop_spawning",
      buildParameterParser([ParameterType.Team, BOOLEAN])
    );

    this.registerParser(
      "team_set_primary_respawn_object",
      buildParameterParser([ParameterType.Team, ParameterType.Object])
    );

    this.registerParser(
      "player_set_primary_respawn_object",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "player_get_fireteam_index",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "player_set_fireteam_index",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "object_adjust_shield",
      buildParameterParser([
        ParameterType.Object,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "object_adjust_health",
      buildParameterParser([
        ParameterType.Object,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "object_get_distance",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Object,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "object_adjust_maximum_shield",
      buildParameterParser([
        ParameterType.Object,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "object_adjust_maximum_health",
      buildParameterParser([
        ParameterType.Object,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "player_set_requisition_palette",
      buildParameterParser([
        ParameterType.Player,
        ParameterType.RequisitionPalette,
      ])
    );

    this.registerParser(
      "device_set_power",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "device_get_power",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "device_set_position",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "device_get_position",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "adjust_grenades",
      buildParameterParser([
        ParameterType.Player,
        GRENADE_TYPE_KEYWORDS,
        MATH_OPERATION,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "submit_incident",
      buildParameterParser(
        ...pairTeamOrPlayerTargetSignatures([
          ObjectListParameter(ObjectListType.Incidents),
        ])
      )
    );

    this.registerParser(
      "submit_incident_with_custom_value",
      buildParameterParser(
        ...pairTeamOrPlayerTargetSignatures(
          [ObjectListParameter(ObjectListType.Incidents)],
          [ParameterType.Integer]
        )
      )
    );

    // MegaloEdit ReadLoadoutPaletteType: none|spartan_tier1|elite_tier1|…
    this.registerParser(
      "set_loadout_palette",
      buildParameterParser(
        [
          KeywordParameter("player"),
          ParameterType.Player,
          LOADOUT_PALETTE_TYPE_SLOT,
        ],
        [
          KeywordParameter("team"),
          ParameterType.Team,
          LOADOUT_PALETTE_TYPE_SLOT,
        ]
      )
    );

    this.registerParser(
      "device_set_position_track",
      buildParameterParser([
        ParameterType.Object,
        [ParameterType.Keyword, ParameterType.QuotedString],
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "device_animate_position",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Integer,
        ParameterType.Integer,
        ParameterType.Integer,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "device_set_position_immediate",
      buildParameterParser([ParameterType.Object, ParameterType.Integer])
    );

    this.registerParser(
      "saved_film_insert_marker",
      buildParameterParser([ParameterType.Integer, ParameterType.DynamicString])
    );

    this.registerParser(
      "respawn_zone_enable",
      buildParameterParser([ParameterType.Object, BOOLEAN])
    );

    this.registerParser(
      "player_get_weapon",
      buildParameterParser([
        ParameterType.Player,
        WEAPON_SLOT_KEYWORDS,
        ParameterType.Object,
      ])
    );

    this.registerParser(
      "player_get_equipment",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "object_set_never_garbage",
      buildParameterParser([ParameterType.Object, BOOLEAN])
    );

    this.registerParser(
      "player_get_target_object",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "create_tunnel",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Object,
        ParameterType.Keyword,
        ParameterType.Integer,
        ParameterType.Object,
      ])
    );

    this.registerParser(
      "debug_force_player_view_count",
      buildParameterParser([ParameterType.Integer])
    );

    this.registerParser(
      "player_pick_up_weapon",
      buildParameterParser([ParameterType.Player, ParameterType.Object])
    );

    this.registerParser(
      "player_set_coop_spawning",
      buildParameterParser([ParameterType.Player, BOOLEAN])
    );

    this.registerParser(
      "object_set_orientation",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Keyword,
        OptionalParameter("absolute_orientation"),
      ])
    );

    this.registerParser(
      "object_face_object",
      buildParameterParser([
        ParameterType.Object,
        ParameterType.Object,
        OptionalParameter(
          "offset",
          ParameterType.Integer,
          ParameterType.Integer,
          ParameterType.Integer
        ),
      ])
    );

    this.registerParser(
      "biped_give_weapon",
      buildParameterParser([
        ParameterType.Object,
        [
          ObjectListParameter(ObjectListType.Objects),
          ParameterType.QuotedString,
          ParameterType.Keyword,
        ],
        BIPED_WEAPON_SLOT_KEYWORDS,
      ])
    );

    this.registerParser(
      "biped_drop_weapon",
      buildParameterParser([
        ParameterType.Object,
        WEAPON_SLOT_KEYWORDS,
        OptionalParameter("delete_on_drop"),
      ])
    );

    this.registerParser(
      "set_scenario_interpolator_state",
      buildParameterParser([ParameterType.Integer, BOOLEAN])
    );

    this.registerParser(
      "get_random_object",
      buildParameterParser([
        ParameterType.ObjectFilter,
        ParameterType.Object,
        ParameterType.Object,
      ])
    );

    this.registerParser(
      "game_grief_record_custom_penalty",
      buildParameterParser([ParameterType.Player, ParameterType.Integer])
    );

    this.registerParser(
      "boundary_set_player_color",
      buildParameterParser([ParameterType.Object, ParameterType.Player])
    );

    this.registerParser(
      "hs_function_call",
      buildParameterParser([ParameterType.Keyword])
    );

    this.registerParser(
      "get_button_time",
      buildParameterParser([
        ParameterType.Player,
        ParameterType.Keyword,
        ParameterType.Integer,
      ])
    );

    this.registerParser(
      "team_set_vehicle_spawning",
      buildParameterParser([ParameterType.Team, BOOLEAN])
    );

    this.registerParser(
      "player_set_vehicle_spawning",
      buildParameterParser([ParameterType.Player, BOOLEAN])
    );

    this.registerParser(
      "set_player_respawn_vehicle",
      buildParameterParser([ParameterType.Object, ParameterType.Player])
    );

    this.registerParser(
      "set_team_respawn_vehicle",
      buildParameterParser([ParameterType.Object, ParameterType.Team])
    );

    this.registerParser(
      "hide_object",
      buildParameterParser([ParameterType.Object, BOOLEAN])
    );
  }

  public constructor(frontend: MegaloCompilerContext) {
    this.registerParsers(frontend.megaloVersion, frontend.megacrowExtensions);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}
