export function getDailyPrompt(activities: string[]) {
  return `You are an expert at summarizing technical work. 
Given the following activities for a single day:
${activities.map((a) => `- ${a}`).join('\n')}

Please provide a concise, professional summary of these activities in Indonesian. 
Focus on what was achieved. Use bullet points if there are multiple distinct tasks.
The summary should be suitable for a daily attendance report.
Do not include any introductory or concluding remarks. Just the summary.`
}

export function getMonthlyPrompt(activities: string[]) {
  return `You are a professional project reporter. 
Given the following daily activities for an entire month:
${activities.join('\n')}

Please group these activities into projects and summarize them.
Format the output as follows:

**Project Name A**
- Summary of activities for Project A. [Status: Project]
- Another achievement for Project A. [Status: Project]

**Project Name B**
- Summary of activities for Project B. [Status: Project]

Rules:
1. Group similar tasks under the same project heading.
2. Use Indonesian.
3. Every bullet point MUST end with [Status: XXX] where XXX is the category (e.g., Project, Maintenance, Support).
4. Every bullet point MUST start with the source dates in brackets like [01/01/2026, 02/01/2026].
5. Focus on high-level achievements.
6. Do not include introductory text.`
}

export function getYearlyPrompt(monthlySummaries: { period: string; summary: string | null }[]) {
  const summariesText = monthlySummaries
    .map((s) => `Month: ${s.period}\nSummary:\n${s.summary}`)
    .join('\n\n')

  return `You are an expert technical writer preparing a Yearly Achievement Report (BAST).
Given the following monthly summaries for the year:
${summariesText}

Please synthesize these into a comprehensive yearly report.
Format the output as follows:

**Project Name A**
- [dd/mm/yyyy] [Month Range] High-level achievement for Project A. [Status: Project]
- [dd/mm/yyyy] [Month Range] Another major milestone. [Status: Project]

**Project Name B**
- [dd/mm/yyyy] [Month Range] Achievement for Project B. [Status: Project]

Rules:
1. Group by Project.
2. Use Indonesian.
3. Every bullet point MUST follow the exact format: - [dd/mm/yyyy] [Months] Description [Status: Category]
4. The date should be a representative date for the milestone.
5. Focus on major achievements and milestones only.
6. Do not include introductory or concluding text.`
}
