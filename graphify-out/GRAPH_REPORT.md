# Graph Report - presence (2026-07-21)

## Corpus Check

- 163 files · ~182,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 693 nodes · 880 edges · 32 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `43944ecf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]

## God Nodes (most connected - your core abstractions)

1. `getDb()` - 43 edges
2. `dependencies` - 24 edges
3. `devDependencies` - 19 edges
4. `Component Composition` - 13 edges
5. `scripts` - 12 edges
6. `Styling & Customization` - 12 edges
7. `shadcn-vue` - 11 edges
8. `JiraEvent` - 10 edges
9. `GitLabEvent` - 10 edges
10. `Commands` - 10 edges

## Surprising Connections (you probably didn't know these)

- `loadJiraConfig()` --calls--> `parseProjectText()` [INFERRED]
  app/components/report/JiraExportModal.vue → app/utils/format.ts
- `generateParentDescription()` --calls--> `generateSummary()` [INFERRED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts
- `saveJiraExportData()` --calls--> `upsertJiraExportData()` [INFERRED]
  app/components/report/JiraExportModal.vue → app/queries/jiraExport.ts
- `getJiraCache()` --calls--> `getJiraActivitiesByPeriod()` [EXTRACTED]
  app/utils/jira.ts → app/queries/jira.ts
- `syncJiraActivities()` --calls--> `upsertJiraActivity()` [EXTRACTED]
  app/utils/jira.ts → app/queries/jira.ts

## Communities (57 total, 8 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.07
Nodes (48): getDb(), deleteCalendarEventsByMonth(), deleteHolidayByDate(), getCalendarEventsByMonth(), getHolidaysByMonth(), insertCalendarEvent(), insertCalendarEvents(), upsertHoliday() (+40 more)

### Community 1 - "Community 1"

Cohesion: 0.08
Nodes (33): { success }, ToastProps, toasts, useToast(), useCalendarStore, useCoreStore, useDailyStore, useGitlabStore (+25 more)

### Community 2 - "Community 2"

Cohesion: 0.05
Nodes (26): closeModal(), configError, creating, customParentKey, generateParentDescription(), isAILoading, isDescriptionLoading, issueDescription (+18 more)

### Community 3 - "Community 3"

Cohesion: 0.05
Nodes (37): devDependencies, better-sqlite3, drizzle-kit, eslint, husky, lint-staged, nuxt, @nuxt/eslint (+29 more)

### Community 4 - "Community 4"

Cohesion: 0.05
Nodes (8): ButtonVariants, FieldVariants, df, internalDate, months, parsed, pickerYear, JiraChildTask

### Community 5 - "Community 5"

Cohesion: 0.06
Nodes (22): ActivityCalendar, calendarStore, coreStore, dailyStore, { importingCalendar }, JiraExportModal, jiraStore, ManualActivityModal (+14 more)

### Community 6 - "Community 6"

Cohesion: 0.13
Nodes (18): getGitLabCommitsByPeriod(), upsertGitLabCommit(), getSetting(), getMonthRange(), fetchGitLab(), formatGitLabActivity(), getGitLabCache(), getGitLabConfig() (+10 more)

### Community 7 - "Community 7"

Cohesion: 0.08
Nodes (25): `add` — Add components, `apply` — Apply a preset to an existing project, `build` — Build a custom registry, code:bash (npx shadcn-vue@latest init [components...] [options]), code:bash (npx shadcn-vue@latest apply [preset] [options]), code:bash (npx shadcn-vue@latest add [components...] [options]), code:bash (npx shadcn-vue@latest search <registries...> [options]), code:bash (npx shadcn-vue@latest view <items...> [options]) (+17 more)

### Community 8 - "Community 8"

Cohesion: 0.08
Nodes (24): dependencies, class-variance-authority, clsx, date-fns, docx, drizzle-orm, exceljs, file-saver (+16 more)

### Community 9 - "Community 9"

Cohesion: 0.08
Nodes (23): Built-in variants first, class for layout only, code:html (<div class="bg-blue-500 text-white">), code:html (<div), code:js (<script setup lang="ts">), code:html (<div class="bg-primary text-primary-foreground">), code:html (<span class="text-emerald-600">+20.1%</span>), code:html (<Badge variant="secondary">+20.1%</Badge>) (+15 more)

### Community 10 - "Community 10"

Cohesion: 0.08
Nodes (23): Avatar always needs AvatarFallback, Button has no isPending or isLoading prop, Callouts use Alert, Card structure, Choosing between overlay components, code:html (<SelectContent>), code:html (<Avatar>), code:html (<SelectContent>) (+15 more)

### Community 11 - "Community 11"

Cohesion: 0.08
Nodes (23): 1. Built-in variants, 2. Tailwind classes via `class`, 3. Add a new variant, 4. Wrapper components, Adding Custom Colors, Border Radius, Changing the Theme, code:js (<!-- nuxt.config.ts -->) (+15 more)

### Community 12 - "Community 12"

Cohesion: 0.09
Nodes (22): CLI, code:json (!`npx shadcn-vue@latest info --json`), code:html (<!-- Form layout: FieldGroup + Field, not div + Label. -->), code:bash (npx shadcn-vue@latest docs button dialog select), code:bash (# Create a new project.), Component Docs, Examples, and Usage, Component Selection, Component Structure → [ui-composition.md](../../rules/ui-composition.md) (+14 more)

### Community 13 - "Community 13"

Cohesion: 0.09
Nodes (21): calendarEvents, calendarEventsDateIdx, dailyReports, gitlabCommits, gitlabCommitsAuthorEmailIdx, gitlabCommitsCreatedAtIdx, holidays, holidaysDateIdx (+13 more)

### Community 14 - "Community 14"

Cohesion: 0.11
Nodes (18): Buttons inside inputs use InputGroup + InputGroupAddon, code:vue (<FieldGroup>), code:html (<!-- Invalid. -->), code:html (<InputGroup>), code:js (<script setup lang="ts">), code:html (<div class="relative">), code:js (<script setup lang="ts">), code:js (<script setup lang="ts">) (+10 more)

### Community 15 - "Community 15"

Cohesion: 0.11
Nodes (17): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+9 more)

### Community 16 - "Community 16"

Cohesion: 0.12
Nodes (15): 1. Prerequisites, 2. Installation, 3. Environment Setup, 4. Running the Application, 5. Building for Production, code:bash (git clone https://github.com/deanufriana/presence.git), code:bash (cp .env.example .env), code:bash (npm run dev:tauri) (+7 more)

### Community 17 - "Community 17"

Cohesion: 0.14
Nodes (13): code:bash (shadcn-vue mcp # start the MCP server (stdio)), code:json ({), Configuring Registries, Setup, shadcn MCP Server, `shadcn_vue:get_add_command_for_items`, `shadcn_vue:get_audit_checklist`, `shadcn_vue:get_item_examples_from_registries` (+5 more)

### Community 20 - "Community 20"

Cohesion: 0.17
Nodes (11): aliases, components, utils, $schema, style, tailwind, baseColor, config (+3 more)

### Community 21 - "Community 21"

Cohesion: 0.18
Nodes (10): code:html (<button>), code:html (<button>), code:html (<button>), code:html (<button>), code:js (<script setup lang="ts">), code:js (<script setup lang="ts">), Icons, Icons in Button use data-icon attribute (+2 more)

### Community 24 - "Community 24"

Cohesion: 0.25
Nodes (7): 1. Search Before Build, 2. Compose, Don't Reinvent, 3. Consistency Over Customization, Core Principles, Mandatory Tooling, UI Construction & Component Creation, Verification

### Community 26 - "Community 26"

Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 30 - "Community 30"

Cohesion: 0.5
Nodes (3): main, mockTauri(), Window

### Community 31 - "Community 31"

Cohesion: 0.4
Nodes (4): id, name, projectResources, resources

## Knowledge Gaps

- **289 isolated node(s):** `animate`, `name`, `private`, `type`, `build` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `getDb()` connect `Community 0` to `Community 6`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `generateSummary()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `animate`, `name`, `private` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
