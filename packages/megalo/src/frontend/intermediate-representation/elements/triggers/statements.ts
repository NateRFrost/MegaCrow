import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type {
  BeginStatementNode,
  ForEachStatementNode,
  TemporaryStatementNode,
  TriggerStatementNode,
} from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  assertPreGameActions,
  dxAssertionScope,
} from "src/frontend/intermediate-representation/diagnostics";
import { lowerActionStatement } from "src/frontend/intermediate-representation/elements/triggers/action_registry";
import { lowerConditionStatement } from "src/frontend/intermediate-representation/elements/triggers/conditions";
import {
  applySpecialTriggerIndex,
  makeTrigger,
  resolveTriggerHeader,
} from "src/frontend/intermediate-representation/elements/triggers/header";
import {
  type ActionScopeWindow,
  type AppendTarget,
  ScopeAppendTarget,
} from "src/frontend/intermediate-representation/elements/triggers/scope";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  actionType,
  type BeginParameters,
  MathOperation,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  CustomVariableType,
  ObjectReferenceType,
  PlayerReferenceType,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import { resolveVariantVariable } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { enumSlotValue } from "src/frontend/intermediate-representation/parameters/explicit";
import {
  coerceVariantOperands,
  isBareNoneOperand,
} from "src/frontend/intermediate-representation/parameters/references/coerce";
import {
  type ResolvedVariableSlot,
  requireResolvedVariableSlot,
} from "src/frontend/intermediate-representation/preprocessing/symbols";
import {
  SymbolKind,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";
import { getLabel } from "src/version";

export interface ActionScopeContext {
  appendTarget: AppendTarget;
  ctx: ElementLowerContext;
  insidePregameTrigger: boolean;
}

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
  const { conditions: maxConditions } =
    scopeCtx.ctx.frontend.versionConfiguration.limits;

  let unionGroup = -1;
  let previousUnionOr = false;

  for (const statement of statements) {
    dxAssertionScope(scopeCtx.ctx.diagnostics, () => {
      switch (statement.kind) {
        case SyntaxKind.CONDITION: {
          if (
            scope.getConditionOffset() + scope.localConditionCount() >=
            maxConditions
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
  const { actions: maxActions } =
    scopeCtx.ctx.frontend.versionConfiguration.limits;
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    maxActions
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  assertPreGameActions(
    statement.name.value,
    statement.name.location,
    scopeCtx.ctx
  );

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
    !actionType
      .supportedMembers(scopeCtx.ctx.frontend.megaloVersion)
      .has(ActionType.begin)
  ) {
    throw new LowerError(
      diagnosticMessages.unsupportedAction(
        "begin",
        getLabel(scopeCtx.ctx.frontend.megaloVersion)
      ),
      statement.location
    );
  }

  const { actions: maxActions } =
    scopeCtx.ctx.frontend.versionConfiguration.limits;
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    maxActions
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
    type: ActionType.begin,
    parameters,
  };
  scopeCtx.appendTarget.appendAction(beginAction);
};

const lowerForEach = (
  statement: ForEachStatementNode,
  scopeCtx: ActionScopeContext
): void => {
  const { actions: maxActions, triggers: maxTriggers } =
    scopeCtx.ctx.frontend.versionConfiguration.limits;
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    maxActions
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  const engine = scopeCtx.ctx.ir.gameVariant.gameEngine;
  if (engine.triggers.length >= maxTriggers) {
    throw new LowerError("Too many triggers!", statement.location);
  }

  const header = resolveTriggerHeader(
    statement.target.value,
    statement.target.location,
    scopeCtx.ctx.symbolTable,
    statement.target.symbolId,
    true
  );

  // Reserve nested trigger index before lowering its body.
  const triggerIndex = engine.triggers.length;
  engine.triggers.push(
    makeTrigger(header, {
      firstCondition: 0,
      conditionCount: 0,
      firstAction: 0,
      actionCount: 0,
    })
  );
  applySpecialTriggerIndex(engine, header, triggerIndex);

  const nestedRoot = scopeCtx.appendTarget;
  const window = lowerActionScope(statement.statements, {
    ctx: scopeCtx.ctx,
    appendTarget: nestedRoot,
    insidePregameTrigger: scopeCtx.insidePregameTrigger,
  });

  engine.triggers[triggerIndex] = makeTrigger(header, {
    firstCondition: window.firstConditionIndex,
    conditionCount: window.conditionCount,
    firstAction: window.firstActionIndex,
    actionCount: window.actionCount,
  });

  scopeCtx.appendTarget.appendAction({
    type: ActionType.for_each,
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
  if (scopeCtx.insidePregameTrigger) {
    throw new LowerError(
      "Temporary variables are not allowed in a pregame trigger.",
      statement.location
    );
  }

  const { actions: maxActions } =
    scopeCtx.ctx.frontend.versionConfiguration.limits;
  if (
    scopeCtx.appendTarget.getActionOffset() +
      scopeCtx.appendTarget.localActionCount() >=
    maxActions
  ) {
    throw new LowerError("Too many actions!", statement.location);
  }

  const symbolId = statement.name.symbolId;
  const symbol =
    symbolId === undefined
      ? scopeCtx.ctx.symbolTable.findVariableByName(statement.name.value)
      : scopeCtx.ctx.symbolTable.getSymbol(symbolId);
  if (
    symbol === undefined ||
    symbol.kind !== SymbolKind.Variable ||
    (symbolId === undefined && symbol.scope !== VariableScope.Temporary)
  ) {
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
  const initialNode = statement.initial as ASTParameterNode;
  const rightWasNone = isBareNoneOperand(initialNode);
  const left = temporaryLeftHandSide(slot, statement.location);
  const [, right] = coerceVariantOperands(
    left,
    resolveVariantVariable(initialNode, paramCtx),
    rightWasNone,
    false
  );
  const setAction: Action = {
    type: ActionType.set,
    parameters: {
      left,
      operation: MathOperation.set_to,
      right,
    },
  };
  scopeCtx.appendTarget.appendAction(setAction);
};
