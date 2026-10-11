# MMV Purchases product roadmap

## Shipped foundation

The README lists the currently implemented, testable local-first workflow. Prioritize clear calculations, reliable records, and a calm interface before adding external services.

## Next: deeper everyday tools

1. Receipt and warranty attachments using IndexedDB blob storage, with storage quotas, backup handling, and file-type validation.
2. CSV import with a preview, reusable column mapping, duplicate detection, and full validation before committing.
3. Custom category management, tags, bulk operations, saved filters, and per-category budgets.
4. Subscription price history, usage logs, explicit trial end dates, and monthly-versus-annual plan comparisons.
5. Repeating savings contribution schedules, goal milestones, and a scenario calculator.
6. Calendar week view, recurrence for custom events, timezone preferences, ICS export, and opt-in device notifications where supported.
7. Price-history tracking, product comparisons, cost-per-use tools, and a purchase decision journal.
8. Inventory, warranty/return deadlines, refunds, household shopping lists, and purchase maintenance.
9. Per-record change history, multiple undo steps, and a configurable trash retention policy.

## Later: accounts and collaboration

Cloud sync requires a backend, authentication, per-user authorization, migrations, and tested conflict resolution. Household collaboration, invitations, file storage, and cross-device reminders depend on that infrastructure. Do not bolt authentication onto browser-local storage and describe it as secure cloud storage.

## Optional AI integrations

The AI specification is a future integration plan. Current insights are explicit calculations, not model output. Before adding an assistant or receipt recognition:

- Introduce a server-side API, a securely configured model-provider key, and rate limits.
- Let the user opt in and choose which records are shared.
- Require review before applying extracted purchases, dates, or recommendations.
- Keep the core app functional offline and without AI credentials.
- Ground answers in saved data and explain assumptions.
- Do not claim access to live prices, bank transactions, or subscription cancellation without a working authorized integration.

## Deliberately absent from this version

Bank connections, automatic payments/transfers, live merchant pricing, cloud accounts, receipt OCR, PIN/biometric security, encrypted backups, background push delivery, multi-currency conversion, and automated financial advice. These need additional design and infrastructure beyond a static local-first app.
