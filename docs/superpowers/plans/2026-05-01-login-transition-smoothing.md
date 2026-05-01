# Login Transition Smoothing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the homepage login transition into a single smooth split-view animation without the timed intermediate state.

**Architecture:** Remove the `CARD_VIEW` transition state from layout state, update all login open/close entry points to target the final state directly, and simplify the large-surface motion in `LoginTransitionWrapper` to transform-and-opacity only. Add a focused regression test that prevents the timed state machine from coming back.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Framer Motion, Vitest

---

### Task 1: Lock the behavior with a regression test

**Files:**

- Create: `src/shared/layout/LoginTransitionWrapper.test.tsx`
- Test: `src/shared/layout/LoginTransitionWrapper.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "LoginTransitionWrapper.tsx"
)
const source = readFileSync(sourcePath, "utf8")

describe("LoginTransitionWrapper", () => {
  it("does not use a timed CARD_VIEW intermediate state", () => {
    expect(source).not.toContain("CARD_VIEW")
    expect(source).not.toContain("setTimeout(")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/shared/layout/LoginTransitionWrapper.test.tsx`
Expected: FAIL because `LoginTransitionWrapper.tsx` still contains `CARD_VIEW` and `setTimeout`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Remove the CARD_VIEW branch from the wrapper and direct callers
// to switch between HOME_FOCUS and SPLIT_VIEW only.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/shared/layout/LoginTransitionWrapper.test.tsx`
Expected: PASS

### Task 2: Simplify the layout state and entry points

**Files:**

- Modify: `src/state/LayoutContext.tsx`
- Modify: `src/shared/layout/SidebarSettings.tsx`
- Modify: `src/features/auth/components/LoginPanel.tsx`

- [ ] **Step 1: Remove the obsolete layout state**

```ts
export type ViewMode = "HOME_FOCUS" | "SPLIT_VIEW"
```

- [ ] **Step 2: Update login-open entry points**

```ts
onClick={() => setViewMode("SPLIT_VIEW")}
```

- [ ] **Step 3: Update login-success close path**

```ts
setViewMode("HOME_FOCUS")
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test:unit -- src/shared/layout/LoginTransitionWrapper.test.tsx`
Expected: PASS

### Task 3: Refine the split-view motion

**Files:**

- Modify: `src/shared/layout/LoginTransitionWrapper.tsx`

- [ ] **Step 1: Remove the timer-driven transition logic**

```ts
// Delete the effect that maps CARD_VIEW to SPLIT_VIEW/HOME_FOCUS.
```

- [ ] **Step 2: Replace multi-property surface animation with lighter variants**

```ts
const homeTransitionVariants = {
  home: { scale: 1, x: "0%", opacity: 1 },
  split: { scale: 0.94, x: "42%", opacity: 0.985 },
}

const loginPanelVariants = {
  home: { x: -32, opacity: 0, scale: 0.98 },
  split: { x: 0, opacity: 1, scale: 1 },
}
```

- [ ] **Step 3: Align close interaction with the new two-state model**

```ts
onClick={() => viewMode === "SPLIT_VIEW" && setViewMode("HOME_FOCUS")}
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test:unit -- src/shared/layout/LoginTransitionWrapper.test.tsx`
Expected: PASS

### Task 4: Validate the change

**Files:**

- Modify: `src/shared/layout/LoginTransitionWrapper.tsx`
- Modify: `src/features/auth/components/LoginPanel.tsx`
- Modify: `src/shared/layout/SidebarSettings.tsx`
- Modify: `src/state/LayoutContext.tsx`
- Test: `src/shared/layout/LoginTransitionWrapper.test.tsx`

- [ ] **Step 1: Run the touched tests**

Run: `npm run test:unit -- src/shared/layout/LoginTransitionWrapper.test.tsx src/shared/layout/sidebar/SidebarNavItem.test.tsx src/features/memos/components/MemoEditor.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint on touched files**

Run: `npx eslint src/state/LayoutContext.tsx src/shared/layout/LoginTransitionWrapper.tsx src/shared/layout/SidebarSettings.tsx src/features/auth/components/LoginPanel.tsx src/shared/layout/LoginTransitionWrapper.test.tsx`
Expected: no errors
