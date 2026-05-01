# Src Directory Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize `src/` into clear route, feature, server, shared, state, and config boundaries without changing runtime behavior.

**Architecture:** This is a path-only refactor executed in small batches. First move low-risk shared UI and hooks, then server actions, then client state, then review `lib/services/utils` for safe consolidation. Each batch must preserve behavior and update imports/tests immediately before moving to the next batch.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase, Vitest, ESLint, Prettier.

---

## Target Structure

```text
src/
  app/
  features/
  server/
    actions/
    services/
  shared/
    ui/
    layout/
    providers/
    hooks/
    lib/
    types/
  state/
  config/
```

## Boundary Rules

- `src/app/`: route files, layouts, pages, route-specific loading/error files, and page-level composition.
- `src/features/<domain>/`: domain UI, domain hooks, and domain-local state for `auth`, `memos`, `tags`, `trash`, `map`, and `gallery`.
- `src/server/actions/`: server actions grouped by domain. Files here may import from `src/server/services`, `src/shared/lib`, `src/shared/types`, `src/types`, and auth helpers, but client components must not import private helper functions.
- `src/server/services/`: server-only integrations and external service adapters.
- `src/shared/ui/`: reusable UI primitives and cross-domain presentational components.
- `src/shared/layout/`: reusable layout shell components used by routes.
- `src/shared/providers/`: app-level providers and registration components.
- `src/shared/hooks/`: reusable client hooks with no domain ownership.
- `src/shared/lib/`: pure utilities and browser-safe shared helpers.
- `src/shared/types/`: cross-domain shared TypeScript types. Keep generated database types in `src/types/database.ts` unless a separate task changes generation scripts.
- `src/state/`: cross-page client state contexts.
- `src/config/`: static application configuration.

## Files To Move By Batch

### Batch 1: Shared UI, layout, providers, hooks

- Move `src/components/ui/**` to `src/shared/ui/**`.
- Move `src/components/layout/**` to `src/shared/layout/**`.
- Move `src/components/providers/**` to `src/shared/providers/**`.
- Move `src/components/AgentationWrapper.tsx` to `src/shared/providers/AgentationWrapper.tsx`.
- Move `src/components/admin/**` to `src/features/admin/components/**` because these files are admin-specific UI, not generic shared UI.
- Move `src/hooks/use-toast.ts` to `src/shared/hooks/use-toast.ts`.
- Move `src/hooks/useHasMounted.ts` to `src/shared/hooks/useHasMounted.ts`.
- Move `src/hooks/useSidebarNavigation.ts` to `src/shared/hooks/useSidebarNavigation.ts`.

### Batch 2: Server actions

- Move `src/server/actions/memos/analytics.ts` to `src/server/actions/memos/analytics.ts`.
- Move `src/server/actions/memos/helpers.ts` to `src/server/actions/memos/helpers.ts`.
- Move `src/server/actions/memos/mutate.ts` to `src/server/actions/memos/mutate.ts`.
- Move `src/server/actions/memos/query.ts` to `src/server/actions/memos/query.ts`.
- Move `src/server/actions/memos/trash.ts` to `src/server/actions/memos/trash.ts`.
- Move `src/actions/shared/types.ts` to `src/server/actions/shared/types.ts`.
- Move `src/server/actions/usage/index.ts` to `src/server/actions/usage/index.ts`.
- Move `src/server/actions/memos/query.test.ts` to `src/server/actions/memos/query.test.ts`.
- Move `src/server/actions/memos/query.integrated.test.ts` to `src/server/actions/memos/query.integrated.test.ts`.
- Move `src/server/actions/memos/security.test.ts` to `src/server/actions/memos/security.test.ts` if it primarily checks memo visibility; otherwise move it to `src/server/actions/security.test.ts`.
- Move `src/server/actions/usage/index.test.ts` to `src/server/actions/usage/index.test.ts`.

### Batch 3: Global state

- Move `src/context/ExportContext.tsx` to `src/state/ExportContext.tsx`.
- Move `src/context/LayoutContext.tsx` to `src/state/LayoutContext.tsx`.
- Move `src/context/PageDataCache.tsx` to `src/state/PageDataCache.tsx`.
- Move `src/context/StatsContext.tsx` to `src/state/StatsContext.tsx`.
- Move `src/context/TagsContext.tsx` to `src/state/TagsContext.tsx`.
- Move `src/context/UIContext.tsx` to `src/state/UIContext.tsx`.
- Move `src/context/UnlockedMemosContext.tsx` to `src/state/UnlockedMemosContext.tsx`.
- Move `src/context/UserContext.tsx` to `src/state/UserContext.tsx`.

### Batch 4: Shared/server library review

- Keep `src/types/**` in place for now, especially `src/types/database.ts` because generation scripts write there.
- Keep `src/config/navigation.ts` in place.
- Review each `src/lib/*` file before moving. Do not move `src/lib/supabase.ts` until server/client usage is separated.
- Candidate shared utilities: `animation.ts`, `contentParser.ts`, `export-themes.ts`, `export-utils.ts`, `layout-preferences.ts`, `link-preview.ts`, `location-cache.ts`, `memo-cache.ts`, `share.ts`, `streamUtils.ts`, `utils.ts`.
- Candidate domain library: `src/lib/memos/**` may move to `src/features/memos/lib/**` only if server actions and client features can both import it without creating client/server boundary issues.
- Candidate server service: `src/services/import/**` may move to `src/server/services/import/**` if it is not imported by client components.
- Candidate middleware helper: `src/utils/supabase/middleware.ts` may move to `src/server/services/supabase/middleware.ts` if all imports are server-only.

---

### Task 1: Establish Baseline

**Files:**

- Read: `package.json`
- Read: `docs/guide/testing.md`

- [ ] **Step 1: Check current git status**

Run:

```bash
git status --short
```

Expected: either no output or only user-known changes. Stop and ask before continuing if unrelated changes exist.

- [ ] **Step 2: Run baseline type/lint/test checks**

Run:

```bash
npm run lint
npm run test:unit
```

Expected: both commands pass before the refactor. If either fails, record the existing failure and continue only if the failure is unrelated to path changes.

---

### Task 2: Move Shared UI And Hooks

**Files:**

- Move: `src/components/ui/**` to `src/shared/ui/**`
- Move: `src/components/layout/**` to `src/shared/layout/**`
- Move: `src/components/providers/**` to `src/shared/providers/**`
- Move: `src/components/AgentationWrapper.tsx` to `src/shared/providers/AgentationWrapper.tsx`
- Move: `src/components/admin/**` to `src/features/admin/components/**`
- Move: `src/hooks/**` to `src/shared/hooks/**`
- Modify: all imports that reference `@/components/ui`, `@/components/layout`, `@/components/providers`, `@/components/admin`, `@/components/AgentationWrapper`, or `@/hooks`

- [ ] **Step 1: Create target directories**

Run:

```bash
mkdir -p src/shared/ui src/shared/layout src/shared/providers src/shared/hooks src/features/admin/components
```

Expected: directories exist.

- [ ] **Step 2: Move shared UI files**

Run:

```bash
git mv src/components/ui src/shared/ui_tmp && git mv src/shared/ui_tmp/* src/shared/ui/ && rmdir src/shared/ui_tmp
```

Expected: `src/shared/ui` contains the previous UI files.

- [ ] **Step 3: Move layout files**

Run:

```bash
git mv src/components/layout src/shared/layout_tmp && git mv src/shared/layout_tmp/* src/shared/layout/ && rmdir src/shared/layout_tmp
```

Expected: `src/shared/layout` contains the previous layout files.

- [ ] **Step 4: Move provider files**

Run:

```bash
git mv src/components/providers src/shared/providers_tmp && git mv src/shared/providers_tmp/* src/shared/providers/ && rmdir src/shared/providers_tmp
```

Expected: `src/shared/providers` contains `PWARegistration.tsx` and `ThemeProvider.tsx`.

- [ ] **Step 5: Move admin components**

Run:

```bash
git mv src/components/admin src/features/admin/components
```

Expected: `src/features/admin/components` contains `UsageModal.tsx` and `UsageProgress.tsx`.

- [ ] **Step 6: Move root provider wrapper**

Run:

```bash
git mv src/components/AgentationWrapper.tsx src/shared/providers/AgentationWrapper.tsx
```

Expected: `src/shared/providers/AgentationWrapper.tsx` exists.

- [ ] **Step 7: Move shared hooks**

Run:

```bash
git mv src/hooks/use-toast.ts src/shared/hooks/use-toast.ts
git mv src/hooks/useHasMounted.ts src/shared/hooks/useHasMounted.ts
git mv src/hooks/useSidebarNavigation.ts src/shared/hooks/useSidebarNavigation.ts
rmdir src/hooks
```

Expected: `src/shared/hooks` contains the three hook files.

- [ ] **Step 8: Update import prefixes**

Apply these import prefix replacements across `src/**/*.ts` and `src/**/*.tsx`:

```text
@/components/ui/ -> @/shared/ui/
@/components/layout/ -> @/shared/layout/
@/components/providers/ -> @/shared/providers/
@/components/admin/ -> @/features/admin/components/
@/components/AgentationWrapper -> @/shared/providers/AgentationWrapper
@/hooks/ -> @/shared/hooks/
```

Expected examples:

```ts
import { ThemeProvider } from "@/shared/providers/ThemeProvider"
import { Toaster } from "@/shared/ui/toaster"
import { useToast } from "@/shared/hooks/use-toast"
```

- [ ] **Step 9: Update relative imports inside moved files**

Inspect moved files for imports that still point to old locations. Expected local imports remain relative where they target siblings, for example:

```ts
import { Button } from "./button"
import { BaseFloatingCapsule } from "./BaseFloatingCapsule"
```

Expected external imports use the new aliases, for example:

```ts
import { useToast } from "@/shared/hooks/use-toast"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
```

- [ ] **Step 10: Run focused checks**

Run:

```bash
npm run lint
npm run test:unit -- src/shared/layout/sidebar/SidebarNavItem.test.tsx
```

Expected: lint passes and the moved sidebar test passes. If the test command syntax is not supported by the npm script, run `dotenv -e .env.local -- vitest run src/shared/layout/sidebar/SidebarNavItem.test.tsx`.

---

### Task 3: Move Server Actions

**Files:**

- Move: `src/actions/memos/**` to `src/server/actions/memos/**`
- Move: `src/actions/shared/types.ts` to `src/server/actions/shared/types.ts`
- Move: `src/server/actions/usage/index.ts` to `src/server/actions/usage/index.ts`
- Move tests listed in Batch 2.
- Modify: all imports that reference `@/actions` or relative `../shared/types` inside moved action files.
- Modify: `package.json` test scripts for renamed integration test paths.
- Modify: `docs/guide/testing.md` test path references.

- [ ] **Step 1: Create target directories**

Run:

```bash
mkdir -p src/server/actions/memos src/server/actions/shared src/server/actions/usage
```

Expected: target directories exist.

- [ ] **Step 2: Move memo action implementation files**

Run:

```bash
git mv src/server/actions/memos/analytics.ts src/server/actions/memos/analytics.ts
git mv src/server/actions/memos/helpers.ts src/server/actions/memos/helpers.ts
git mv src/server/actions/memos/mutate.ts src/server/actions/memos/mutate.ts
git mv src/server/actions/memos/query.ts src/server/actions/memos/query.ts
git mv src/server/actions/memos/trash.ts src/server/actions/memos/trash.ts
rmdir src/actions/memos
```

Expected: all memo action implementation files live under `src/server/actions/memos`.

- [ ] **Step 3: Move shared action type**

Run:

```bash
git mv src/actions/shared/types.ts src/server/actions/shared/types.ts
rmdir src/actions/shared
```

Expected: `src/server/actions/shared/types.ts` exists.

- [ ] **Step 4: Move usage action**

Run:

```bash
git mv src/server/actions/usage/index.ts src/server/actions/usage/index.ts
```

Expected: `src/server/actions/usage/index.ts` exists.

- [ ] **Step 5: Move action tests**

Run:

```bash
git mv src/server/actions/memos/query.test.ts src/server/actions/memos/query.test.ts
git mv src/server/actions/memos/query.integrated.test.ts src/server/actions/memos/query.integrated.test.ts
git mv src/server/actions/memos/security.test.ts src/server/actions/memos/security.test.ts
git mv src/server/actions/usage/index.test.ts src/server/actions/usage/index.test.ts
rmdir src/actions
```

Expected: no `src/actions` directory remains.

- [ ] **Step 6: Update action import prefixes**

Apply these import prefix replacements across `src/**/*.ts` and `src/**/*.tsx`:

```text
@/server/actions/memos/ -> @/server/actions/memos/
@/server/actions/usage -> @/server/actions/usage
@/server/actions/shared/ -> @/server/actions/shared/
```

Expected examples:

```ts
import { getMemos } from "@/server/actions/memos/query"
import { getMemoStats } from "@/server/actions/memos/analytics"
import { getSupabaseUsageStats } from "@/server/actions/usage"
```

- [ ] **Step 7: Update relative shared type imports inside server actions**

In moved files under `src/server/actions/memos`, imports should use:

```ts
import { ActionResponse } from "../shared/types"
```

In `src/server/actions/usage/index.ts`, the import should use:

```ts
import { ActionResponse } from "../shared/types"
```

Expected: no moved action file imports `../shared/types` from an invalid depth and no file imports `@/server/actions/shared/types`.

- [ ] **Step 8: Update test mocks and imports**

In moved tests, update old action paths to new paths. Expected examples:

```ts
import { getMemos } from "@/server/actions/memos/query"
import { getSupabaseUsageStats } from "@/server/actions/usage"
vi.mock("@/server/actions/memos/query", () => ({ getMemos: vi.fn() }))
```

- [ ] **Step 9: Update test scripts**

Modify `package.json` scripts from old integration paths to new paths:

```json
"test:unit": "dotenv -e .env.local -- vitest run --exclude src/server/actions/memos/query.integrated.test.ts --exclude src/server/actions/memos/security.test.ts",
"test:watch": "dotenv -e .env.local -- vitest --exclude src/server/actions/memos/query.integrated.test.ts --exclude src/server/actions/memos/security.test.ts",
"test:integration": "dotenv -e .env.local -- vitest run src/server/actions/memos/query.integrated.test.ts src/server/actions/memos/security.test.ts",
"test:prod": "dotenv -e .env.remote -- vitest run --exclude src/server/actions/memos/query.integrated.test.ts --exclude src/server/actions/memos/security.test.ts"
```

Expected: no script references `src/server/actions/memos/query.integrated.test.ts` or `src/server/actions/memos/security.test.ts`.

- [ ] **Step 10: Update testing documentation**

Modify `docs/guide/testing.md` path examples:

```text
src/server/actions/memos/query.integrated.test.ts
src/server/actions/memos/security.test.ts
src/server/actions/memos/query.test.ts
src/server/actions/usage/index.test.ts
```

Expected: no testing docs reference old `src/actions/*.test.ts` paths.

- [ ] **Step 11: Run focused server action tests**

Run:

```bash
dotenv -e .env.local -- vitest run src/server/actions/memos/query.test.ts src/server/actions/usage/index.test.ts
```

Expected: both moved unit tests pass.

- [ ] **Step 12: Run action integration tests if local Supabase is available**

Run:

```bash
npm run test:integration
```

Expected: integration tests pass. If local Supabase is unavailable, record the environment blocker and do not mark integration verification as completed.

---

### Task 4: Move Global Context To State

**Files:**

- Move: `src/context/*.tsx` to `src/state/*.tsx`
- Modify: all imports that reference `@/context/`

- [ ] **Step 1: Create target directory**

Run:

```bash
mkdir -p src/state
```

Expected: `src/state` exists.

- [ ] **Step 2: Move context files**

Run:

```bash
git mv src/context/ExportContext.tsx src/state/ExportContext.tsx
git mv src/context/LayoutContext.tsx src/state/LayoutContext.tsx
git mv src/context/PageDataCache.tsx src/state/PageDataCache.tsx
git mv src/context/StatsContext.tsx src/state/StatsContext.tsx
git mv src/context/TagsContext.tsx src/state/TagsContext.tsx
git mv src/context/UIContext.tsx src/state/UIContext.tsx
git mv src/context/UnlockedMemosContext.tsx src/state/UnlockedMemosContext.tsx
git mv src/context/UserContext.tsx src/state/UserContext.tsx
rmdir src/context
```

Expected: `src/state` contains all previous context files and `src/context` no longer exists.

- [ ] **Step 3: Update state import prefixes**

Apply this import prefix replacement across `src/**/*.ts` and `src/**/*.tsx`:

```text
@/context/ -> @/state/
```

Expected examples:

```ts
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useStats } from "@/state/StatsContext"
```

- [ ] **Step 4: Update imports inside state files**

Inspect `src/state/*.tsx` and update any imports that still point to old shared or action locations. Expected examples:

```ts
import { getMemoStats } from "@/server/actions/memos/analytics"
import { shouldRefreshMemoDerivedData, useMemoSync } from "@/lib/memos/events"
```

- [ ] **Step 5: Run focused checks**

Run:

```bash
npm run lint
npm run test:unit
```

Expected: lint and unit tests pass.

---

### Task 5: Review Lib, Services, And Utils Boundaries

**Files:**

- Review: `src/lib/**`
- Review: `src/services/**`
- Review: `src/utils/**`
- Optional Move: only files proven safe by import direction.

- [ ] **Step 1: Inventory imports for library candidates**

Run:

```bash
rg "@/lib/|@/services/|@/utils/" src --glob "*.ts" --glob "*.tsx"
```

Expected: a list of current consumers. Do not move a file if it is imported from both server-only and client components and the target would blur that boundary.

- [ ] **Step 2: Keep `src/lib/supabase.ts` in place**

No code change. Expected decision: keep `src/lib/supabase.ts` because it may be used by server and client paths and needs a dedicated split before moving.

- [ ] **Step 3: Move pure shared libraries only if imports are browser-safe**

If import inventory shows a file is pure and browser-safe, move it to `src/shared/lib`. Recommended first candidates:

```text
src/lib/animation.ts
src/lib/contentParser.ts
src/lib/export-themes.ts
src/lib/export-utils.ts
src/lib/layout-preferences.ts
src/lib/link-preview.ts
src/lib/location-cache.ts
src/lib/memo-cache.ts
src/lib/share.ts
src/lib/streamUtils.ts
src/lib/utils.ts
```

Expected: each moved file has its matching test moved with it, for example `src/lib/share.test.ts` moves with `src/lib/share.ts`.

- [ ] **Step 4: Do not move `src/lib/memos/**` in this pass\*\*

No code change. Expected decision: keep `src/lib/memos/**` until a separate server/client boundary review decides whether it belongs in `features/memos/lib`, `shared/lib/memos`, or split locations.

- [ ] **Step 5: Review import service ownership**

Check whether `src/services/import/importService.ts` and `src/services/import/parsers.ts` are imported by client components. If server-only, move them to:

```text
src/server/services/import/importService.ts
src/server/services/import/parsers.ts
```

Expected: imports update from `@/services/import/...` to `@/server/services/import/...` only if server-only is confirmed.

- [ ] **Step 6: Review Supabase middleware helper ownership**

Check consumers of `src/utils/supabase/middleware.ts`. If it is middleware/server-only, move it to:

```text
src/server/services/supabase/middleware.ts
```

Expected: imports update from `@/utils/supabase/middleware` to `@/server/services/supabase/middleware` only if server-only is confirmed.

- [ ] **Step 7: Run broad checks**

Run:

```bash
npm run lint
npm run test:unit
npm run build
```

Expected: lint, unit tests, and build pass.

---

### Task 6: Final Documentation And Verification

**Files:**

- Modify: `docs/guide/testing.md` if test paths changed.
- Optional Modify: `docs/guide/standards.md` if it documents source layout.

- [ ] **Step 1: Search for old path references**

Run:

```bash
rg "@/components|@/hooks|@/actions|@/context|src/components|src/hooks|src/actions|src/context" src docs package.json
```

Expected: no old references remain, except historical text that is intentionally left in docs. If historical text remains, make it explicit that it refers to previous layout or update it.

- [ ] **Step 2: Run final validation**

Run:

```bash
npm run lint
npm run test:unit
npm run build
```

Expected: all pass.

- [ ] **Step 3: Run integration validation**

Run:

```bash
npm run test:integration
```

Expected: integration tests pass when local Supabase is available. If unavailable, final handoff must say integration tests were not run and why.

- [ ] **Step 4: Review git diff**

Run:

```bash
git diff --stat
git diff --name-status
```

Expected: diff is mostly file renames and import path updates. No behavior changes should appear.

- [ ] **Step 5: Manual smoke check for UI route composition**

Run:

```bash
npm run dev
```

Expected: the app starts. Manually open the home route, memo list, map route, trash route, and admin usage UI if accessible. Confirm no missing module errors in browser or terminal.

---

## Self-Review

- Spec coverage: The plan covers shared UI/hooks, server actions/tests, global state, and cautious review of `lib/services/utils`.
- Placeholder scan: No steps use open-ended placeholders; review-only steps include explicit decisions and candidate paths.
- Type consistency: New import prefixes are consistent: `@/shared/*`, `@/server/actions/*`, `@/state/*`, and existing `@/lib/memos/*` remains unchanged until a later boundary review.
