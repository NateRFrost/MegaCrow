import { SyntaxKind } from "../../../abstract-syntax-tree";
import type {
  BeginStatementNode,
  ForEachStatementNode,
  TemporaryStatementNode,
  TriggerStatementNode,
} from "../../../abstract-syntax-tree/elements/trigger";
import type { ActionStatementNode } from "../../../abstract-syntax-tree/elements/trigger/action";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../../diagnostics/messages";
import {
  VariableScope,
  VariableType,
} from "../../../symbol-table";
import { dxAssertionScope } from "../../diagnostics";
import { LowerError } from "../../error";
import {
  ActionType,
  MathOperation,
  type Action,
  type BeginParameters,
} from "../../game/megalogamengine/megalogamengine_actions";
import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  CustomVariableType,
  ObjectReferenceType,
  PlayerReferenceType,
  TeamReferenceType,
} from "../../game/megalogamengine/megalogamengine_references";
import {
  VariableType as VariantVariableType,
  type VariantVariable,
} from "../../game/megalogamengine/megalogamengine_variant_variable";
import { enumSlotValue } from "../../parameters/explicit";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../parameters/context";
import { resolveVariantVariable } from "../../parameters";
import {
  requireResolvedVariableSlot,
  type ResolvedVariableSlot,
} from "../../preprocessing/symbols";
import { lowerActionStatement } from "./action_registry";
import { lowerConditionStatement } from "./conditions";
import {
  applySpecialTriggerIndex,
  makeTrigger,
  resolveTriggerHeader,
} from "./header";
import {
  type ActionScopeWindow,
  type AppendTarget,
  MAX_ACTIONS,
  MAX_CONDITIONS,
  MAX_TRIGGERS,
  ScopeAppendTarget,
} from "./scope";

export type ActionScopeContext = {
  ctx: ElementLowerContext;
  appendTarget: AppendTarget;
  /** When true, reject non-pregame-executable actions. */
  isPregame: boolean;
};

const PREGAME_ACTIONS = new Set<string>(["set", "for_each", "begin"]);

/**
 * Lower a statement list into an action scope (trigger body or begin body),
 * matching managedmegalo `MegaloActionScope.ReadFrom`.
 */
export const lowerActionScope = (
  statements: readonly TriggerStatementNode[],
  scopeCtx: ActionScopeContext
): ActionScopeWindow => {
  const scope = new ScopeAppendTarget(scopeCtx.appendTarget);
  const nestedCtx: ActionScopeContext = {
    ...scopeCtx,
    appendTarget: scope,
  };

  let unionGroup = -1;
  let previousUnionOr = false;

  for (const statement of statements) {
    dxAssertionScope(scopeCtx.ctx.diagnostics, () => {
      switch (statement.kind) {
        case SyntaxKind.CONDITION: {
          if (
            scope.getConditionOffset() + scope.localConditionCount() >=
            MAX_CONDITIONS
          ) {
            throw new LowerError("Too many conditions!", statement.location);
          }
          if (!previousUnionOr) {
            unionGroup += 1;
          }
          const condition = lowerConditionStatement(statement, nestedCtx.ctx, {
            negated: statement.negated,
            unionGroup: Math.max(unionGroup, 0),
            executeBeforeAction: scope.localActionCount(),
          });
          scope.appendCondition(condition);
          previousUnionOr = statement.unionOr;
          break;
        }
        case SyntaxKind.ACTION: {
          previousUnionOr = false;
          lowerPlainAction(statement, nestedCtx);
          break;
        }
        case SyntaxKind.BEGIN: {
          previousUnionOr = false;
          lowerBegin(statement, nestedCtx);
          break;
        }
        case SyntaxKind.FOR_EACH: {
          previousUnionOr = false;
          lowerForEach(statement, nestedCtx);
          break;
        }
        case SyntaxKind.TEMPORARY: {
          previousUnionOr = false;
          lowerTemporary(statement, nestedCtx);
          break;
        }
        default: {
          const _exhaustive: never = statement;
          void _exhaustive;
        }
      }
    });
  }

  const window: ActionScopeWindow = {
    firstConditionIndex: scope.getConditionOffset(),
    conditionCount: scope.localConditionCount(),
    firstActionIndex: scope.getActionOffset(),
    actionCount: scope.localActionCount(),
  };

  // Flush body to global root. Caller then appends Begin (if any) onto the
  // enclosing local stack — matching managedmegalo ScopeAppendTarget dtor order.
  scope.flush();
  return window;
};

const lowerPlainAction = (
  statement: ActionStatementNode,
  scopeCtx: ActionScopeContext
): void => {
  if (scopeCtx.isPregame && !PREGAME_ACTIONS.has(statement.name.value)) {
    throw new LowerError(
      `Action '${statement.name.value}' is not allowed in a pregame trigger.`,
      statement.name.location
    );
  }

  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    MAX_ACTIONS
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  scopeCtx.appendTarget.appendAction(
    lowerActionStatement(statement, scopeCtx.ctx)
  );
};

/**
 * Lower `begin` … `end`: open nested scope, lower body, record ranges, flush
 * body to global, then append the Begin action onto the enclosing local stack.
 */
export const lowerBegin = (
  statement: BeginStatementNode,
  scopeCtx: ActionScopeContext
): void => {
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    MAX_ACTIONS
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  const window = lowerActionScope(statement.statements, scopeCtx);

  const parameters: BeginParameters = {
    firstConditionIndex: window.firstConditionIndex,
    conditionCount: window.conditionCount,
    firstActionIndex: window.firstActionIndex,
    actionCount: window.actionCount,
  };

  const beginAction: Action = {
    type: ActionType.Begin,
    parameters,
  };
  scopeCtx.appendTarget.appendAction(beginAction);
};

const lowerForEach = (
  statement: ForEachStatementNode,
  scopeCtx: ActionScopeContext
): void => {
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    MAX_ACTIONS
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  const engine = scopeCtx.ctx.ir.gameVariant.gameEngine;
  if (engine.triggers.length >= MAX_TRIGGERS) {
    throw new LowerError("Too many triggers!", statement.location);
  }

  const header = resolveTriggerHeader(
    statement.target.value,
    statement.target.location,
    scopeCtx.ctx.symbolTable,
    statement.target.symbolId,
    true
  );

  // Nested trigger body lowers against the global engine (like managedmegalo
  // ReadTrigger), then the for_each action references that trigger index.
  const nestedRoot = scopeCtx.appendTarget;
  const window = lowerActionScope(statement.statements, {
    ctx: scopeCtx.ctx,
    appendTarget: nestedRoot,
    isPregame: false,
  });

  const triggerIndex = engine.triggers.length;
  engine.triggers.push(
    makeTrigger(header, {
      firstCondition: window.firstConditionIndex,
      conditionCount: window.conditionCount,
      firstAction: window.firstActionIndex,
      actionCount: window.actionCount,
    })
  );
  applySpecialTriggerIndex(engine, header, triggerIndex);

  scopeCtx.appendTarget.appendAction({
    type: ActionType.ForEach,
    parameters: { triggerIndex },
  });
};

const temporaryLeftHandSide = (
  slot: ResolvedVariableSlot,
  location: TemporaryStatementNode["location"]
): VariantVariable => {
  switch (slot.type) {
    case VariableType.Number:
      if (slot.scope === VariableScope.Global) {
        return {
          type: VariantVariableType.CustomVariable,
          customVariable: {
            type: CustomVariableType.GlobalNumber,
            variableIndex: slot.index,
          },
        };
      }
      return {
        type: VariantVariableType.CustomVariable,
        customVariable: {
          type: CustomVariableType.TemporaryNumber,
          variableIndex: slot.index,
        },
      };
    case VariableType.Player:
      return {
        type: VariantVariableType.Player,
        player: {
          type: PlayerReferenceType.GlobalPlayer,
          player:
            slot.scope === VariableScope.Temporary
              ? enumSlotValue(ExplicitPlayer, "Temporary", slot.index)
              : enumSlotValue(ExplicitPlayer, "Global", slot.index),
        },
      };
    case VariableType.Object:
      return {
        type: VariantVariableType.Object,
        object: {
          type: ObjectReferenceType.GlobalObject,
          object:
            slot.scope === VariableScope.Temporary
              ? enumSlotValue(ExplicitObject, "Temporary", slot.index)
              : enumSlotValue(ExplicitObject, "Global", slot.index),
        },
      };
    case VariableType.Team:
      return {
        type: VariantVariableType.Team,
        team: {
          type: TeamReferenceType.GlobalTeam,
          team:
            slot.scope === VariableScope.Temporary
              ? enumSlotValue(ExplicitTeam, "Temporary", slot.index)
              : enumSlotValue(ExplicitTeam, "Global", slot.index),
        },
      };
    case VariableType.Timer:
      throw new LowerError(
        "Temporary timer variables are not supported.",
        location
      );
    default: {
      const _exhaustive: never = slot.type;
      return _exhaustive;
    }
  }
};

const lowerTemporary = (
  statement: TemporaryStatementNode,
  scopeCtx: ActionScopeContext
): void => {
  if (scopeCtx.isPregame) {
    throw new LowerError(
      "Temporary variables are not allowed in a pregame trigger.",
      statement.location
    );
  }

  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    MAX_ACTIONS
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  const symbol = scopeCtx.ctx.symbolTable.findVariableByName(
    statement.name.value
  );
  if (symbol === undefined) {
    throw new LowerError(
      `Unknown temporary variable '${statement.name.value}'.`,
      statement.name.location
    );
  }

  const slot = requireResolvedVariableSlot(
    scopeCtx.ctx.variableSlots,
    symbol.id
  );

  if (statement.initial.kind === SyntaxKind.INVALID) {
    throw new LowerError(
      diagnosticMessages.expectedTemporaryInitial(),
      statement.location
    );
  }

  const paramCtx = asParameterLoweringContext(scopeCtx.ctx);
  const setAction: Action = {
    type: ActionType.Set,
    parameters: {
      left: temporaryLeftHandSide(slot, statement.location),
      operation: MathOperation.SetTo,
      right: resolveVariantVariable(
        statement.initial as ASTParameterNode,
        paramCtx
      ),
    },
  };
  scopeCtx.appendTarget.appendAction(setAction);
};
