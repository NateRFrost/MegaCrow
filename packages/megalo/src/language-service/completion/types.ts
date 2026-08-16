import type { ASTElementNode } from "src/frontend/abstract-syntax-tree/elements";
import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import type { TemporaryStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

/** LSP-neutral completion kinds (mapped in @megacrow/lsp). */
export type CompletionKind =
  | "keyword"
  | "function"
  | "variable"
  | "enumMember"
  | "constant"
  | "property"
  | "snippet"
  | "text"
  | "file"
  | "folder";

/** 0-based UTF-16 range in the root document. */
export interface CompletionRange {
  end: { character: number; line: number };
  start: { character: number; line: number };
}

export interface CompletionItem {
  detail?: string;
  /**
   * Markdown documentation shown in the suggest details pane / hover on the item.
   */
  documentation?: string;
  /**
   * When set, editors filter/score on this instead of `label`. Use the current
   * prefix for every alternative when replacing a complete keyword so siblings
   * stay visible (e.g. all temporary storage types while on `player`).
   */
  filterText?: string;
  /**
   * When true, `insertText` is a snippet (tabstops like `$0`). Wired through
   * LSP `InsertTextFormat.Snippet` / Monaco `InsertAsSnippet`.
   */
  insertAsSnippet?: boolean;
  insertText?: string;
  kind: CompletionKind;
  label: string;
  /** Lower sorts first. */
  sortText?: string;
  /**
   * After accepting this item, reopen the suggest widget (next token / body).
   * Wired as LSP/Monaco `editor.action.triggerSuggest`.
   */
  triggerSuggestAfterAccept?: boolean;
}

export interface CompletionPrefix {
  /**
   * When completing after `root.`, the root identifier (member access).
   * `text` is then the member prefix being typed.
   */
  memberOf?: string;
  /** True when the prefix is inside / starting a quoted string. */
  quoted: boolean;
  range: CompletionRange;
  /** Text being typed (without surrounding quotes when quoted). */
  text: string;
}

export type CompletionContextKind =
  | "top-level"
  | "trigger-name"
  | "trigger-body"
  | "action-name"
  | "condition-name"
  | "action-operands"
  | "condition-operands"
  | "element"
  | "temporary"
  | "none";

export interface CompletionContextBase {
  kind: CompletionContextKind;
  offset: number;
  prefix: CompletionPrefix;
  snapshot: AnalysisSnapshot;
}

export interface TopLevelCompletionContext extends CompletionContextBase {
  kind: "top-level";
}

export interface TriggerNameCompletionContext extends CompletionContextBase {
  kind: "trigger-name";
}

export interface TriggerBodyCompletionContext extends CompletionContextBase {
  kind: "trigger-body";
}

export interface ActionNameCompletionContext extends CompletionContextBase {
  kind: "action-name";
}

export interface ConditionNameCompletionContext extends CompletionContextBase {
  kind: "condition-name";
}

export interface ActionCompletionContext extends CompletionContextBase {
  kind: "action-operands";
  /** 0-based parameter slot being completed. */
  slotIndex: number;
  statement: ActionStatementNode;
}

export interface ConditionCompletionContext extends CompletionContextBase {
  kind: "condition-operands";
  /** 0-based operand slot being completed. */
  slotIndex: number;
  statement: ConditionStatementNode;
}

export interface ElementCompletionContext extends CompletionContextBase {
  element: ASTElementNode;
  kind: "element";
}

/**
 * `temporary <storage> <name> <initial>`
 * slot 0 = storage type, 1 = name (free), 2 = initializer.
 */
export interface TemporaryCompletionContext extends CompletionContextBase {
  kind: "temporary";
  slotIndex: number;
  statement: TemporaryStatementNode;
}

export type CompletionContext =
  | TopLevelCompletionContext
  | TriggerNameCompletionContext
  | TriggerBodyCompletionContext
  | ActionNameCompletionContext
  | ConditionNameCompletionContext
  | ActionCompletionContext
  | ConditionCompletionContext
  | ElementCompletionContext
  | TemporaryCompletionContext
  | (CompletionContextBase & { kind: "none" });

export type ActionCompleter = (
  ctx: ActionCompletionContext
) => CompletionItem[];

export type ConditionCompleter = (
  ctx: ConditionCompletionContext
) => CompletionItem[];

export type ElementCompleter = (
  ctx: ElementCompletionContext
) => CompletionItem[];
