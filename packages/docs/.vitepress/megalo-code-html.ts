import {
  analyzeDocumentSync,
  getSemanticTokens,
  type SemanticToken,
  type SemanticTokenType,
} from "../../megalo/src/language-service";
import { MEGALO_VERSIONS } from "../../megalo/src/version";

const MEGALO_DEFAULT_CLASS = "megalo-text";

const tokenClass = (type: SemanticTokenType): string => `megalo-${type}`;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type LineSpan = {
  length: number;
  offset: number;
  type: SemanticTokenType;
};

const spansForLine = (
  lineIndex: number,
  lineStart: number,
  lineEnd: number,
  tokens: readonly SemanticToken[],
  source: string
): LineSpan[] => {
  const spans: LineSpan[] = [];
  for (const token of tokens) {
    if (token.line !== lineIndex) {
      continue;
    }
    const offset = lineStart + token.startChar;
    const end = Math.min(offset + token.length, lineEnd);
    if (offset >= lineEnd || end <= lineStart) {
      continue;
    }
    const length = end - Math.max(offset, lineStart);
    if (length <= 0) {
      continue;
    }
    // Guard against tokens that extend past the actual line text.
    if (Math.max(offset, lineStart) >= source.length) {
      continue;
    }
    spans.push({
      offset: Math.max(offset, lineStart),
      length,
      type: token.type,
    });
  }
  return spans.sort((a, b) => a.offset - b.offset);
};

function renderLine(
  source: string,
  lineStart: number,
  lineEnd: number,
  spans: LineSpan[]
): string {
  if (spans.length === 0) {
    const text = source.slice(lineStart, lineEnd);
    return text.length === 0
      ? "<wbr>"
      : `<span class="${MEGALO_DEFAULT_CLASS}">${escapeHtml(text)}</span>`;
  }

  let cursor = lineStart;
  let html = "";

  for (const span of spans) {
    if (span.offset > cursor) {
      html += `<span class="${MEGALO_DEFAULT_CLASS}">${escapeHtml(source.slice(cursor, span.offset))}</span>`;
    }
    const text = source.slice(span.offset, span.offset + span.length);
    html += `<span class="${tokenClass(span.type)}">${escapeHtml(text)}</span>`;
    cursor = span.offset + span.length;
  }

  if (cursor < lineEnd) {
    html += `<span class="${MEGALO_DEFAULT_CLASS}">${escapeHtml(source.slice(cursor, lineEnd))}</span>`;
  }

  return html.length === 0 ? "<wbr>" : html;
}

/** Strip trailing `; [!code hide]` (and optional trailing comment text after it). */
const HIDE_MARKER = /;\s*\[!code hide\]\s*$/;

const isHiddenLine = (source: string, lineStart: number, lineEnd: number): boolean =>
  HIDE_MARKER.test(source.slice(lineStart, lineEnd));

/**
 * Semantic-token Megalo highlighting (same classifier as the IDE / LSP).
 *
 * Docs fences should be complete enough to analyze. Surrounding context that
 * readers should not see can be marked with a trailing `; [!code hide]` — those
 * lines are still analyzed, but omitted from the rendered HTML.
 */
export function megaloCodeToHtml(source: string): string {
  const normalized = source.replace(/\r\n/g, "\n").trimEnd();
  const snapshot = analyzeDocumentSync(normalized, {
    version: MEGALO_VERSIONS["107-mcc"],
  });
  const tokens = getSemanticTokens(snapshot);
  const lineStarts = snapshot.lineStarts;
  const lines: string[] = [];

  for (let i = 0; i < lineStarts.length; i++) {
    const lineStart = lineStarts[i]!;
    const lineEnd =
      i + 1 < lineStarts.length ? lineStarts[i + 1]! - 1 : normalized.length;
    if (isHiddenLine(normalized, lineStart, lineEnd)) {
      continue;
    }
    const spans = spansForLine(i, lineStart, lineEnd, tokens, normalized);
    lines.push(
      `<span class="line">${renderLine(normalized, lineStart, lineEnd, spans)}</span>`
    );
  }

  return `<pre class="megalo-edit vp-code" tabindex="0"><code>${lines.join("\n")}</code></pre>`;
}
