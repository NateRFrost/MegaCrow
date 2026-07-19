import type { StringTableLanguage } from "../../language-configuration/omni/strings";
import { SymbolId } from "../../symbol-table";

type AtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// Object of LanguageKey: string with at least one language set
export type StringTableEntry = AtLeastOne<Record<StringTableLanguage, string>>;
// We need to track symbol IDs to avoid adding duplicates.
type StringTableSymbolEntry = StringTableEntry & { symbolId?: SymbolId };

export type StringTableReference = number;

export const stringTableEntry = (
  language: StringTableLanguage,
  content: string
): StringTableEntry => ({ [language]: content }) as StringTableEntry;

export class StringTable {
  private readonly table: StringTableSymbolEntry[] = [];

  public addEntry(entry: StringTableEntry, symbolId?: SymbolId): StringTableReference {
    if (!symbolId) {
      // If a string literal is being added and we already have a matching string literal, we dont need to add it again.
      const matchingStringLiteralIndex: StringTableReference = this.table.findIndex(e => e.english === entry.english && e.symbolId == undefined);
      if (matchingStringLiteralIndex !== -1) {
        return matchingStringLiteralIndex + 1;
      }
    }
    else {
      // If a symbol string is being added and we already have it, we dont need to add it again.
      const matchkingSymbolStringIndex: StringTableReference = this.table.findIndex(e => e.symbolId === symbolId);
      if (matchkingSymbolStringIndex !== -1) {
        return matchkingSymbolStringIndex + 1;
      }
    }

    // Add new string.
    this.table.push({...entry, symbolId});
    return this.table.length;
  }

  public toArray(): readonly StringTableEntry[] {
    return this.table;
  }
}
