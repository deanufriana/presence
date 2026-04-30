import { getDb, schema } from '~/db'
import { gte, lte, and } from 'drizzle-orm'
import type { GitLabEvent } from '~/types/report'

export async function getGitLabCommitsByPeriod(firstDay: Date, lastDay: Date) {
  const db = await getDb()
  return await db.query.gitlabCommits.findMany({
    where: and(
      gte(schema.gitlabCommits.createdAt, firstDay),
      lte(schema.gitlabCommits.createdAt, lastDay),
    ),
    orderBy: (commits, { desc }) => [desc(commits.createdAt)],
  })
}

export async function upsertGitLabCommit(commit: GitLabEvent) {
  const db = await getDb()
  await db
    .insert(schema.gitlabCommits)
    .values({
      id: commit.id,
      shortId: commit.short_id,
      title: commit.title,
      message: commit.message,
      authorName: commit.author_name,
      authorEmail: commit.author_email,
      authoredDate: new Date(commit.authored_date),
      committerName: commit.committer_name,
      committerEmail: commit.committer_email,
      committedDate: new Date(commit.committed_date),
      webUrl: commit.web_url || '',
      projectName: commit.project_name || '',
      projectPath: commit.project_path,
      projectId: commit.project_id,
      branchName: commit.branch_name,
      branchNames: JSON.stringify(commit.branch_names),
      actionName: commit.action_name,
      createdAt: new Date(commit.created_at),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.gitlabCommits.id,
      set: {
        shortId: commit.short_id,
        title: commit.title,
        message: commit.message,
        authorName: commit.author_name,
        authorEmail: commit.author_email,
        authoredDate: new Date(commit.authored_date),
        committerName: commit.committer_name,
        committerEmail: commit.committer_email,
        committedDate: new Date(commit.committed_date),
        webUrl: commit.web_url || '',
        projectName: commit.project_name || '',
        projectPath: commit.project_path,
        projectId: commit.project_id,
        branchName: commit.branch_name,
        branchNames: JSON.stringify(commit.branch_names),
        actionName: commit.action_name,
        updatedAt: new Date(),
      },
    })
}
