import { describe, expect, it } from "vitest";
import { ParserContext } from "../../../../src/frontend/abstract-syntax-tree/context";
import {
  KeywordParameter,
  ObjectListParameter,
  OptionalParameter,
  ParameterType,
  parameterParserBuilder,
  type ParameterParser,
} from "../../../../src/frontend/abstract-syntax-tree/parameters";
import {
  BUILT_IN_LOCATION,
  Diagnostics,
  type SourceCodeLocation,
  SourceLocationType,
} from "../../../../src/diagnostics";
import { ExplicitPlayer } from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import {
  CustomTimerType,
  CustomVariableType,
  ObjectReferenceType,
  PlayerReferenceType,
} from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import type { ParameterLoweringContext } from "../../../../src/frontend/intermediate-representation/parameters";
import {
  buildParameterLowerer,
  CustomVariableKind,
  customTimerParam,
  customVariableParam,
  keywordParam,
  numberParam,
  objectParam,
  objectTypeParam,
  OptionalParam,
  playerParam,
  stringParam,
} from "../../../../src/frontend/intermediate-representation/parameters/lowering";
import { ObjectListType } from "../../../../src/frontend/object-lists";
import { buildVariableSlotMap } from "../../../../src/frontend/intermediate-representation/preprocessing/symbols";
import {
  SymbolBinder,
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../../src/frontend/symbol-table";
import { Lexer } from "../../../../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../../../../src/version";
import { MegaloCompilerContext } from "../../../../src/context";

const version = MEGALO_VERSIONS["107-mcc"];
const frontend = new MegaloCompilerContext(version);

const loc = (line = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: 0,
    absoluteOffset: 0,
    line,
    column: 1,
  },
  end: {
    localOffset: 0,
    absoluteOffset: 0,
    line,
    column: 2,
  },
});

type Harness = {
  nodes: ReturnType<ParameterParser>;
  ctx: ParameterLoweringContext;
  diagnostics: Diagnostics;
  symbolTable: ReturnType<SymbolBinder["getSymbolTable"]>;
};

const setup = (
  source: string,
  parser: ParameterParser,
  options?: {
    objectLists?: Partial<Record<ObjectListType, string[]>>;
    beforeParse?: (ctx: ParserContext) => void;
  }
): Harness => {
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const symbolBinder = new SymbolBinder(frontend, diagnostics);
  const parseCtx = new ParserContext(tokens, frontend,
    diagnostics,
    symbolBinder,
    options?.objectLists ?? {}
  );

  parseCtx.symbolParser.addVariableToScope({
    name: "meter_value",
    type: VariableType.Number,
    declaration: loc(),
    scope: VariableScope.Global,
  });
  parseCtx.symbolParser.addVariableToScope({
    name: "meter_max",
    type: VariableType.Number,
    declaration: loc(),
    scope: VariableScope.Global,
  });
  parseCtx.symbolParser.addVariableToScope({
    name: "my_timer",
    type: VariableType.Timer,
    declaration: loc(),
    scope: VariableScope.Global,
  });
  parseCtx.symbolParser.addVariableToScope({
    name: "the_hill",
    type: VariableType.Object,
    declaration: loc(),
    scope: VariableScope.Global,
  });
  parseCtx.symbolParser.addVariableToScope({
    name: "player_number",
    type: VariableType.Number,
    declaration: loc(),
    scope: VariableScope.Player,
  });
  parseCtx.symbolParser.addConstantToScope({
    name: "k_max_count",
    declaration: loc(),
    value: 42,
  });
  parseCtx.symbolParser.addStringToScope({
    name: "you_are_vip",
    language: "english",
    content: "You are the VIP",
    declaration: loc(),
  });
  parseCtx.symbolParser.addHudWidgetToScope("health_meter", loc());
  parseCtx.symbolParser.addGameOptionToScope({
    name: "my_option",
    type: VariableType.Number,
    declaration: loc(),
  });
  parseCtx.symbolParser.addGameStatToScope("kills", loc());

  if (parseCtx.symbolParser.lookupSymbol("current_player") === undefined) {
    parseCtx.symbolParser.addVariableToScope({
      name: "current_player",
      type: VariableType.Player,
      declaration: BUILT_IN_LOCATION,
      scope: VariableScope.Global,
    });
  }

  options?.beforeParse?.(parseCtx);

  const nodes = parser(parseCtx, tokens[0]?.location ?? loc());
  const symbolTable = symbolBinder.getSymbolTable();
  const variableSlots = buildVariableSlotMap(
    frontend,
    symbolTable,
    diagnostics
  );
  const ir = new Lowerer(frontend).lower(
    { failed: false, comments: [], elements: [], symbolTable },
    diagnostics
  );

  return {
    nodes,
    diagnostics,
    symbolTable,
    ctx: {
      symbolTable,
      variableSlots,
      ir,
      diagnostics,
      loadoutsByName: new Map(),
      loadoutPalettesByName: new Map(),
      variableDeclarations: new Map(),
      frontend,
      inPregameTrigger: false,
    },
  };
};

describe("buildParameterLowerer", () => {
  it("lowers integer and constant numbers", () => {
    const parser = parameterParserBuilder([
      ParameterType.Integer,
      ParameterType.Integer,
    ]);
    const { nodes, ctx } = setup("10 k_max_count", parser);
    const result = buildParameterLowerer([
      numberParam("a"),
      numberParam("b"),
    ])(nodes, ctx);

    expect(result.byName("a")?.value).toBe(10);
    expect(result.byName("b")?.value).toBe(42);
    expect(result[0]!.name).toBe("a");
  });

  it("lowers float literals", () => {
    const { nodes, ctx } = setup(
      "1.5",
      parameterParserBuilder([ParameterType.Integer])
    );
    const result = buildParameterLowerer([numberParam("value")])(nodes, ctx);
    expect(result.byName("value")?.value).toBe(1.5);
  });

  it("lowers quoted strings and string symbols into the script string table", () => {
    const { nodes, ctx } = setup(
      '"Hello" you_are_vip',
      parameterParserBuilder([ParameterType.QuotedString, ParameterType.String])
    );
    const result = buildParameterLowerer([
      stringParam("literal"),
      stringParam("named"),
    ])(nodes, ctx);

    expect(Number(result.byName("literal")?.value)).toBe(0);
    expect(Number(result.byName("named")?.value)).toBe(1);
    expect(ctx.ir.gameVariant.scriptStrings.toArray()).toHaveLength(2);
  });

  it("maps built-in game options to specific CustomVariableType values", () => {
    const { nodes, ctx } = setup(
      "score_to_win_round",
      parameterParserBuilder([ParameterType.Integer])
    );
    const result = buildParameterLowerer([
      customVariableParam("opt", CustomVariableKind.GameOption),
    ])(nodes, ctx);
    expect(
      (result.byName("opt")?.value as { type: CustomVariableType }).type
    ).toBe(CustomVariableType.ScoreToWinRound);
  });

  it("maps user-defined options to CustomVariableType.Option", () => {
    const { nodes, ctx } = setup(
      "my_option",
      parameterParserBuilder([ParameterType.Integer])
    );
    const result = buildParameterLowerer([
      customVariableParam("opt", CustomVariableKind.Option),
    ])(nodes, ctx);
    const value = result.byName("opt")?.value as {
      type: CustomVariableType;
      optionIndex: number;
    };
    expect(value.type).toBe(CustomVariableType.Option);
    expect(value.optionIndex).toBe(0);
  });

  it("lowers global number variables with allocated slot indices", () => {
    const { nodes, ctx, symbolTable } = setup(
      "meter_value",
      parameterParserBuilder([ParameterType.Integer])
    );
    const slot = symbolTable.findVariableByName("meter_value");
    expect(slot && isBuiltInVariable(slot)).toBe(false);
    expect(ctx.variableSlots.get(slot!.id)?.index).toBe(0);

    const result = buildParameterLowerer([
      customVariableParam("value", CustomVariableKind.Number),
    ])(nodes, ctx);
    const value = result.byName("value")?.value as {
      type: CustomVariableType;
      variableIndex: number;
    };
    expect(value.type).toBe(CustomVariableType.GlobalNumber);
    expect(value.variableIndex).toBe(0);
  });

  it("lowers player-scoped numbers via member references", () => {
    const { nodes, ctx } = setup(
      "current_player.player_number",
      parameterParserBuilder([ParameterType.Integer])
    );
    const result = buildParameterLowerer([
      customVariableParam("value", CustomVariableKind.Number),
    ])(nodes, ctx);
    const value = result.byName("value")?.value as {
      type: CustomVariableType;
      player: ExplicitPlayer;
      variableIndex: number;
    };
    expect(value.type).toBe(CustomVariableType.PlayerNumber);
    expect(value.player).toBe(ExplicitPlayer.Current);
    expect(value.variableIndex).toBe(0);
  });

  it("lowers named timers and built-in round_timer", () => {
    const { nodes, ctx } = setup(
      "my_timer round_timer",
      parameterParserBuilder([ParameterType.Timer, ParameterType.Timer])
    );
    const result = buildParameterLowerer([
      customTimerParam("a"),
      customTimerParam("b"),
    ])(nodes, ctx);
    expect((result.byName("a")?.value as { type: CustomTimerType }).type).toBe(
      CustomTimerType.Global
    );
    expect((result.byName("b")?.value as { type: CustomTimerType }).type).toBe(
      CustomTimerType.Round
    );
  });

  it("lowers object references", () => {
    const { nodes, ctx } = setup(
      "the_hill",
      parameterParserBuilder([ParameterType.Object])
    );
    const result = buildParameterLowerer([
      objectParam("obj", ObjectReferenceType.GlobalObject),
    ])(nodes, ctx);
    expect(
      (result.byName("obj")?.value as { type: ObjectReferenceType }).type
    ).toBe(ObjectReferenceType.GlobalObject);
  });

  it("rejects object references when subtype is not accepted", () => {
    const { nodes, ctx, diagnostics } = setup(
      "the_hill",
      parameterParserBuilder([ParameterType.Object])
    );
    buildParameterLowerer([
      objectParam("obj", ObjectReferenceType.PlayerBiped),
    ])(nodes, ctx);
    expect(diagnostics.hasErrors()).toBe(true);
  });

  it("lowers object type references from object lists", () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(frontend).lex("warthog", diagnostics);
    const binder = new SymbolBinder(frontend, diagnostics);
    const parseCtx = new ParserContext(tokens, frontend, diagnostics, binder, {
      [ObjectListType.Objects]: ["warthog", "ghost"],
    });
    const nodes = parameterParserBuilder([
      ObjectListParameter(ObjectListType.Objects),
    ])(parseCtx, tokens[0]!.location);
    const symbolTable = binder.getSymbolTable();
    const variableSlots = buildVariableSlotMap(
      frontend,
      symbolTable,
      diagnostics
    );
    const ir = new Lowerer(frontend).lower(
      { failed: false, comments: [], elements: [], symbolTable },
      diagnostics
    );
    const result = buildParameterLowerer([objectTypeParam("type")])(nodes, {
      symbolTable,
      variableSlots,
      ir,
      diagnostics,
      loadoutsByName: new Map(),
      loadoutPalettesByName: new Map(),
      variableDeclarations: new Map(),
      frontend,
      inPregameTrigger: false,
    });
    expect(Number(result.byName("type")?.value)).toBe(0);
  });

  it("lowers player references including current_player", () => {
    const { nodes, ctx } = setup(
      "current_player",
      parameterParserBuilder([ParameterType.Player])
    );
    const result = buildParameterLowerer([playerParam("p")])(nodes, ctx);
    const value = result.byName("p")?.value as {
      type: PlayerReferenceType;
      player: ExplicitPlayer;
    };
    expect(value.type).toBe(PlayerReferenceType.GlobalPlayer);
    expect(value.player).toBe(ExplicitPlayer.Current);
  });

  it("supports optional parameters present and absent", () => {
    const signature = parameterParserBuilder([
      ParameterType.Object,
      OptionalParameter(
        "offset",
        ParameterType.Integer,
        ParameterType.Integer,
        ParameterType.Integer
      ),
    ]);
    const lower = buildParameterLowerer([
      objectParam("obj"),
      OptionalParam(
        "offset",
        numberParam("x"),
        numberParam("y"),
        numberParam("z")
      ),
    ]);

    const without = setup("the_hill", signature);
    const absentResult = lower(without.nodes, without.ctx);
    expect(absentResult.byName("offset")).toBeUndefined();
    expect(absentResult.byName("x")).toBeUndefined();

    const withOpt = setup("the_hill offset 1 2 3", signature);
    const present = lower(withOpt.nodes, withOpt.ctx);
    expect(String(present.byName("offset")?.value)).toBe("offset");
    expect(present.byName("x")?.value).toBe(1);
    expect(present.byName("y")?.value).toBe(2);
    expect(present.byName("z")?.value).toBe(3);
  });

  it("discriminates hud_widget_set_meter signature shapes", () => {
    const meterParser = parameterParserBuilder(
      [ParameterType.HudWidget, KeywordParameter("off")],
      [ParameterType.HudWidget, ParameterType.Timer],
      [ParameterType.HudWidget, ParameterType.Integer, ParameterType.Integer]
    );

    const lower = buildParameterLowerer(
      [keywordParam("mode", "off")],
      [customTimerParam("timer")],
      [
        customVariableParam(
          "value",
          CustomVariableKind.Number,
          CustomVariableKind.Constant
        ),
        customVariableParam(
          "max",
          CustomVariableKind.Number,
          CustomVariableKind.Constant
        ),
      ]
    );

    const off = setup("health_meter off", meterParser);
    expect(
      String(lower(off.nodes.slice(1), off.ctx).byName("mode")?.value)
    ).toBe("off");

    const timer = setup("health_meter my_timer", meterParser);
    expect(
      (lower(timer.nodes.slice(1), timer.ctx).byName("timer")?.value as {
        type: CustomTimerType;
      }).type
    ).toBe(CustomTimerType.Global);

    const numbers = setup("health_meter 50 100", meterParser);
    const numberResult = lower(numbers.nodes.slice(1), numbers.ctx);
    expect(
      (numberResult.byName("value")?.value as { type: CustomVariableType }).type
    ).toBe(CustomVariableType.Constant);
    expect(
      (numberResult.byName("max")?.value as { immediateValue: number })
        .immediateValue
    ).toBe(100);
  });

  it("assigns sequential slot indices and skips built-ins", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parseCtx = new ParserContext([], frontend, diagnostics, binder);

    const a = parseCtx.symbolParser.addVariableToScope({
      name: "n0",
      type: VariableType.Number,
      declaration: loc(1),
      scope: VariableScope.Global,
    });
    const b = parseCtx.symbolParser.addVariableToScope({
      name: "n1",
      type: VariableType.Number,
      declaration: loc(2),
      scope: VariableScope.Global,
    });

    const table = binder.getSymbolTable();
    const slots = buildVariableSlotMap(frontend, table, diagnostics);
    expect(slots.get(a)?.index).toBe(0);
    expect(slots.get(b)?.index).toBe(1);
    const roundTimer = table.findVariableByName("round_timer");
    expect(roundTimer && isBuiltInVariable(roundTimer)).toBe(true);
    expect(slots.has(roundTimer!.id)).toBe(false);
  });
});
