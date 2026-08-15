const STORAGE_KEY = "author_metadata";
const DEFAULT_AUTHOR = "MegaCrow";

export function getAuthorMetadata(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored?.trim() ? stored : DEFAULT_AUTHOR;
  } catch {
    return DEFAULT_AUTHOR;
  }
}

export function setAuthorMetadata(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name.trim() || DEFAULT_AUTHOR);
  } catch {
    // Ignore storage failures.
  }
}
