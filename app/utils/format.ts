export function extractProjectKey(project: string): string {
  const match = project.match(/^\[([^\]]+)\]/)
  return match?.[1]?.toUpperCase() || project.trim()
}

export function parseProjectText(project: string): { key: string; summary: string } {
  const match = project.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    const key = match[1] ?? ''
    const summary = match[2] ?? ''
    return { key: key.toUpperCase(), summary }
  }
  return { key: project.trim(), summary: project.trim() }
}

export function stripThinking(text: string): string {
  if (!text) return ''
  if (text.includes('</think>')) {
    return text.split('</think>').pop()?.trim() || text
  }
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export function stripMarkdownCodeBlock(text: string): string {
  let clean = stripThinking(text)

  // Try to find markdown code block first
  const blockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const match = clean.match(blockRegex)
  if (match && match[1]) {
    clean = match[1].trim()
  }

  // If clean doesn't look like valid JSON array/object, try to locate the boundaries [ ] or { }
  if (!clean.startsWith('[') && !clean.startsWith('{')) {
    const firstBracket = clean.indexOf('[')
    const lastBracket = clean.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.substring(firstBracket, lastBracket + 1).trim()
    } else {
      const firstBrace = clean.indexOf('{')
      const lastBrace = clean.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1).trim()
      }
    }
  }

  return clean
}
