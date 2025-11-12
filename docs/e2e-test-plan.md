# E2E Test Plan

## Goals and scope
- Validate critical user journeys end-to-end in a realistic browser with the app server.
- Catch integration issues across UI, routing, API routes, auth, and database.
- Keep tests reliable and maintainable with clear selectors and stable waits.

In scope (current):
- Auth: sign in/sign out happy paths (credentials provider)
- Navigation: sidebar and top-level pages
- Profile: view and basic interactions
- Projects: create, view, update fields, list
- Tasks: create, edit, delete, status changes; drag & drop planned
- Finance: transactions page UI, dialogs planned

Out of scope (for now):
- Cross-browser matrix beyond Chromium
- Visual regression
- Performance budgets

## Environments & data
- Base URL: http://localhost:3051
- Browser: Chromium (headless in CI)
- Workers: 1, Retries: 1 (configured in Playwright)
- Test user: user@example.com / user123! (seeded via Prisma)
- Database: SQLite (dev.db) – tests should be self-contained and clean up where they create data

## Test scenarios

### 1. Authentication
- Sign in with valid credentials → lands on /dashboard
- Invalid password shows error (optional)
- Sign out returns to sign-in (optional)

### 2. Navigation
- Sidebar links navigate to: Dashboard, Analytics, Organization, Projects, Profile
- Breadcrumbs or “back to dashboard” buttons navigate correctly

### 3. Profile
- Displays user info after login
- Edit fields (if available) and save shows toast (optional)

### 4. Projects
- Create new project via dialog; form validation; success card appears
- Open a project (보기) and verify sections render (members, milestones, tasks)
- Update project fields (status/budget) and persist

### 5. Tasks
- Create task within a project
- Edit task via dialog and persist changes
- Delete task (confirm dialog)
- Drag & drop across columns (planned: see reliability section)

### 6. Finance
- Transactions page renders; dialog opens on “거래 추가”
- Submit transaction (planned): ensure form submits and list updates (or confirmation shown)

## Selector and synchronization strategy
- Prefer role-based or text-based selectors scoping to context containers:
  - Dialog: within dialog by querying role=dialog or aria labels, then descendants
  - Cards/sections: locate heading text, then use getByRole within the section
- Avoid broad page-level text queries in strict mode; use .first() when multiple matches are expected
- Replace networkidle with:
  - page.waitForLoadState('domcontentloaded') after navigation
  - Explicit waits for UI visibility: locator.waitFor({ state: 'visible' })
- Dialog interactions:
  - Wait for dialog to be visible before interacting
  - Click buttons within dialog container to avoid overlay interception

## Flake mitigation
- Keep retries=1; use deterministic waits rather than timeouts
- Use test ids sparingly when semantics are ambiguous (data-testid)
- Stabilize drag & drop by either:
  - Using Playwright’s dragAndDrop with forced pointer events
  - Or injecting a helper to simulate HTML5 DnD events (fallback)

## Skipped tests and plan to enable
- Finance dialog submission tests: add robust waits (DialogTitle/Description) and assert state changes
- Task drag & drop: add deterministic DnD helper and state assertions via data-status or aria attributes

## CI strategy
- Run unit/integration (Vitest) first; fail fast on backend issues
- Run E2E (Playwright) Chromium with workers=1, retries=1
- Collect HTML report and upload as artifact
- Optional: enable trace on first retry for flake triage

## Utilities & helpers
- login(page): fills #email and #password, submits, and waits for /dashboard
- selectWithin(container, role/text): helper to scope queries
- data setup/teardown: use API routes or direct Prisma calls in test setup where unavoidable (minimize)

## Maintenance guidelines
- Co-locate selectors with components if using data-testid; otherwise prefer semantic roles
- When UI copy changes, prefer role + visible name patterns that are less brittle
- Keep tests independent: create and clean up entities within each test when possible

## Try it
- Run E2E suite (Chromium):
  - pnpm exec playwright test --project=chromium
- Show last HTML report:
  - pnpm exec playwright show-report

## Current status (2025-11-05)
- Unit/Integration: 96/96 passed
- E2E active: 28/28 passed; 3 tests skipped (2 finance dialog, 1 drag & drop)
- Known non-blocking log: occasional dev-server JSON parse during HMR on tasks PUT (does not affect tests); consider catching empty bodies in route as hardening
