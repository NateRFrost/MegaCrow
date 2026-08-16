import type { SourceCodeLocation } from "src/diagnostics";
import type { SymbolTableEntry } from "src/frontend/symbol-table";

/**
 * Structure-only hover definition. Prose lives in
 * `src/localization/locales/hover/{en,ja}.json` under
 * `{kind}.{id}.summary` and `{kind}.{id}.params.{name}`.
 */
export interface HoverContribution {
  /** Signature / grammar line (code; not localized). */
  grammar?: string;
  id: string;
  kind: HoverContributionKind;
  /** Param names in display order; details come from i18n. */
  params?: readonly string[];
}

export type HoverContributionKind =
  | "action"
  | "condition"
  | "element"
  | "keyword"
  /** Element body property / keyword; id is `elementName.paramName`. */
  | "param";

/** What the cursor is over in the root document. */
export type HoverTarget =
  | {
      kind: "action" | "condition" | "element" | "keyword" | "param";
      id: string;
      range: SourceCodeLocation;
    }
  | {
      kind: "symbol";
      entry: SymbolTableEntry;
      range: SourceCodeLocation;
    };

export interface HoverMarkup {
  kind: "markdown";
  value: string;
}

/** 0-based LSP-style range. */
export interface HoverRange {
  end: { character: number; line: number };
  start: { character: number; line: number };
}

export interface HoverResult {
  contents: HoverMarkup;
  range: HoverRange;
}
