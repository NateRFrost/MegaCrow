export function readBaseDirective(source: string): string | null {
  const match = source.match(/^\s*base\s+"([^"]+)"/m);
  return match?.[1] ?? null;
}
