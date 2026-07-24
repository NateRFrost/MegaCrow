import { SyntaxKind } from "../../../abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  type CustomVariableReference,
  CustomVariableType,
} from "../../game/megalogamengine/megalogamengine_references";
import {
  SymbolKind,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../symbol-table";
import {
  requireResolvedVariableSlot,
  type VariableSlotMap,
} from "../../preprocessing/symbols";
import { LowerError } from "../../error";
import type { ParameterLoweringContext } from "../context";
import { parseIndexSuffix } from "../explicit";
import { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "../gameOptionTypes";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "./explicitResolve";
import {
  isExplicitPlayerName,
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
} from "./helpers";

/** Simplified kind selector used by the lowering signature system. */
export enum CustomVariableKind {
  Constant = 0,
  Number = 1,
  Option = 2,
  GameOption = 3,
  SpawnObject = 4,
  Score = 5,
  Money = 6,
  Rating = 7,
  Stat = 8,
}

const encodeNumberVariable = (
  slot: SymbolTableVariableEntry,
  slots: VariableSlotMap
): CustomVariableReference => {
  const resolved = requireResolvedVariableSlot(slots, slot.id);
  const variableIndex = resolved.index;
  switch (resolved.scope) {
    case VariableScope.Global:
      return {
        type: CustomVariableType.GlobalNumber,
        variableIndex,
      };
    case VariableScope.Temporary:
      return {
        type: CustomVariableType.TemporaryNumber,
        variableIndex,
      };
    case VariableScope.Object:
      return {
        type: CustomVariableType.ObjectNumber,
        object: ExplicitObject.Current,
        variableIndex,
      };
    case VariableScope.Player:
      return {
        type: CustomVariableType.PlayerNumber,
        player: ExplicitPlayer.Current,
        variableIndex,
      };
    case VariableScope.Team:
      return {
        type: CustomVariableType.TeamNumber,
        team: ExplicitTeam.CurrentTeam,
        variableIndex,
      };
  }
};

const encodeScopedNumberReference = (
  ctx: ParameterLoweringContext,
  base: string,
  scope: VariableScope,
  member: string
): CustomVariableReference | undefined => {
  const index = resolveScopedVariableMemberIndex(
    ctx.symbolTable,
    ctx.variableSlots,
    scope,
    VariableType.Number,
    member,
    "number"
  );
  if (index === undefined) {
    return undefined;
  }
  switch (scope) {
    case VariableScope.Team:
      return {
        type: CustomVariableType.TeamNumber,
        team: resolveExplicitTeamForBase(ctx, base),
        variableIndex: index,
      };
    case VariableScope.Player:
      return {
        type: CustomVariableType.PlayerNumber,
        player: resolveExplicitPlayerForBase(ctx, base),
        variableIndex: index,
      };
    case VariableScope.Object:
      return {
        type: CustomVariableType.ObjectNumber,
        object: resolveExplicitObjectForBase(ctx, base),
        variableIndex: index,
      };
    default:
      return undefined;
  }
};

const classifyCustomVariable = (
  ref: CustomVariableReference
): CustomVariableKind => {
  switch (ref.type) {
    case CustomVariableType.Constant:
      return CustomVariableKind.Constant;
    case CustomVariableType.PlayerNumber:
    case CustomVariableType.ObjectNumber:
    case CustomVariableType.TeamNumber:
    case CustomVariableType.GlobalNumber:
    case CustomVariableType.TemporaryNumber:
      return CustomVariableKind.Number;
    case CustomVariableType.Option:
      return CustomVariableKind.Option;
    case CustomVariableType.SpawnObject:
      return CustomVariableKind.SpawnObject;
    case CustomVariableType.TeamScore:
    case CustomVariableType.PlayerScore:
      return CustomVariableKind.Score;
    case CustomVariableType.PlayerMoney:
      return CustomVariableKind.Money;
    case CustomVariableType.PlayerRating:
      return CustomVariableKind.Rating;
    case CustomVariableType.PlayerStat:
    case CustomVariableType.TeamStat:
      return CustomVariableKind.Stat;
    default:
      return CustomVariableKind.GameOption;
  }
};

export const resolveCustomVariableReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  acceptedKinds?: readonly CustomVariableKind[]
): CustomVariableReference => {
  const ref = resolveCustomVariableReferenceUnchecked(node, ctx);
  if (acceptedKinds !== undefined && acceptedKinds.length > 0) {
    const kind = classifyCustomVariable(ref);
    if (!acceptedKinds.includes(kind)) {
      throw new LowerError(
        `Custom variable kind ${CustomVariableKind[kind]} is not accepted`,
        node.location
      );
    }
  }
  return ref;
};

const resolveCustomVariableReferenceUnchecked = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): CustomVariableReference => {
  if (node.kind === SyntaxKind.INTEGER || node.kind === SyntaxKind.FLOATING_POINT) {
    return {
      type: CustomVariableType.Constant,
      immediateValue: node.value,
    };
  }

  const { base, member, baseSymbol, location } = splitParameterMember(
    node,
    ctx.symbolTable
  );
  const name = member ? `${base}.${member}` : base;

  const globalIndex = parseIndexSuffix(name, "global_number");
  if (globalIndex !== undefined) {
    return {
      type: CustomVariableType.GlobalNumber,
      variableIndex: globalIndex,
    };
  }

  if (!member) {
    const optionByName = ctx.optionIndexByName.get(name);
    if (optionByName !== undefined) {
      return {
        type: CustomVariableType.Option,
        optionIndex: optionByName,
      };
    }

    const gameOptionType = GAME_OPTION_CUSTOM_VARIABLE_TYPE[name];
    if (gameOptionType !== undefined) {
      return { type: gameOptionType };
    }

    if (node.kind === SyntaxKind.REFERENCE) {
      const symbol = ctx.symbolTable.getSymbol(node.symbolId);
      if (symbol?.kind === SymbolKind.Constant) {
        return {
          type: CustomVariableType.Constant,
          immediateValue: symbol.value,
        };
      }
      if (symbol?.kind === SymbolKind.GameOption) {
        const mapped = GAME_OPTION_CUSTOM_VARIABLE_TYPE[symbol.name];
        if (mapped !== undefined) {
          return { type: mapped };
        }
        const userOption = ctx.optionIndexByName.get(symbol.name);
        if (userOption !== undefined) {
          return {
            type: CustomVariableType.Option,
            optionIndex: userOption,
          };
        }
      }
      if (
        symbol?.kind === SymbolKind.Variable &&
        symbol.type === VariableType.Number &&
        !isBuiltInVariable(symbol)
      ) {
        return encodeNumberVariable(symbol, ctx.variableSlots);
      }
    }

    if (
      baseSymbol?.type === VariableType.Number &&
      !isBuiltInVariable(baseSymbol)
    ) {
      return encodeNumberVariable(baseSymbol, ctx.variableSlots);
    }
  }

  if (member) {
    const statIndex = ctx.statIndexByName.get(member);
    if (statIndex !== undefined) {
      if (isPlayerReferenceBase(ctx, base)) {
        return {
          type: CustomVariableType.PlayerStat,
          player: resolveExplicitPlayerForBase(ctx, base),
          statisticIndex: statIndex,
        };
      }
      if (isTeamReferenceBase(ctx, base)) {
        return {
          type: CustomVariableType.TeamStat,
          team: resolveExplicitTeamForBase(ctx, base),
          statisticIndex: statIndex,
        };
      }
    }
  }

  if (member?.startsWith("stat_")) {
    const statIndex =
      ctx.statIndexByName.get(member) ??
      Number(member.replace(/^stat_/, "")) ??
      0;
    if (isPlayerReferenceBase(ctx, base)) {
      return {
        type: CustomVariableType.PlayerStat,
        player: resolveExplicitPlayerForBase(ctx, base),
        statisticIndex: statIndex,
      };
    }
    if (isTeamReferenceBase(ctx, base)) {
      return {
        type: CustomVariableType.TeamStat,
        team: resolveExplicitTeamForBase(ctx, base),
        statisticIndex: statIndex,
      };
    }
  }

  if (member?.startsWith("number_")) {
    const rawIndex = Number(member.replace(/^number_/, ""));
    const globalObjectSlot = /^object_\d+$/.test(base);
    if (base.startsWith("player_") || base === "current_player") {
      const index =
        resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Player,
          VariableType.Number,
          member,
          "number"
        ) ?? rawIndex;
      return {
        type: CustomVariableType.PlayerNumber,
        player: resolveExplicitPlayerForBase(ctx, base),
        variableIndex: index,
      };
    }
    if (isTeamReferenceBase(ctx, base, member)) {
      const index =
        resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Team,
          VariableType.Number,
          member,
          "number"
        ) ?? rawIndex;
      return {
        type: CustomVariableType.TeamNumber,
        team: resolveExplicitTeamForBase(ctx, base),
        variableIndex: index,
      };
    }
    if (isObjectReferenceBase(ctx, base, member)) {
      const index = globalObjectSlot
        ? rawIndex
        : resolveScopedVariableMemberIndex(
            ctx.symbolTable,
            ctx.variableSlots,
            VariableScope.Object,
            VariableType.Number,
            member,
            "number"
          ) ?? rawIndex;
      return {
        type: CustomVariableType.ObjectNumber,
        object: resolveExplicitObjectForBase(ctx, base),
        variableIndex: index,
      };
    }
  }

  if (member) {
    if (isTeamReferenceBase(ctx, base, member)) {
      const scoped = encodeScopedNumberReference(
        ctx,
        base,
        VariableScope.Team,
        member
      );
      if (scoped) {
        return scoped;
      }
    }
    if (
      isExplicitPlayerName(base) ||
      ctx.symbolTable.findVariableByName(base)?.type === VariableType.Player
    ) {
      const scoped = encodeScopedNumberReference(
        ctx,
        base,
        VariableScope.Player,
        member
      );
      if (scoped) {
        return scoped;
      }
    }
    if (isObjectReferenceBase(ctx, base, member)) {
      const scoped = encodeScopedNumberReference(
        ctx,
        base,
        VariableScope.Object,
        member
      );
      if (scoped) {
        return scoped;
      }
    }
  }

  if (member === "score") {
    if (isPlayerReferenceBase(ctx, base)) {
      return {
        type: CustomVariableType.PlayerScore,
        player: resolveExplicitPlayerForBase(ctx, base),
      };
    }
    return {
      type: CustomVariableType.TeamScore,
      team: resolveExplicitTeamForBase(ctx, base),
    };
  }

  if (member === "user_data" && isObjectReferenceBase(ctx, base, member)) {
    return {
      type: CustomVariableType.SpawnObject,
      object: resolveExplicitObjectForBase(ctx, base),
    };
  }

  if (
    member === "player_score" ||
    member === "player_money" ||
    member === "player_rating" ||
    member === "rating"
  ) {
    const player = resolveExplicitPlayerForBase(ctx, base);
    if (member === "player_score") {
      return { type: CustomVariableType.PlayerScore, player };
    }
    if (member === "player_money") {
      return { type: CustomVariableType.PlayerMoney, player };
    }
    return { type: CustomVariableType.PlayerRating, player };
  }

  const optionByName = ctx.optionIndexByName.get(name);
  if (optionByName !== undefined) {
    return {
      type: CustomVariableType.Option,
      optionIndex: optionByName,
    };
  }

  const optionIndex = parseIndexSuffix(name, "option");
  if (optionIndex !== undefined) {
    return {
      type: CustomVariableType.Option,
      optionIndex,
    };
  }

  // Fallback: treat identifier as constant numeric (0 if non-numeric)
  void location;
  return {
    type: CustomVariableType.Constant,
    immediateValue: Number(name) || 0,
  };
};
