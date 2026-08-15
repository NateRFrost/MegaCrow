import {
  spanSourceCodeLocations as locationSpan,
  type SourceCodeLocation,
  SourceLocationType,
} from "src/diagnostics";
import {
  type ASTNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import { type Token, TokenKind, type Tokens } from "src/frontend/tokens";

export type ASTCommentNode = ASTNode<SyntaxKind.COMMENT> & {
  /** One entry per contiguous `;` line in this comment block. */
  lines: string[];
  /** Line the comment documents — next code line for leading, same line for trailing. */
  describesLine: SourceCodeLocation;
};

const lineStartLocation = (
  location: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: location.start.localOffset,
    absoluteOffset: location.start.absoluteOffset,
    line: location.start.line,
    column: 1,
  },
  end: {
    localOffset: location.start.localOffset,
    absoluteOffset: location.start.absoluteOffset,
    line: location.start.line,
    column: 1,
  },
  ...(location.include ? { include: location.include } : {}),
});

const syntheticLineLocation = (
  line: number,
  near: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: near.end.localOffset,
    absoluteOffset: near.end.absoluteOffset,
    line,
    column: 1,
  },
  end: {
    localOffset: near.end.localOffset,
    absoluteOffset: near.end.absoluteOffset,
    line,
    column: 1,
  },
  ...(near.include ? { include: near.include } : {}),
});
const isLeadingComment = (tokens: Tokens, index: number): boolean => {
  const previous = tokens[index - 1];
  const token = tokens[index]!;
  return (
    previous === undefined ||
    previous.location.start.line < token.location.start.line
  );
};

const canExtendGroup = (
  group: { lastLine: number; leadingComment: boolean },
  token: Token,
  leadingComment: boolean
): boolean =>
  leadingComment === group.leadingComment &&
  token.location.start.line === group.lastLine + 1;

const findNextNonComment = (
  tokens: Tokens,
  fromIndex: number
): Token | undefined => {
  for (let i = fromIndex; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.kind !== TokenKind.Comment) {
      return token;
    }
  }

  return;
};

/** Collect comments, grouping contiguous leading (or trailing) lines into blocks. */
export const collectComments = (tokens: Tokens): ASTCommentNode[] => {
  const comments: ASTCommentNode[] = [];

  let group:
    | {
        lines: string[];
        leadingComment: boolean;
        location: SourceCodeLocation;
        lastLine: number;
      }
    | undefined;
  let previousNonComment: Token | undefined;

  const resolveDescribesLine = (fromIndex: number): SourceCodeLocation => {
    const current = group!;

    if (current.leadingComment) {
      const nextCode = findNextNonComment(tokens, fromIndex);
      if (nextCode !== undefined) {
        return lineStartLocation(nextCode.location);
      }

      return syntheticLineLocation(current.lastLine + 1, current.location);
    }

    if (
      previousNonComment !== undefined &&
      previousNonComment.location.start.line === current.lastLine
    ) {
      return lineStartLocation(previousNonComment.location);
    }

    return lineStartLocation(current.location);
  };

  const flush = (fromIndex: number): void => {
    if (group === undefined) {
      return;
    }

    comments.push({
      kind: SyntaxKind.COMMENT,
      location: group.location,
      lines: group.lines,
      describesLine: resolveDescribesLine(fromIndex),
    });
    group = undefined;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.kind !== TokenKind.Comment) {
      flush(i);
      previousNonComment = token;
      continue;
    }

    const leadingComment = isLeadingComment(tokens, i);

    if (group !== undefined && canExtendGroup(group, token, leadingComment)) {
      group.lines.push(token.value);
      group.location = locationSpan(group.location, token.location);
      group.lastLine = token.location.start.line;
      continue;
    }

    flush(i);
    group = {
      lines: [token.value],
      leadingComment,
      location: token.location,
      lastLine: token.location.start.line,
    };
  }

  flush(tokens.length);
  return comments;
};
