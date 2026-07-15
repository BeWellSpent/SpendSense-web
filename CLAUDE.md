# CLAUDE.md — WellSpent-web

React + Next.js frontend for WellSpent.

## Commands

```bash
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run lint         # run ESLint
npm run generate     # pull proto from BSR and generate TypeScript types into src/gen/
```

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run generate                    # generate proto types
npm run dev
```

**Note:** The backend must allow CORS from `http://localhost:3000` for local dev.
Run `make run` in `WellSpent-backend/` to start the API on port 8080.

## Architecture

- **Next.js 16 App Router** — `src/app/` with route groups `(auth)` and `(app)`
- **Auth** — JWT stored as `httpOnly` cookie; set via `/api/auth/set-token`, cleared via `/api/auth/logout`
- **ConnectRPC** — transport created in `AuthContext` with `Authorization: Bearer` interceptor; hooks via `@connectrpc/connect-query`
- **MUI v5** — theme and emotion cache configured in `ThemeRegistry`
- **Feature flags** — `src/lib/config/features.ts` reads `NEXT_PUBLIC_FEATURE_*` env vars

## Key patterns

**Auth guard:** `src/app/(app)/layout.tsx` reads the httpOnly cookie server-side. If missing, redirects to `/login`. Passes token to `AuthProvider` which creates the ConnectRPC transport.

**API calls:** Use `useQuery` / `useMutation` from `@connectrpc/connect-query`. The transport is provided by `AuthProvider` → `TransportProvider`.

**Feature flags:**
```typescript
import { isEnabled } from '@/lib/config/features'
if (isEnabled('googleAuth')) { ... }
```

**Logging:**
```typescript
import { logger } from '@/lib/logger'
logger.info('budget.create', { budgetId })
```

## Component composition (required on every feature)

A file mixing more than one visual section or responsibility, or copy-pasted
across files, is a defect — not a style preference. This is non-negotiable in
the same way mobile support is: don't let a panel grow past ~200-300 lines
without splitting it, and don't let a task finish with dead code left behind.
(This codebase accumulated several 900-1200 line files with multiple
components inlined before a cleanup pass fixed it — see the "refactor:
composition + dead-code cleanup" PR for the reference shape of a proper split.)

- **One concern per file.** A panel component that renders a list, an add
  dialog, and an edit dialog should be three files: `XPanel.tsx` plus
  `xPanel/AddXDialog.tsx` and `xPanel/EditXDialog.tsx` (or similar). Dialogs
  own their own draft/form state and call back with the final value on
  confirm — don't thread `draftName`/`draftColor`-style state through the
  parent just because the dialog used to be inline.
- **Extract before you duplicate.** If you're about to write the same
  `useMediaQuery(theme.breakpoints.down('sm'))` pair, the same color-by-ratio
  function, or the same per-row derivation logic in a second place (e.g. a
  mobile card list and a desktop table computing the same "is this overdue"
  flag independently), stop and extract a shared hook/helper instead. Two
  near-identical blocks computing the same thing is a bug waiting to happen
  when one gets updated and the other doesn't.
- **Pure logic goes in plain `.ts` helper files**, not inline in the
  component — formatting, sorting/filtering, color/threshold logic, data
  shaping. This makes it independently testable without mocking
  `next-intl`/`react-query`/`next/navigation` just to exercise a function
  that doesn't use any of them.
- **No dead code.** Before calling a feature done, check that every file,
  export, and handler you touched is actually reachable. Run `npx knip`
  (`npx --yes knip` if not installed) to catch unused files/exports; a
  superseded component (e.g. an old "Add" modal replaced by a combined
  "Add/Edit" one) must be deleted in the same change, not left orphaned.
- **Established shared hooks** — reuse these instead of re-inlining the
  pattern: `useIsMobile()` (`src/hooks/useIsMobile.ts`) for the `sm`
  breakpoint check, `useCurrency()` (`src/hooks/useCurrency.ts`) for the
  user's saved currency/locale when formatting money (never hardcode
  `en-US`/`USD` — use `formatMoney`/`formatMoneyFromNumber` from
  `src/lib/format.ts`).

## Git workflow

`main` is production. Never commit or push directly to `main`.

**Before starting any work:**

```bash
git checkout develop
git pull origin develop
```

**Final steps after implementation:**

```bash
# Run checks first
npm run build
npm run lint

# Stage specific files (never git add -A)
git add src/... messages/...

# Commit and push
git commit -m "feat: meaningful description of what changed"
git push origin develop

# Create PR from develop → main and immediately enable auto-merge
gh pr create --base main --head develop --title "Short title" --body "Description"
gh pr merge develop --auto --merge
```

- Always pull `develop` before starting — never work from a stale base
- Commit directly to `develop`; never commit directly to `main`
- `gh pr merge --auto` enables auto-merge — the PR lands once CI passes; no manual merge needed
- Never merge PRs manually — always let auto-merge handle it after checks pass

## Generated files — do not edit

`src/gen/` — generated by `npm run generate` from `buf.build/bewellspent/wellspent`

## Mobile + desktop support (required on every feature)

Every UI change must work on both mobile and desktop. This is non-negotiable — if a spec or task doesn't address responsive behaviour, challenge it before implementing.

Established patterns:
- **Breakpoint**: `sm` is the mobile/desktop boundary. Use the shared `useIsMobile()` hook (`src/hooks/useIsMobile.ts`) for conditional rendering — don't re-inline `useTheme()` + `useMediaQuery(theme.breakpoints.down('sm'))`; use `sx={{ prop: { xs: mobileValue, sm: desktopValue } }}` for CSS-only differences. (A different breakpoint, e.g. `BudgetSidebar`'s `md`, still needs the raw `useMediaQuery` call — `useIsMobile()` is specifically the `sm` check.)
- **Dialogs**: all `<Dialog>` components must include `fullScreen={useIsMobile()}`.
- **Layout**: the sidebar collapses to a bottom nav on mobile (`BudgetSidebar` handles this via `isMobile`). Content uses `px: { xs: 1, sm: 3 }` to avoid edge-to-edge crowding.
- **FABs**: fixed-position FABs use `bottom: { xs: 80, sm: 24 }` to clear the mobile bottom nav.
- **Tables**: consider a compact stacked-row layout on mobile when a desktop table has many columns (see `TransactionsPanel` for the pattern).
- **Full-height containers**: use `100dvh`, never `100vh`, for any `minHeight`/`height` meant to fill the screen (see `BudgetSidebar`'s root `Box`). `100vh` locks in the largest-possible viewport and doesn't reliably shrink back after the on-screen keyboard opens and closes (common on any view with `autoFocus` text fields, like inline amount editors) — on mobile Chrome this left stale reserved height below the real content, fully scrollable but empty, with no correlation to any padding/margin value. `100dvh` tracks the actual current visual viewport instead.
