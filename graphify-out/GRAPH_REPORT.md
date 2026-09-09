# Graph Report - presence (2026-09-09)

## Corpus Check

- 185 files · ~177,350 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1105 nodes · 1639 edges · 110 communities (66 shown, 44 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `f61d7794`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- YearlyReport.vue
- BalanceActivitiesModal.vue
- JiraExportModal.vue
- devDependencies
- MonthPicker.vue
- index.vue
- getDb
- Commands
- dependencies
- Styling & Customization
- Component Composition
- Customization & Theming
- shadcn-vue
- schema.ts
- Forms & Inputs
- tauri.conf.json
- 🚀 Getting Started
- Tools
- select/index.ts
- dialog/index.ts
- calendar/index.ts
- Icons
- alert-dialog/index.ts
- button/index.ts
- Core Principles
- scripts
- permissions
- DailyReport.vue
- utils/gitlab.ts
- open_url
- example.spec.ts
- 59e27a32-5d32-46e7-b223-fe1593073fb1.json
- utils/index.ts
- queries/calendar.ts
- SettingsModal.vue
- MonthlyReport.vue
- DailyReportRow.vue
- cn
- report.ts
- tabs/index.ts
- utils/jira.ts
- stores/calendar.ts
- YearlyActivityGrid.vue
- Toast.vue
- husky.sh
- TooltipContent.vue
- use-toast.ts
- components.json
- format.ts
- ai.ts
- groupSubtasksWithAI
- prompts.ts
- ManualActivityModal.vue
- Checkbox.vue
- FieldLabel.vue
- DialogContent.vue
- Tabs.vue
- textarea/index.ts
- CalendarHeading.vue
- drizzle.config.ts
- post-commit
- tsconfig.json
- rules/graphify.md
- workflows/graphify.md
- better-sqlite3
- class-variance-authority
- clsx
- date-fns
- docx
- drizzle-kit
- drizzle-orm
- eslint
- exceljs
- husky
- post-checkout
- lint-staged
- lucide-vue-next
- nuxt
- @nuxt/eslint
- pinia
- @pinia/nuxt
- reka-ui
- tailwind-merge
- @tauri-apps/api
- @tauri-apps/plugin-dialog
- @tauri-apps/plugin-fs
- @tauri-apps/plugin-http
- @tauri-apps/plugin-sql
- vue
- vue-router
- vuedraggable
- @vueuse/core
- @playwright/test
- prettier
- shadcn-nuxt
- tailwindcss
- @tailwindcss/vite
- @tauri-apps/cli
- tw-animate-css
- @types/node
- typescript
- tailwind.config.js
- SelectScrollDownButton.vue
- SelectScrollUpButton.vue
- TabsContent.vue

## God Nodes (most connected - your core abstractions)

1. `cn()` - 64 edges
2. `getDb()` - 38 edges
3. `useCoreStore` - 15 edges
4. `useToast()` - 14 edges
5. `Component Composition` - 13 edges
6. `scripts` - 12 edges
7. `Styling & Customization` - 12 edges
8. `permissions` - 11 edges
9. `shadcn-vue` - 11 edges
10. `GitLabEvent` - 10 edges

## Surprising Connections (you probably didn't know these)

- `insertCalendarEvent()` --calls--> `getDb()` [EXTRACTED]
  app/queries/calendar.ts → app/db/index.ts
- `upsertManualHoliday()` --calls--> `getDb()` [EXTRACTED]
  app/queries/calendar.ts → app/db/index.ts
- `getJiraActivitiesByDates()` --calls--> `getDb()` [EXTRACTED]
  app/queries/jira.ts → app/db/index.ts
- `generateParentDescription()` --calls--> `generateSummary()` [EXTRACTED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts
- `groupSubtasksWithAI()` --calls--> `generateSummary()` [EXTRACTED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts

## Import Cycles

- None detected.

## Communities (110 total, 44 thin omitted)

### Community 0 - "YearlyReport.vue"

Cohesion: 0.13
Nodes (10): columns, coreStore, { exportBASTToExcel, exporting: exportingExcel }, { exportingDocx }, { isAiEnabled, selectedDate }, { success, error }, { yearlyRows, yearlyHighlights, summarizing, isLoading, currentYear }, yearlyStore (+2 more)

### Community 1 - "BalanceActivitiesModal.vue"

Cohesion: 0.08
Nodes (23): applying, applyMoves(), calculateProposals(), calendarStore, coreStore, dailyStore, { dailyTable }, emit (+15 more)

### Community 2 - "JiraExportModal.vue"

Cohesion: 0.06
Nodes (26): configError, coreStore, creating, customParentKey, displayActivities, {
exportRow,
exportPeriod,
candidateParents,
exportChildTasks,
exportDescription,
exportProjectKey,
}, exportRowActivities, isAILoading (+18 more)

### Community 3 - "devDependencies"

Cohesion: 0.11
Nodes (19): devDependencies, better-sqlite3, drizzle-kit, eslint, husky, lint-staged, nuxt, @nuxt/eslint (+11 more)

### Community 4 - "MonthPicker.vue"

Cohesion: 0.08
Nodes (15): dateDisplay, df, internalDate, modelValue, months, parsed, pickerYear, emits (+7 more)

### Community 5 - "index.vue"

Cohesion: 0.11
Nodes (15): ActivityCalendar, calendarInput, calendarStore, coreStore, dailyStore, { importingCalendar }, JiraExportModal, jiraStore (+7 more)

### Community 6 - "getDb"

Cohesion: 0.14
Nodes (19): getDb(), getJiraExportData(), upsertJiraExportData(), deleteDailyReport(), getAllMonthlySummaries(), getDailyActivitiesByDates(), getDailyReports(), getMonthlyActivityStatus() (+11 more)

### Community 7 - "Commands"

Cohesion: 0.08
Nodes (25): `add` — Add components, `apply` — Apply a preset to an existing project, `build` — Build a custom registry, code:bash (npx shadcn-vue@latest init [components...] [options]), code:bash (npx shadcn-vue@latest apply [preset] [options]), code:bash (npx shadcn-vue@latest add [components...] [options]), code:bash (npx shadcn-vue@latest search <registries...> [options]), code:bash (npx shadcn-vue@latest view <items...> [options]) (+17 more)

### Community 8 - "dependencies"

Cohesion: 0.08
Nodes (24): dependencies, class-variance-authority, clsx, date-fns, docx, drizzle-orm, exceljs, file-saver (+16 more)

### Community 9 - "Styling & Customization"

Cohesion: 0.08
Nodes (23): Built-in variants first, class for layout only, code:html (<div class="bg-blue-500 text-white">), code:html (<div), code:js (<script setup lang="ts">), code:html (<div class="bg-primary text-primary-foreground">), code:html (<span class="text-emerald-600">+20.1%</span>), code:html (<Badge variant="secondary">+20.1%</Badge>) (+15 more)

### Community 10 - "Component Composition"

Cohesion: 0.09
Nodes (22): Avatar always needs AvatarFallback, Button has no isPending or isLoading prop, Callouts use Alert, Card structure, Choosing between overlay components, code:html (<SelectContent>), code:html (<Avatar>), code:html (<Alert>) (+14 more)

### Community 11 - "Customization & Theming"

Cohesion: 0.08
Nodes (23): 1. Built-in variants, 2. Tailwind classes via `class`, 3. Add a new variant, 4. Wrapper components, Adding Custom Colors, Border Radius, Changing the Theme, code:js (<!-- nuxt.config.ts -->) (+15 more)

### Community 12 - "shadcn-vue"

Cohesion: 0.09
Nodes (22): CLI, code:json (!`npx shadcn-vue@latest info --json`), code:html (<!-- Form layout: FieldGroup + Field, not div + Label. -->), code:bash (npx shadcn-vue@latest docs button dialog select), code:bash (# Create a new project.), Component Docs, Examples, and Usage, Component Selection, Component Structure → [ui-composition.md](../../rules/ui-composition.md) (+14 more)

### Community 13 - "schema.ts"

Cohesion: 0.09
Nodes (21): calendarEvents, calendarEventsDateIdx, dailyReports, gitlabCommits, gitlabCommitsAuthorEmailIdx, gitlabCommitsCreatedAtIdx, holidays, holidaysDateIdx (+13 more)

### Community 14 - "Forms & Inputs"

Cohesion: 0.14
Nodes (15): Buttons inside inputs use InputGroup + InputGroupAddon, code:vue (<FieldGroup>), code:html (<!-- Invalid. -->), code:html (<InputGroup>), code:js (<script setup lang="ts">), code:html (<div class="relative">), code:html (<Field orientation="horizontal">), code:html (<fieldset>) (+7 more)

### Community 15 - "tauri.conf.json"

Cohesion: 0.09
Nodes (22): icons/128x128@2x.png, icons/128x128.png, icons/32x32.png, icons/icon.icns, icons/icon.ico, app, security, windows (+14 more)

### Community 16 - "🚀 Getting Started"

Cohesion: 0.12
Nodes (15): 1. Prerequisites, 2. Installation, 3. Environment Setup, 4. Running the Application, 5. Building for Production, code:bash (git clone https://github.com/deanufriana/presence.git), code:bash (cp .env.example .env), code:bash (npm run dev:tauri) (+7 more)

### Community 17 - "Tools"

Cohesion: 0.14
Nodes (13): code:bash (shadcn-vue mcp # start the MCP server (stdio)), code:json ({), Configuring Registries, Setup, shadcn MCP Server, `shadcn_vue:get_add_command_for_items`, `shadcn_vue:get_audit_checklist`, `shadcn_vue:get_item_examples_from_registries` (+5 more)

### Community 18 - "select/index.ts"

Cohesion: 0.07
Nodes (20): emits, forwarded, props, delegatedProps, emits, forwarded, props, delegatedProps (+12 more)

### Community 19 - "dialog/index.ts"

Cohesion: 0.08
Nodes (17): emits, forwarded, props, props, delegatedProps, forwardedProps, props, props (+9 more)

### Community 20 - "calendar/index.ts"

Cohesion: 0.07
Nodes (21): delegatedProps, emits, forwarded, props, delegatedProps, forwardedProps, props, delegatedProps (+13 more)

### Community 21 - "Icons"

Cohesion: 0.33
Nodes (6): code:html (<button>), code:js (<script setup lang="ts">), Icons, Icons in Button use data-icon attribute, No sizing classes on icons inside components, Pass icons as component objects, not string keys

### Community 22 - "alert-dialog/index.ts"

Cohesion: 0.09
Nodes (14): emits, forwarded, props, delegatedProps, emits, forwarded, props, delegatedProps (+6 more)

### Community 23 - "button/index.ts"

Cohesion: 0.12
Nodes (15): delegatedProps, props, delegatedProps, props, Props, ButtonVariants, delegatedProps, forwardedProps (+7 more)

### Community 24 - "Core Principles"

Cohesion: 0.25
Nodes (7): 1. Search Before Build, 2. Compose, Don't Reinvent, 3. Consistency Over Customization, Core Principles, Mandatory Tooling, UI Construction & Component Creation, Verification

### Community 25 - "scripts"

Cohesion: 0.11
Nodes (19): lint-staged, _.{js,ts,vue}, _.{js,ts,vue,css,scss,md}, name, private, scripts, build, build:tauri (+11 more)

### Community 26 - "permissions"

Cohesion: 0.12
Nodes (16): core:default, dialog:allow-save, dialog:default, fs:allow-write-file, fs:default, log:default, main, opener:default (+8 more)

### Community 27 - "DailyReport.vue"

Cohesion: 0.08
Nodes (18): BalanceActivitiesModal, calendarStore, copiedRows, coreStore, currentMonthStr, dailyStore, {
dailyTable,
summarizingRows,
syncingRows,
summarizingAll,
isLoading,
syncing,
showConfirmSync,
}, { exportToExcel, exporting } (+10 more)

### Community 28 - "utils/gitlab.ts"

Cohesion: 0.14
Nodes (20): getGitLabCommitsByPeriod(), upsertGitLabCommit(), getSetting(), getMonthRange(), fetchGitLab(), formatGitLabActivity(), getCommitRefs(), getGitLabCache() (+12 more)

### Community 29 - "open_url"

Cohesion: 0.25
Nodes (6): AppHandle, Result, open_url(), run(), main(), String

### Community 30 - "example.spec.ts"

Cohesion: 0.50
Nodes (3): main, mockTauri(), Window

### Community 31 - "59e27a32-5d32-46e7-b223-fe1593073fb1.json"

Cohesion: 0.40
Nodes (4): id, name, projectResources, resources

### Community 32 - "utils/index.ts"

Cohesion: 0.14
Nodes (9): props, props, AlertVariants, props, props, props, props, props (+1 more)

### Community 33 - "queries/calendar.ts"

Cohesion: 0.26
Nodes (12): deleteCalendarEventsByMonth(), deleteHolidayByDate(), getCalendarEventsByMonth(), getHolidaysByMonth(), insertCalendarEvent(), insertCalendarEvents(), upsertHoliday(), upsertManualHoliday() (+4 more)

### Community 34 - "SettingsModal.vue"

Cohesion: 0.15
Nodes (10): coreStore, fetchingModels, { fetchingProjects, allProjects }, fetchOllamaModels(), gitlabStore, jiraProjectInput, ollamaModels, { saving, settings, selectedProjectIds, selectedJiraProjects } (+2 more)

### Community 35 - "MonthlyReport.vue"

Cohesion: 0.10
Nodes (16): allocatedMDs, copiedRows, coreStore, dailyStore, { dailyTable }, { exportBASTToExcel, getWorkingDaysCount, exporting: exportingExcel }, { exportTaskJob, exportingDocx }, { isAiEnabled, selectedDate, dateDisplay, formatMonth } (+8 more)

### Community 36 - "DailyReportRow.vue"

Cohesion: 0.05
Nodes (27): ActivityItem, addInputRef, availableMonthDates, cancelAdding(), canMoveNext, canMovePrev, confirmAdd(), currentMonth (+19 more)

### Community 38 - "cn"

Cohesion: 0.10
Nodes (15): props, props, props, props, content, props, props, props (+7 more)

### Community 39 - "report.ts"

Cohesion: 0.18
Nodes (14): CalendarCache, CalendarDay, CalendarEvent, GitlabCache, GitLabEvent, Holiday, JiraEvent, JiraChildTask (+6 more)

### Community 40 - "tabs/index.ts"

Cohesion: 0.25
Nodes (5): delegatedProps, props, delegatedProps, forwardedProps, props

### Community 41 - "utils/jira.ts"

Cohesion: 0.15
Nodes (11): getJiraActivitiesByDates(), getJiraActivitiesByPeriod(), upsertJiraActivity(), JiraCache, formatJiraActivity(), JiraApiError, JiraConfig, JiraIssue (+3 more)

### Community 42 - "stores/calendar.ts"

Cohesion: 0.19
Nodes (11): { calendarBlanks, calendarDays }, calendarStore, coreStore, dailyStore, { pending: syncingAll, dateDisplay, selectedDate }, { syncingRows }, useCalendarStore, useCoreStore (+3 more)

### Community 44 - "YearlyActivityGrid.vue"

Cohesion: 0.16
Nodes (9): coreStore, getMonthTextClasses(), isNextYearDisabled, isSelected(), { selectedDate, viewMode }, { yearlyActivities, fetchingActivities, currentYear }, yearlyStore, useYearlyStore (+1 more)

### Community 45 - "Toast.vue"

Cohesion: 0.22
Nodes (6): copied, emits, forwarded, Props, showCopyButton, variantClass

### Community 47 - "TooltipContent.vue"

Cohesion: 0.14
Nodes (9): emits, forwarded, props, delegatedProps, emits, forwarded, props, props (+1 more)

### Community 48 - "use-toast.ts"

Cohesion: 0.29
Nodes (6): { success }, { toasts }, ToastProps, toasts, useToast(), useMonthlyStore

### Community 49 - "components.json"

Cohesion: 0.17
Nodes (11): aliases, components, utils, $schema, style, tailwind, baseColor, config (+3 more)

### Community 50 - "format.ts"

Cohesion: 0.20
Nodes (6): loadJiraConfig(), loadProjectIssueTypes(), parseProjectText(), stripMarkdownCodeBlock(), getJiraConfig(), getJiraIssueTypesForProject()

### Community 51 - "ai.ts"

Cohesion: 0.42
Nodes (7): AiOptions, generateDeepSeek(), generateGemini(), generateOllama(), generateOpenAi(), generateSummary(), stripThinking()

### Community 52 - "groupSubtasksWithAI"

Cohesion: 0.20
Nodes (10): closeModal(), emit, groupSubtasksWithAI(), isActivityRelated(), openSettings(), saveJiraExportData(), submitJiraIssue(), parseAiJsonResponse() (+2 more)

### Community 53 - "prompts.ts"

Cohesion: 0.25
Nodes (3): generateParentDescription(), getJiraGroupSubtasksPrompt(), getJiraParentDescriptionPrompt()

### Community 54 - "ManualActivityModal.vue"

Cohesion: 0.25
Nodes (5): dailyStore, {
selectedDayForEntry,
manualActivityText,
manualHolidayName,
isManualHoliday,
manualMasukText,
manualPulangText,
}, emits, modelValue, props

### Community 55 - "Checkbox.vue"

Cohesion: 0.33
Nodes (4): delegatedProps, emits, forwarded, props

### Community 56 - "FieldLabel.vue"

Cohesion: 0.33
Nodes (3): props, delegatedProps, props

### Community 57 - "DialogContent.vue"

Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 58 - "Tabs.vue"

Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 59 - "textarea/index.ts"

Cohesion: 0.40
Nodes (3): emits, modelValue, props

### Community 60 - "CalendarHeading.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 107 - "SelectScrollDownButton.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 108 - "SelectScrollUpButton.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 109 - "TabsContent.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

## Knowledge Gaps

- **598 isolated node(s):** `graphify`, `props`, `coreStore`, `dailyStore`, `calendarStore` (+593 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `BalanceActivitiesModal.vue`, `MonthPicker.vue`, `select/index.ts`, `dialog/index.ts`, `calendar/index.ts`, `alert-dialog/index.ts`, `button/index.ts`, `utils/index.ts`, `tabs/index.ts`, `TooltipContent.vue`, `ManualActivityModal.vue`, `Checkbox.vue`, `FieldLabel.vue`, `DialogContent.vue`, `Tabs.vue`, `textarea/index.ts`, `CalendarHeading.vue`, `SelectScrollDownButton.vue`, `SelectScrollUpButton.vue`, `TabsContent.vue`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `useToast()` connect `use-toast.ts` to `YearlyReport.vue`, `JiraExportModal.vue`, `MonthlyReport.vue`, `DailyReportRow.vue`, `stores/calendar.ts`, `YearlyActivityGrid.vue`, `DailyReport.vue`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`, `class-variance-authority`, `clsx`, `date-fns`, `docx`, `drizzle-orm`, `exceljs`, `lucide-vue-next`, `pinia`, `@pinia/nuxt`, `reka-ui`, `tailwind-merge`, `@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-http`, `@tauri-apps/plugin-sql`, `vue`, `vue-router`, `vuedraggable`, `@vueuse/core`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `graphify`, `props`, `coreStore` to the rest of the system?**
  _598 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `YearlyReport.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `BalanceActivitiesModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Should `JiraExportModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
