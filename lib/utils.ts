export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function extractTags(content: string): string[] {
  if (!content) return []
  const matches = content.match(/#([a-zA-Z0-9_-]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((tag) => tag.slice(1)))]
}
