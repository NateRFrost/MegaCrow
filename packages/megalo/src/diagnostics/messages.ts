import type { SourceLocation } from "src/diagnostics/index";
import { SourceLocationType } from "src/diagnostics/index";
import { TokenKind } from "src/frontend/tokens";
import { formatAlternatives, translate } from "src/localization";

const expectedOneOf = (alternatives: readonly string[], got: string): string =>
  translate("expected_one_of", {
    expected: formatAlternatives(alternatives),
    got,
  });

const formatLocationRef = (location: SourceLocation): string | undefined => {
  if (location.type === SourceLocationType.SOURCE_CODE) {
    return `${location.start.line}:${location.start.column}`;
  }
  if (location.type === SourceLocationType.INCLUDE) {
    const { start } = location.declaration;
    return `${start.line}:${start.column}`;
  }
  return;
};

export const diagnosticMessages = {
  unusedValue(overriddenAt: SourceLocation): string {
    const location = formatLocationRef(overriddenAt);
    if (location === undefined) {
      return translate("unused_value");
    }
    return translate("unused_value_overridden_at", { location });
  },

  invalidParameterCount(expected: number, got: number): string {
    return translate("invalid_parameter_count", {
      expected: String(expected),
      got: String(got),
    });
  },

  expectedOneOf(alternatives: readonly string[], got: string): string {
    return expectedOneOf(alternatives, got);
  },

  expectedElement(value: string): string {
    return translate("unrecognized_element", { value });
  },

  expectedTokenKind(
    expected: TokenKind,
    kind: TokenKind,
    value: string
  ): string {
    // MegaloEdit.exe: Expected token of type <expected>, got one of type <type>: '<token>'
    const expectedName = TokenKind[expected] ?? String(expected);
    const kindName = TokenKind[kind] ?? String(kind);
    return translate("expected_token_kind", {
      expected: expectedName,
      kind: kindName,
      token: value,
    });
  },

  expectedEndBeforeEof(): string {
    // MegaloEdit.exe: Reached end of file reading string table
    return translate("expected_end_before_eof");
  },

  stringAlreadyDefined(language: string, identifier: string): string {
    // MegaloEdit.exe: String table for language <language> already has a string for token <identifier> defined
    return translate("string_already_defined", { language, identifier });
  },

  expectedNumberOrEnd(got: string): string {
    // MegaloEdit.exe: Expected 'number' or 'end' but got '<got>'
    return expectedOneOf(["'number'", "'end'"], got);
  },

  expectedConstantValue(got: string): string {
    // MegaloEdit.exe: Expected 'true', 'false', or numeric constant name; got '<got>'
    return expectedOneOf(
      ["'true'", "'false'", translate("numeric_constant_name")],
      got
    );
  },

  expectedVariableNetworkOrEnd(got: string): string {
    // MegaloEdit.exe: Expected 'local', 'networked', 'networked_high' or 'end' but got '<got>'
    return expectedOneOf(
      ["'local'", "'networked'", "'networked_high'", "'end'"],
      got
    );
  },

  expectedVariableType(got: string): string {
    // MegaloEdit.exe: Expected 'timer', 'number', 'team', 'player', or 'object', but got '<got>'
    return expectedOneOf(
      ["'timer'", "'number'", "'team'", "'player'", "'object'"],
      got
    );
  },

  expectedGameOptionElement(got: string): string {
    return expectedOneOf(
      [
        "'override'",
        "'option'",
        "'ranged_option'",
        "'player_traits'",
        "'lock'",
        "'hide'",
        "'end'",
      ],
      got
    );
  },

  invalidStringIdentifier(identifier: string): string {
    // MegaloEdit.exe: Invalid string identifier '<token>'
    return translate("invalid_string_identifier", { identifier });
  },

  expectedVariableReference(got: string): string {
    return expectedOneOf([translate("variable_reference")], got);
  },

  expectedParameterType(expected: string, got: string): string {
    return translate("expected_parameter_type", { expected, got });
  },

  unknownPlayerTrait(got: string): string {
    // MegaloEdit.exe: Expected player trait modifier, got '<token>'
    return translate("unknown_player_trait", { got });
  },

  unknownLoadoutProperty(got: string): string {
    return translate("unknown_loadout_property", { got });
  },

  unknownTeamsBlockProperty(got: string): string {
    return translate("unknown_teams_block_property", { got });
  },

  unknownTeamProperty(got: string): string {
    return translate("unknown_team_property", { got });
  },

  unknownEngineDataProperty(got: string): string {
    return translate("unknown_engine_data_property", { got });
  },

  unknownGameOptionOverride(got: string): string {
    return translate("unknown_game_option_override", { got });
  },

  unknownCondition(got: string): string {
    return `Unknown condition '${got}'.`;
  },

  unknownAction(got: string): string {
    return `Unknown action '${got}'.`;
  },

  unknownTriggerStatement(got: string): string {
    return translate("unrecognized_element", { value: got });
  },

  expectedTemporaryStorage(got: string): string {
    return expectedOneOf(["'number'", "'object'", "'team'", "'player'"], got);
  },

  expectedTemporaryInitial(): string {
    return "Expected temporary variable initial value.";
  },

  tooManyVariables(scope: string, type: string, limit: number): string {
    return translate("too_many_variables", {
      scope,
      type,
      limit: String(limit),
    });
  },

  tooManyHudWidgets(): string {
    return translate("too_many_hud_widgets");
  },

  tooManyTeamEntries(): string {
    return translate("too_many_team_entries");
  },

  tooManyMapPermissionExceptions(): string {
    return translate("too_many_map_permission_exceptions");
  },

  mapIdOutOfRange(): string {
    return translate("map_id_out_of_range");
  },

  tooManyObjectFilters(): string {
    return translate("too_many_object_filters");
  },

  tooManyGameStatistics(): string {
    return translate("too_many_game_statistics");
  },

  objectFilterUserDataOutOfRange(): string {
    return translate("object_filter_user_data_out_of_range");
  },

  objectFilterMinOutOfRange(): string {
    return translate("object_filter_min_out_of_range");
  },

  iconIndexOutOfRange(): string {
    return translate("icon_index_out_of_range");
  },

  objectTypeIndexOutOfRange(index: number, max: number): string {
    return translate("object_type_index_out_of_range", {
      index: String(index),
      max: String(max),
    });
  },

  fireteamCountOutOfRange(value: number, max: number): string {
    return translate("fireteam_count_out_of_range", {
      value: String(value),
      max: String(max),
    });
  },

  valueOutOfRangeIgnored(
    name: string,
    value: number,
    min: number,
    max: number
  ): string {
    return translate("value_out_of_range_ignored", {
      name,
      value: String(value),
      min: String(min),
      max: String(max),
    });
  },

  expectedLoadoutPaletteItemOrEnd(got: string): string {
    return translate("expected_parameter_type", {
      expected: "item or end",
      got,
    });
  },

  invalidObjectType(): string {
    // MegaloEdit.exe: This is not a valid object type.
    return "This is not a valid object type.";
  },

  duplicateDeclarationNameIgnored(kind: string, name: string): string {
    return translate("duplicate_declaration_name_ignored", { kind, name });
  },

  onlyOneBaseDirectiveAllowed(): string {
    return translate("only_one_base_directive_allowed");
  },

  elementNotAllowedInBaseDerived(element: string): string {
    return translate("element_not_allowed_in_base_derived", { element });
  },

  gameOptionNotAllowedInBaseDerived(entry: string): string {
    return translate("game_option_not_allowed_in_base_derived", { entry });
  },

  gameOptionOverrideRequiresBase(entry: string): string {
    return translate("game_option_override_requires_base", { entry });
  },

  lockingHidingPlayerTraitsNotSupported(): string {
    return translate("locking_hiding_player_traits_not_supported");
  },

  megacrowExtensionRequired(extension: string, sourceName: string): string {
    return translate("megacrow_extension_required", { extension, sourceName });
  },

  timerRateSnapped(got: string, used: string): string {
    return translate("timer_rate_snapped", { got, used });
  },

  teamColorOverridesDoNotApplyInMccMenus(): string {
    return translate("team_color_overrides_do_not_apply_in_mcc_menus");
  },
};
