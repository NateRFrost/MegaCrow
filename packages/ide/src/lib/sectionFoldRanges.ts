export interface BlockSectionRange {
  end: number;
  start: number;
}

const BLOCK_SECTION_HEADER =
  /^(engine_data|teams|constants|game_options|variables\s+\S+)\s*$/;

function leadingWhitespace(line: string): string {
  const match = /^(\s*)/.exec(line);
  return match ? match[1] : "";
}

function findMatchingEnd(lines: string[], headerIndex: number): number {
  const headerIndent = leadingWhitespace(lines[headerIndex] ?? "");
  for (let index = headerIndex + 1; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (/^\s*end\s*$/i.test(line) && leadingWhitespace(line) === headerIndent) {
      return index;
    }
  }
  return headerIndex;
}

export function findBlockSectionFoldRanges(
  lines: string[]
): BlockSectionRange[] {
  const ranges: BlockSectionRange[] = [];

  for (let index = 0; index < lines.length; index++) {
    const trimmed = (lines[index] ?? "").trim();
    if (!BLOCK_SECTION_HEADER.test(trimmed)) {
      continue;
    }

    const endIndex = findMatchingEnd(lines, index);
    if (endIndex > index) {
      ranges.push({ start: index + 1, end: endIndex + 1 });
      index = endIndex;
    }
  }

  return ranges;
}
