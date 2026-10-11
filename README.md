# MMV Purchases

A warm Gruvbox workspace for thoughtful spending and purposeful saving. Built with React, TypeScript, and Vite; deployable as a static app on Vercel.

## Run locally

Use Node.js 24 (or 22.12+).

```sh
npm ci
npm run dev
```

The development server uses port 5173. `npm run build` type-checks and creates `dist/`. `npm run preview -- --port 4173` serves the production build.

## What works

- **Overview:** current-month spending, budget remaining, normalized subscription costs, six-month spending chart, upcoming commitments, and savings goals.
- **Purchases:** create/edit, unit price × quantity, categories, vendors, priority, notes, planned/purchased/postponed/cancelled status, duplicate, pin, archive, recoverable trash, sorting/filtering, and CSV export.
- **Subscriptions:** weekly/monthly/quarterly/yearly cycles, active/trial/paused/cancelled status, monthly and annual estimates, payment history, and date advancement with month-end handling.
- **Savings:** separate funds, target amounts, deposits and withdrawals, transaction history, progress, and a planned contribution amount/date.
- **Purchase goals:** target dates, priority, required monthly contributions, independent savings or a linked fund, and completion at the actual price. Completion creates a purchase and a savings withdrawal.
- **Calendar:** monthly calendar, a daily agenda, custom events, completion, module filters, and projected recurring subscription dates.
- **Reports:** monthly recorded spending, category totals, average purchase size, spending history, transparent calculated observations, and an activity journal.
- **Settings:** budget, UZS/USD/EUR/GBP display, Google Sans/Samsung Sans/Arial/system font preferences, dark/light appearance, backup export/validated restore, storage summary, and sample data/reset controls.
- **Across the app:** global search, mobile navigation, keyboard-accessible dialogs, visible focus, reduced-motion support, amount masking, confirmation for destructive operations, one-step undo, and an offline application shell.

The initial workspace contains **clearly labeled sample data**. Choose **Start fresh** to remove it. Records are saved when changed.

## Data and calculations

Data is stored in this browser's local storage, with schema validation before writing or restoring. It is not synchronized between devices, encrypted, or connected to a bank. Export JSON backups regularly. A backup includes private financial data in readable form; keep it somewhere appropriate. Unreadable existing storage is preserved for recovery rather than silently overwritten.

- Purchases count toward spending only when marked Purchased. Archived purchases still count; trashed purchases do not.
- Subscription estimates are separate from actual recorded payments. “Mark paid” records one payment on today's date and advances one period. Overdue periods remain visible until recorded. Weekly costs normalize using 52/12.
- Currency preferences change the display unit, **not** the value. There are no exchange rates.
- Deposits/withdrawals are manual records, not bank transfers. Withdrawals cannot exceed the recorded balance.
- A fund can connect to only one non-deleted goal. Linked goals use the fund ledger; total savings does not count that money twice.
- Goal completion requires enough recorded savings for the entered actual price. It preserves the goal target and creates an expense plus withdrawal.
- Monthly contribution estimates divide the outstanding target by the remaining number of 30-day periods, rounded up with a minimum of one. They do not assume investment returns or future income.
- Budgets compare actual recorded expenses with the configured limit. Planned purchases and unrecorded subscription bills are not deducted from the remaining budget.
- Subscription status changes do not cancel an external service or initiate payments.
- Reminders are in-app. There are no background push notifications. Savings contribution calendar entries represent the next manually configured date, not automated deposits.
- The offline shell is available after a successful online production visit. It cannot recover data after browser storage is cleared.

Google Sans and Samsung Sans are selected only when locally installed. No licensed font files are redistributed; Arial is the default fallback.

## Validation

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

If Chromium is already installed, avoid downloading another copy:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Domain tests cover billing boundaries, payment history, ledger balances, linked goals, purchase completion, reporting, backup integrity, and safe CSV escaping. Browser tests cover create/update workflows, persistence, trash/restore/undo, savings and goals, settings, mobile navigation, and offline reloads.

## Deploy to Vercel

`vercel.json` defines the build, output directory, and security headers. No application environment variables are required.

1. Push this repository to a new GitHub repository such as `MainMMV/mmv-purchases`.
2. Import it as a **new** Vercel project, with the Vite preset, `npm run build`, and `dist` output.
3. Choose Node.js 24 and deploy. The production site stores each visitor's data in their own browser.

The cloud environment's injected GitHub integration currently cannot create a repository: GitHub returned `Resource not accessible by integration` through both creation APIs. The intended new repository has not been created remotely. A local Git repository is prepared separately from the existing `MMVpurchase` checkout.

Vercel API access is reachable, but no Vercel token is currently configured. Add `VERCEL_TOKEN` securely in cloud environment settings, or connect/import through Vercel's dashboard. Never paste a token into chat or commit it to this repository. Hosting is not live until deployment succeeds.

## Product direction

The original user-provided specifications are preserved in [docs/specifications](docs/specifications). The [roadmap](docs/ROADMAP.md) distinguishes shipped features from future work. This version does not represent every item in those expansive feature lists as implemented.

Cloud development tasks are already isolated. Use this checkout directly; do not create a Git worktree unless explicitly requested.
