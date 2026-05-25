export function extractProjectKey(project: string): string {
  const match = project.match(/^\[([^\]]+)\]/)
  return match?.[1]?.toUpperCase() || project.trim()
}

export function parseProjectText(project: string): { key: string; summary: string } {
  const match = project.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return { key: match[1].toUpperCase(), summary: match[2] || '' }
  }
  return { key: project.trim(), summary: project.trim() }
}

export function stripMarkdownCodeBlock(text: string): string {
  let clean = text.trim()
  if (clean.startsWith('```')) {
    const match = clean.match(/^(?:```[a-zA-Z]*\n?)([\s\S]*?)(?:\n?```)$/)
    if (match) clean = (match[1] || '').trim()
  }
  return clean
}

export function parseActivityLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•]\s*/, ''))
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
}

export function generateId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}
