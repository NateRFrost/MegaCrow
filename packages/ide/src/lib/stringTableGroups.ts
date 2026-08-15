import { REGION_START, regionStartPattern } from "./regionComments";

export interface StringTableRange {
  bodyEnd: number;
  bodyStart: number;
  header: number;
}

export interface StringTableGroup {
  end: number;
  start: number;
  tables: StringTableRange[];
}

const STRING_TABLE_HEADER = /^\s*string_table\s+\w+/;
const BLANK_OR_COMMENT = /^\s*($|;)/;

export function getRegionFoldLineNumbers(
  lines: string[],
  regionName: string
): number[] {
  const pattern = regionStartPattern(regionName);
  const foldLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i] ?? "")) {
      foldLines.push(i + 1);
    }
  }
  return foldLines;
}

export function findRegionNames(lines: string[]): string[] {
  const names: string[] = [];
  for (const line of lines) {
    const match = REGION_START.exec(line ?? "");
    if (!match) {
      continue;
    }
    const name = (line ?? "")
      .replace(/^\s*;\s*#region\s+/i, "")
      .trim()
      .split(/\s+/)[0];
    if (name) {
      names.push(name);
    }
  }
  return names;
}

export function findStringTableRanges(lines: string[]): StringTableRange[] {
  const ranges: StringTableRange[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!STRING_TABLE_HEADER.test(lines[i] ?? "")) {
      continue;
    }

    const header = i + 1;
    const bodyStart = i + 2;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*end\s*$/.test(lines[j] ?? "")) {
        if (j + 1 >= bodyStart) {
          ranges.push({ header, bodyStart, bodyEnd: j + 1 });
        }
        i = j;
        break;
      }
    }
  }

  return ranges;
}

function isOnlyBlankOrCommentBetween(
  lines: string[],
  afterLine: number,
  beforeLine: number
): boolean {
  for (let line = afterLine + 1; line < beforeLine; line++) {
    if (!BLANK_OR_COMMENT.test(lines[line - 1] ?? "")) {
      return false;
    }
  }
  return true;
}

function expandStartToStringsBanner(
  lines: string[],
  headerLine: number
): number {
  let start = headerLine;
  for (let index = headerLine - 2; index >= 0; index--) {
    const trimmed = (lines[index] ?? "").trim();
    if (trimmed === "") {
      start = index + 1;
      continue;
    }
    if (
      regionStartPattern("STRINGS").test(trimmed) ||
      /^;\s*\*+\s*$/.test(trimmed) ||
      /^;\s*\*?\s*STRINGS/i.test(trimmed)
    ) {
      start = index + 1;
      continue;
    }
    break;
  }
  return start;
}

export function findStringTableGroups(lines: string[]): StringTableGroup[] {
  const tables = findStringTableRanges(lines);
  if (tables.length === 0) {
    return [];
  }

  const groups: StringTableGroup[] = [];
  let current: StringTableGroup = {
    start: expandStartToStringsBanner(lines, tables[0]!.header),
    end: tables[0]!.bodyEnd,
    tables: [tables[0]!],
  };

  for (let i = 1; i < tables.length; i++) {
    const table = tables[i]!;
    if (isOnlyBlankOrCommentBetween(lines, current.end, table.header)) {
      current.end = table.bodyEnd;
      current.tables.push(table);
      continue;
    }

    groups.push(current);
    current = {
      start: expandStartToStringsBanner(lines, table.header),
      end: table.bodyEnd,
      tables: [table],
    };
  }

  groups.push(current);
  return groups;
}

export function getStringTableFoldLineNumbers(lines: string[]): number[] {
  // Prefer MegaCrow ;#region STRINGS blocks when present (editor extension, not official Megalo).
  const regionLines = getRegionFoldLineNumbers(lines, "STRINGS");
  if (regionLines.length > 0) {
    return regionLines;
  }

  const groups = findStringTableGroups(lines);
  const multiTableGroups = groups.filter((group) => group.tables.length > 1);
  if (multiTableGroups.length > 0) {
    return multiTableGroups.map((group) => group.start);
  }

  return findStringTableRanges(lines).map((range) => range.header);
}
