import { describe, expect, it } from 'vitest';
import { addMonths } from 'date-fns';
import {
  advanceDate,
  balance,
  blankEntry,
  calendarEvents,
  completeGoal,
  contribute,
  demoState,
  emptyState,
  entrySchema,
  monthlyCost,
  monthSpending,
  payment,
  purchaseCSV,
  saved,
  today,
  total,
  validateState,
} from '../src/model';
import type { Entry, Kind } from '../src/model';

const entry = (kind: Kind, extra: Partial<Entry> = {}): Entry => ({
  ...blankEntry(kind),
  name: 'Test record',
  amount: 100,
  date: '2026-01-31',
  anchorDay: 31,
  ...extra,
});
describe('Billing schedules', () => {
  it('keeps a monthly 31st anchor through February and restores March 31', () => {
    expect(advanceDate('2026-01-31', 'Monthly', 31)).toBe('2026-02-28');
    expect(advanceDate('2026-02-28', 'Monthly', 31)).toBe('2026-03-31');
  });
  it('handles leap years, quarterly cycles and year boundaries', () => {
    expect(advanceDate('2024-01-31', 'Monthly', 31)).toBe('2024-02-29');
    expect(advanceDate('2026-10-31', 'Quarterly', 31)).toBe('2027-01-31');
    expect(advanceDate('2024-02-29', 'Yearly', 29)).toBe('2025-02-28');
    expect(advanceDate('2026-12-28', 'Weekly', 28)).toBe('2027-01-04');
  });
  it('normalizes weekly and yearly estimates', () => {
    expect(monthlyCost(entry('subscription', { frequency: 'Weekly', amount: 12 }))).toBe(52);
    expect(monthlyCost(entry('subscription', { frequency: 'Yearly', amount: 120 }))).toBe(10);
  });
  it('records one payment and advances one billing period', () => {
    const sub = entry('subscription');
    const state = { ...emptyState(), entries: [sub] };
    const next = payment(state, sub.id, '2026-02-01');
    expect(next.entries[0].date).toBe('2026-02-28');
    expect(next.ledger).toHaveLength(1);
    expect(next.ledger[0]).toMatchObject({ kind: 'payment', amount: 100, date: '2026-02-01' });
    expect(state.ledger).toHaveLength(0);
  });
  it('rejects payments for paused or missing subscriptions', () => {
    const sub = entry('subscription', { status: 'Paused' });
    expect(() => payment({ ...emptyState(), entries: [sub] }, sub.id)).toThrow('not active');
    expect(() => payment(emptyState(), 'missing')).toThrow();
  });
});
describe('Savings and completed goals', () => {
  it('uses a ledger with precise deposits and withdrawals', () => {
    const fund = entry('fund');
    let state = { ...emptyState(), entries: [fund] };
    state = contribute(state, fund.id, 0.1, 'deposit');
    state = contribute(state, fund.id, 0.2, 'deposit');
    expect(balance(state, fund.id)).toBe(0.3);
    state = contribute(state, fund.id, 0.1, 'withdrawal');
    expect(balance(state, fund.id)).toBe(0.2);
    expect(() => contribute(state, fund.id, 1, 'withdrawal')).toThrow('greater than');
  });
  it('rejects invalid, zero, negative and infinite amounts', () => {
    const fund = entry('fund');
    const state = { ...emptyState(), entries: [fund] };
    for (const amount of [0, -1, Infinity, NaN])
      expect(() => contribute(state, fund.id, amount, 'deposit')).toThrow();
  });
  it('routes linked goal deposits into the fund exactly once', () => {
    const fund = entry('fund');
    const goal = entry('goal', { fundId: fund.id });
    const state = contribute({ ...emptyState(), entries: [fund, goal] }, goal.id, 50, 'deposit');
    expect(saved(state, goal)).toBe(50);
    expect(balance(state, fund.id)).toBe(50);
    expect(balance(state, goal.id)).toBe(0);
    expect(validateState(state)).toEqual(state);
  });
  it('records a completed goal as a purchase and withdraws savings', () => {
    const fund = entry('fund');
    const goal = entry('goal', { fundId: fund.id });
    const state = contribute({ ...emptyState(), entries: [fund, goal] }, goal.id, 120, 'deposit');
    const next = completeGoal(state, goal.id, 90, today());
    expect(balance(next, fund.id)).toBe(30);
    expect(next.entries.find((e) => e.id === goal.id)?.status).toBe('Purchased');
    expect(next.entries.find((e) => e.kind === 'purchase')).toMatchObject({
      status: 'Purchased',
      amount: 90,
    });
    expect(monthSpending(next, new Date())).toBe(90);
    expect(() => completeGoal(next, goal.id, 10)).toThrow('again');
  });
  it('does not complete a goal without enough recorded savings', () => {
    const goal = entry('goal');
    expect(() => completeGoal({ ...emptyState(), entries: [goal] }, goal.id, 100)).toThrow(
      'available balance',
    );
  });
});
describe('Reporting and calendar', () => {
  it('counts quantity and paid subscriptions, excluding plans and transfers', () => {
    const purchase = entry('purchase', { status: 'Purchased', quantity: 3, date: today() });
    const planned = entry('purchase', { status: 'Planned', date: today() });
    const sub = entry('subscription');
    const fund = entry('fund');
    let state = { ...emptyState(), entries: [purchase, planned, sub, fund] };
    state = payment(state, sub.id);
    state = contribute(state, fund.id, 10000, 'deposit');
    expect(total(purchase)).toBe(300);
    expect(monthSpending(state, new Date())).toBe(400);
    expect(monthSpending(state, addMonths(new Date(), -1))).toBe(0);
  });
  it('includes archived spending and excludes deleted purchases', () => {
    const a = entry('purchase', { status: 'Purchased', date: today(), archived: true });
    const b = entry('purchase', {
      status: 'Purchased',
      date: today(),
      deletedAt: new Date().toISOString(),
    });
    expect(monthSpending({ ...emptyState(), entries: [a, b] }, new Date())).toBe(100);
  });
  it('projects future renewals while omitting paused and completed records', () => {
    const sub = entry('subscription');
    const state = {
      ...emptyState(),
      entries: [
        sub,
        entry('subscription', { status: 'Paused' }),
        entry('event', { status: 'Completed' }),
      ],
    };
    const events = calendarEvents(state, '2026-02-01', '2026-04-30');
    expect(events.map((e) => e.date)).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });
});
describe('Data integrity and exports', () => {
  it('accepts the example workspace as a valid backup', () =>
    expect(validateState(demoState()).demo).toBe(true));
  it('rejects invalid calendar dates and totals', () => {
    expect(entrySchema.safeParse(entry('purchase', { date: '2026-02-30' })).success).toBe(false);
    expect(entrySchema.safeParse(entry('subscription', { amount: 0 })).success).toBe(false);
    expect(entrySchema.safeParse(entry('purchase', { amount: 1e12, quantity: 2 })).success).toBe(
      false,
    );
  });
  it('rejects two active goals sharing the same savings fund', () => {
    const fund = entry('fund');
    const state = {
      ...emptyState(),
      entries: [fund, entry('goal', { fundId: fund.id }), entry('goal', { fundId: fund.id })],
    };
    expect(() => validateState(state)).toThrow('multiple goals');
  });
  it('rejects missing references and duplicated IDs', () => {
    const fund = entry('fund');
    expect(() => validateState({ ...emptyState(), entries: [fund, fund] })).toThrow('Duplicate');
    expect(() =>
      validateState({ ...emptyState(), entries: [entry('goal', { fundId: 'missing' })] }),
    ).toThrow('missing');
  });
  it('escapes quotes, commas, newlines, and spreadsheet formulas in CSV', () => {
    const csv = purchaseCSV([entry('purchase', { name: '=SUM(1,2)', notes: 'one, "two"\nthree' })]);
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain('"one, ""two""\nthree"');
  });
  it('rejects malformed timestamps rather than crashing the report view', () => {
    expect(() =>
      validateState({
        ...emptyState(),
        activity: [{ id: '1', text: 'Example', date: 'bad-date' }],
      }),
    ).toThrow();
  });
});
