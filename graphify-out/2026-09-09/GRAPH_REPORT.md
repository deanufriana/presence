# Graph Report - presence (2026-09-09)

## Corpus Check

- 184 files · ~175,351 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1094 nodes · 1636 edges · 103 communities (59 shown, 44 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `30da194c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- SelectContent.vue
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
- alert/index.ts
- open_url
- example.spec.ts
- 59e27a32-5d32-46e7-b223-fe1593073fb1.json
- cn
- CalendarCell.vue
- SettingsModal.vue
- MonthlyReport.vue
- DailyReportRow.vue
- utils/index.ts
- report.ts
- Tabs.vue
- utils/jira.ts
- ActivityCalendar.vue
- YearlyActivityGrid.vue
- useDocxExport.ts
- husky.sh
- TooltipContent.vue
- core.ts
- components.json
- ai.ts
- format.ts
- saveJiraExportData
- prompts.ts
- SelectItem.vue
- FieldSeparator.vue
- Toast.vue
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

## God Nodes (most connected - your core abstractions)

1. `cn()` - 64 edges
2. `getDb()` - 43 edges
3. `useCoreStore` - 15 edges
4. `useToast()` - 14 edges
5. `Component Composition` - 13 edges
6. `scripts` - 12 edges
7. `Styling & Customization` - 12 edges
8. `permissions` - 11 edges
9. `shadcn-vue` - 11 edges
10. `useCalendarStore` - 10 edges

## Surprising Connections (you probably didn't know these)

- `groupSubtasksWithAI()` --calls--> `generateSummary()` [EXTRACTED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts
- `groupSubtasksWithAI()` --calls--> `parseAiJsonResponse()` [EXTRACTED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts
- `generateParentDescription()` --calls--> `generateSummary()` [EXTRACTED]
  app/components/report/JiraExportModal.vue → app/utils/ai.ts
- `Props` --references--> `ButtonVariants` [EXTRACTED]
  app/components/ui/button/Button.vue → app/components/ui/button/index.ts
- `insertCalendarEvent()` --calls--> `getDb()` [EXTRACTED]
  app/queries/calendar.ts → app/db/index.ts

## Import Cycles

- None detected.

## Communities (103 total, 44 thin omitted)

### Community 0 - "SelectContent.vue"

Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

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

Cohesion: 0.06
Nodes (57): getDb(), deleteCalendarEventsByMonth(), deleteHolidayByDate(), getCalendarEventsByMonth(), getHolidaysByMonth(), insertCalendarEvent(), insertCalendarEvents(), upsertHoliday() (+49 more)

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
Nodes (19): emits, forwarded, props, delegatedProps, props, props, props, delegatedProps (+11 more)

### Community 19 - "dialog/index.ts"

Cohesion: 0.07
Nodes (19): emits, forwarded, props, props, delegatedProps, emits, forwarded, props (+11 more)

### Community 20 - "calendar/index.ts"

Cohesion: 0.07
Nodes (21): delegatedProps, emits, forwarded, props, delegatedProps, forwardedProps, props, props (+13 more)

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

Cohesion: 0.10
Nodes (15): BalanceActivitiesModal, calendarStore, copiedRows, coreStore, dailyStore, {
dailyTable,
summarizingRows,
syncingRows,
summarizingAll,
isLoading,
syncing,
showConfirmSync,
}, dateObj, { exportToExcel, exporting } (+7 more)

### Community 28 - "alert/index.ts"

Cohesion: 0.29
Nodes (4): props, props, props, AlertVariants

### Community 29 - "open_url"

Cohesion: 0.25
Nodes (6): AppHandle, Result, open_url(), run(), main(), String

### Community 30 - "example.spec.ts"

Cohesion: 0.50
Nodes (3): main, mockTauri(), Window

### Community 31 - "59e27a32-5d32-46e7-b223-fe1593073fb1.json"

Cohesion: 0.40
Nodes (4): id, name, projectResources, resources

### Community 32 - "cn"

Cohesion: 0.17
Nodes (8): props, props, props, props, props, props, props, cn()

### Community 33 - "CalendarCell.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 34 - "SettingsModal.vue"

Cohesion: 0.05
Nodes (31): dailyStore, {
selectedDayForEntry,
manualActivityText,
manualHolidayName,
isManualHoliday,
manualMasukText,
manualPulangText,
}, coreStore, fetchingModels, { fetchingProjects, allProjects }, fetchOllamaModels(), gitlabStore, jiraProjectInput (+23 more)

### Community 35 - "MonthlyReport.vue"

Cohesion: 0.10
Nodes (13): copiedRows, coreStore, dailyStore, { dailyTable }, { exportBASTToExcel, exporting: exportingExcel }, { exportTaskJob, exportingDocx }, { isAiEnabled, selectedDate, dateDisplay, formatMonth }, jiraStore (+5 more)

### Community 36 - "DailyReportRow.vue"

Cohesion: 0.06
Nodes (27): ActivityItem, addInputRef, availableMonthDates, cancelAdding(), canMoveNext, canMovePrev, confirmAdd(), currentMonth (+19 more)

### Community 38 - "utils/index.ts"

Cohesion: 0.10
Nodes (14): props, props, props, props, content, props, props, props (+6 more)

### Community 39 - "report.ts"

Cohesion: 0.24
Nodes (12): useGitlabStore, CalendarCache, CalendarDay, CalendarEvent, GitlabCache, GitLabEvent, Holiday, JiraEvent (+4 more)

### Community 40 - "Tabs.vue"

Cohesion: 0.12
Nodes (12): delegatedProps, emits, forwarded, props, delegatedProps, forwardedProps, props, delegatedProps (+4 more)

### Community 41 - "utils/jira.ts"

Cohesion: 0.17
Nodes (8): useJiraStore, JiraCache, JiraApiError, JiraConfig, JiraIssue, JiraIssueType, JiraMyself, JiraProject

### Community 42 - "ActivityCalendar.vue"

Cohesion: 0.18
Nodes (7): { calendarBlanks, calendarDays }, calendarStore, coreStore, dailyStore, { pending: syncingAll, dateDisplay, selectedDate }, { syncingRows }, useDailyStore

### Community 44 - "YearlyActivityGrid.vue"

Cohesion: 0.17
Nodes (8): coreStore, getMonthTextClasses(), isNextYearDisabled, isSelected(), { selectedDate, viewMode }, { yearlyActivities, fetchingActivities, currentYear }, yearlyStore, useYearlyStore

### Community 45 - "useDocxExport.ts"

Cohesion: 0.39
Nodes (6): useDocxExport(), useExcelExport(), useCalendarStore, MonthlyReportRow, ReportRow, SettingsData

### Community 47 - "TooltipContent.vue"

Cohesion: 0.14
Nodes (9): emits, forwarded, props, delegatedProps, emits, forwarded, props, props (+1 more)

### Community 48 - "core.ts"

Cohesion: 0.29
Nodes (7): { success }, { toasts }, ToastProps, toasts, useToast(), useCoreStore, YearlyActivityMonth

### Community 49 - "components.json"

Cohesion: 0.17
Nodes (11): aliases, components, utils, $schema, style, tailwind, baseColor, config (+3 more)

### Community 50 - "ai.ts"

Cohesion: 0.31
Nodes (8): AiOptions, generateDeepSeek(), generateGemini(), generateOllama(), generateOpenAi(), generateSummary(), parseAiJsonResponse(), stripMarkdownCodeBlock()

### Community 51 - "format.ts"

Cohesion: 0.22
Nodes (5): loadJiraConfig(), loadProjectIssueTypes(), parseProjectText(), getJiraConfig(), getJiraIssueTypesForProject()

### Community 52 - "saveJiraExportData"

Cohesion: 0.29
Nodes (7): closeModal(), emit, openSettings(), saveJiraExportData(), submitJiraIssue(), buildAdfRowDescription(), createJiraIssue()

### Community 53 - "prompts.ts"

Cohesion: 0.20
Nodes (5): generateParentDescription(), groupSubtasksWithAI(), isActivityRelated(), getJiraGroupSubtasksPrompt(), getJiraParentDescriptionPrompt()

### Community 54 - "SelectItem.vue"

Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 55 - "FieldSeparator.vue"

Cohesion: 0.33
Nodes (3): props, delegatedProps, props

### Community 56 - "Toast.vue"

Cohesion: 0.33
Nodes (4): emits, forwarded, Props, variantClass

## Knowledge Gaps

- **591 isolated node(s):** `coreStore`, `dailyStore`, `calendarStore`, `{ calendarBlanks, calendarDays }`, `{ syncingRows }` (+586 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `SelectContent.vue`, `BalanceActivitiesModal.vue`, `CalendarCell.vue`, `SettingsModal.vue`, `MonthPicker.vue`, `utils/index.ts`, `Tabs.vue`, `TooltipContent.vue`, `select/index.ts`, `dialog/index.ts`, `calendar/index.ts`, `FieldSeparator.vue`, `alert-dialog/index.ts`, `button/index.ts`, `SelectItem.vue`, `alert/index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `getDb()` connect `getDb` to `ai.ts`, `report.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`, `class-variance-authority`, `clsx`, `date-fns`, `docx`, `drizzle-orm`, `exceljs`, `lucide-vue-next`, `pinia`, `@pinia/nuxt`, `reka-ui`, `tailwind-merge`, `@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-http`, `@tauri-apps/plugin-sql`, `vue`, `vue-router`, `vuedraggable`, `@vueuse/core`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `coreStore`, `dailyStore`, `calendarStore` to the rest of the system?**
  _591 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BalanceActivitiesModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Should `JiraExportModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
