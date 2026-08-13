import type { CustomGameEngineDefinition } from "src/frontend/intermediate-representation/game/game_variant";
import type { Action } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { Condition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

/**
 * Append target for conditions/actions, matching managedmegalo's
 * `IActionAppendTarget` / `IConditionAppendTarget` + `ScopeAppendTarget`.
 *
 * Nested scopes buffer locally, then flush to the **global** engine arrays via
 * {@link AppendTarget.appendActionsToRoot} / {@link AppendTarget.appendConditionsToRoot}
 * so begin bodies can land outside the enclosing trigger's contiguous slice.
 */
export interface AppendTarget {
  appendAction(action: Action): void;
  appendActionsToRoot(actions: readonly Action[]): void;
  appendCondition(condition: Condition): void;
  appendConditionsToRoot(conditions: readonly Condition[]): void;
  getActionOffset(): number;
  getConditionOffset(): number;
  localActionCount(): number;
  localConditionCount(): number;
}

export class GameEngineAppendTarget implements AppendTarget {
  public constructor(private readonly engine: CustomGameEngineDefinition) {}

  public appendAction(action: Action): void {
    this.engine.actions.push(action);
  }

  public appendCondition(condition: Condition): void {
    this.engine.conditions.push(condition);
  }

  public getActionOffset(): number {
    return this.engine.actions.length;
  }

  public getConditionOffset(): number {
    return this.engine.conditions.length;
  }

  public appendActionsToRoot(actions: readonly Action[]): void {
    for (const action of actions) {
      this.engine.actions.push(action);
    }
  }

  public appendConditionsToRoot(conditions: readonly Condition[]): void {
    for (const condition of conditions) {
      this.engine.conditions.push(condition);
    }
  }

  /** No local buffer — actions append straight to the engine. */
  public localActionCount(): number {
    return 0;
  }

  public localConditionCount(): number {
    return 0;
  }
}

/**
 * Nested scope: buffers actions/conditions locally, then on flush forwards
 * them through {@link AppendTarget.appendActionsToRoot} so they land on the
 * global engine arrays (bypassing intermediate parents' local buffers).
 */
export class ScopeAppendTarget implements AppendTarget {
  private readonly localActions: Action[] = [];
  private readonly localConditions: Condition[] = [];

  public constructor(private readonly parent: AppendTarget) {}

  public appendAction(action: Action): void {
    this.localActions.push(action);
  }

  public appendCondition(condition: Condition): void {
    this.localConditions.push(condition);
  }

  public getActionOffset(): number {
    // Parent offset is the global engine count (ScopeAppendTarget forwards).
    return this.parent.getActionOffset();
  }

  public getConditionOffset(): number {
    return this.parent.getConditionOffset();
  }

  public appendActionsToRoot(actions: readonly Action[]): void {
    this.parent.appendActionsToRoot(actions);
  }

  public appendConditionsToRoot(conditions: readonly Condition[]): void {
    this.parent.appendConditionsToRoot(conditions);
  }

  public localActionCount(): number {
    return this.localActions.length;
  }

  public localConditionCount(): number {
    return this.localConditions.length;
  }

  /** Flush buffered items to the global root, then clear locals. */
  public flush(): void {
    this.parent.appendActionsToRoot(this.localActions);
    this.parent.appendConditionsToRoot(this.localConditions);
    this.localActions.length = 0;
    this.localConditions.length = 0;
  }
}

export interface ActionScopeWindow {
  actionCount: number;
  conditionCount: number;
  firstActionIndex: number;
  firstConditionIndex: number;
}
