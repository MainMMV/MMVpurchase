import {
  addDays,
  addMonths,
  format,
  isValid,
  parseISO,
  startOfMonth,
  endOfMonth,
  differenceInCalendarDays,
  getDaysInMonth,
} from 'date-fns';
import { z } from 'zod';

export const KINDS = ['purchase', 'subscription', 'fund', 'goal', 'event'] as const;
export type Kind = (typeof KINDS)[number];
export const CATEGORIES = [
  'Electronics',
  'Groceries',
  'Home & living',
  'Entertainment',
  'Health',
  'Education',
  'Transport',
  'Travel',
  'Other',
];
export const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const;
export const STATUSES: Record<Kind, string[]> = {
  purchase: ['Planned', 'Purchased', 'Postponed', 'Cancelled'],
  subscription: ['Active', 'Trial', 'Paused', 'Cancelled'],
  fund: ['Saving', 'Completed'],
  goal: ['Saving', 'Purchased', 'Postponed', 'Cancelled'],
  event: ['Upcoming', 'Completed'],
};
const moneySchema = z.number().finite().min(0).max(1e12);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => isValid(parseISO(v)) && format(parseISO(v), 'yyyy-MM-dd') === v,
    'Choose a valid date',
  );
export const entrySchema = z
  .object({
    id: z.string().min(1).max(100),
    kind: z.enum(KINDS),
    name: z.string().trim().min(1).max(160),
    amount: moneySchema,
    date: dateSchema,
    category: z.string().min(1).max(80),
    notes: z.string().max(3000),
    status: z.string(),
    priority: z.enum(['Low', 'Medium', 'High']),
    quantity: z.number().int().min(1).max(100000),
    vendor: z.string().max(160),
    frequency: z.enum(FREQUENCIES),
    anchorDay: z.number().int().min(1).max(31),
    fundId: z.string().max(100),
    contribution: moneySchema,
    pinned: z.boolean(),
    archived: z.boolean(),
    deletedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .refine((e) => STATUSES[e.kind].includes(e.status), 'Invalid record status')
  .refine(
    (e) => (['fund', 'goal', 'subscription'].includes(e.kind) ? e.amount > 0 : true),
    'Targets and subscription prices must be greater than zero',
  )
  .refine(
    (e) => e.kind !== 'purchase' || e.amount * e.quantity <= 1e12,
    'Purchase total must be no more than 1 trillion',
  );
export type Entry = z.infer<typeof entrySchema>;
export const ledgerSchema = z.object({
  id: z.string().min(1),
  entryId: z.string(),
  kind: z.enum(['deposit', 'withdrawal', 'payment']),
  amount: moneySchema.positive(),
  date: dateSchema,
  note: z.string().max(3000),
});
export type Ledger = z.infer<typeof ledgerSchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  demo: z.boolean(),
  entries: z.array(entrySchema).max(10000),
  ledger: z.array(ledgerSchema).max(50000),
  settings: z.object({
    currency: z.enum(['UZS', 'USD', 'EUR', 'GBP']),
    budget: moneySchema,
    font: z.enum(['google', 'samsung', 'arial', 'system']),
    theme: z.enum(['dark', 'light']),
    name: z.string().max(60),
  }),
  activity: z
    .array(z.object({ id: z.string(), text: z.string().max(500), date: z.string().datetime() }))
    .max(200),
});
export type State = z.infer<typeof stateSchema>;
export const uid = () => crypto.randomUUID();
export const today = () => format(new Date(), 'yyyy-MM-dd');
export const asDate = (date: string) => parseISO(date);
export const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export const total = (e: Entry) => round(e.amount * (e.kind === 'purchase' ? e.quantity : 1));
export const active = (s: State, kind?: Kind) =>
  s.entries.filter((e) => !e.deletedAt && !e.archived && (!kind || e.kind === kind));
export const balance = (s: State, id: string) =>
  round(
    s.ledger
      .filter((t) => t.entryId === id && t.kind !== 'payment')
      .reduce((sum, t) => sum + (t.kind === 'withdrawal' ? -t.amount : t.amount), 0),
  );
export const saved = (s: State, e: Entry) =>
  balance(s, e.kind === 'goal' && e.fundId ? e.fundId : e.id);
export const progress = (s: State, e: Entry) =>
  e.amount > 0 ? Math.min(100, Math.max(0, (saved(s, e) / e.amount) * 100)) : 0;
export const monthlyCost = (e: Entry) =>
  e.amount * { Weekly: 52 / 12, Monthly: 1, Quarterly: 1 / 3, Yearly: 1 / 12 }[e.frequency];
export function advanceDate(date: string, frequency: Entry['frequency'], anchorDay: number) {
  if (frequency === 'Weekly') return format(addDays(asDate(date), 7), 'yyyy-MM-dd');
  const next = addMonths(
    startOfMonth(asDate(date)),
    { Monthly: 1, Quarterly: 3, Yearly: 12 }[frequency],
  );
  next.setDate(Math.min(anchorDay, getDaysInMonth(next)));
  return format(next, 'yyyy-MM-dd');
}
export function monthSpending(s: State, month: Date) {
  const prefix = format(month, 'yyyy-MM');
  return round(
    s.entries
      .filter(
        (e) =>
          !e.deletedAt &&
          e.kind === 'purchase' &&
          e.status === 'Purchased' &&
          e.date.startsWith(prefix),
      )
      .reduce((sum, e) => sum + total(e), 0) +
      s.ledger
        .filter(
          (t) =>
            t.kind === 'payment' &&
            t.date.startsWith(prefix) &&
            s.entries.some((e) => e.id === t.entryId && !e.deletedAt),
        )
        .reduce((sum, t) => sum + t.amount, 0),
  );
}
export type CalendarEvent = {
  id: string;
  entryId: string;
  name: string;
  date: string;
  amount: number;
  kind: Kind;
  status: string;
};
export function calendarEvents(s: State, start: string, end: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const e of active(s)) {
    if (['Cancelled', 'Paused', 'Postponed', 'Purchased', 'Completed'].includes(e.status)) continue;
    let date = e.date;
    if (e.kind === 'subscription') {
      let count = 0;
      while (date <= end && count++ < 10000) {
        if (date >= start)
          events.push({
            id: e.id + date,
            entryId: e.id,
            name: e.name,
            date,
            amount: e.amount,
            kind: e.kind,
            status: e.status,
          });
        date = advanceDate(date, e.frequency, e.anchorDay);
      }
    } else if (date >= start && date <= end) {
      events.push({
        id: e.id,
        entryId: e.id,
        name: e.name,
        date,
        amount: e.kind === 'fund' ? e.contribution : total(e),
        kind: e.kind,
        status: e.status,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
export function payment(s: State, id: string, paidOn = today()): State {
  const e = s.entries.find((x) => x.id === id && !x.deletedAt);
  if (!e || e.kind !== 'subscription' || !['Active', 'Trial'].includes(e.status))
    throw new Error('This subscription is not active.');
  return {
    ...s,
    entries: s.entries.map((x) =>
      x.id === id
        ? { ...x, date: advanceDate(x.date, x.frequency, x.anchorDay), status: 'Active' }
        : x,
    ),
    ledger: [
      ...s.ledger,
      {
        id: uid(),
        entryId: id,
        kind: 'payment',
        amount: e.amount,
        date: paidOn,
        note: `Payment for renewal on ${e.date}`,
      },
    ],
  };
}
export function contribute(
  s: State,
  id: string,
  amount: number,
  kind: 'deposit' | 'withdrawal',
  note = '',
): State {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12)
    throw new Error('Enter an amount greater than zero and no more than 1 trillion.');
  const e = s.entries.find((x) => x.id === id && !x.deletedAt);
  if (!e || !['fund', 'goal'].includes(e.kind)) throw new Error('Savings record not found.');
  const target = e.kind === 'goal' && e.fundId ? e.fundId : id;
  if (kind === 'withdrawal' && amount > balance(s, target))
    throw new Error('This withdrawal is greater than the available balance.');
  return {
    ...s,
    ledger: [
      ...s.ledger,
      { id: uid(), entryId: target, kind, amount: round(amount), date: today(), note },
    ],
  };
}
export function completeGoal(s: State, id: string, actualPrice: number, date = today()): State {
  const e = s.entries.find((e) => e.id === id && !e.deletedAt && e.kind === 'goal');
  if (!e || e.status === 'Purchased') throw new Error('This goal cannot be purchased again.');
  if (!Number.isFinite(actualPrice) || actualPrice <= 0 || actualPrice > 1e12)
    throw new Error('Enter a valid purchase price.');
  const next = contribute(s, id, actualPrice, 'withdrawal', `Purchased ${e.name}`);
  const purchase = {
    ...blankEntry('purchase'),
    name: e.name,
    amount: round(actualPrice),
    date,
    category: e.category,
    status: 'Purchased',
    notes: `Completed purchase goal. Target: ${e.amount}. Actual price: ${actualPrice}. ${e.notes}`,
    vendor: e.vendor,
  };
  return {
    ...next,
    entries: [
      purchase,
      ...next.entries.map((x) => (x.id === id ? { ...x, status: 'Purchased', date } : x)),
    ],
  };
}
export function validateState(input: unknown): State {
  const s = stateSchema.parse(input);
  const ids = new Set(s.entries.map((e) => e.id));
  if (ids.size !== s.entries.length) throw new Error('Duplicate record IDs in backup.');
  if (new Set(s.ledger.map((t) => t.id)).size !== s.ledger.length)
    throw new Error('Duplicate transaction IDs in backup.');
  const linked = new Set<string>();
  for (const e of s.entries)
    if (e.fundId) {
      if (e.kind !== 'goal' || !s.entries.some((f) => f.id === e.fundId && f.kind === 'fund'))
        throw new Error('A linked savings fund is missing.');
      if (!e.deletedAt) {
        if (linked.has(e.fundId))
          throw new Error('A savings fund cannot be allocated to multiple goals.');
        linked.add(e.fundId);
      }
    }
  for (const t of s.ledger) {
    const e = s.entries.find((e) => e.id === t.entryId);
    if (
      !e ||
      (t.kind === 'payment' ? e.kind !== 'subscription' : !['fund', 'goal'].includes(e.kind))
    )
      throw new Error('Invalid transaction reference.');
    if (e.kind === 'goal' && e.fundId && t.kind !== 'payment')
      throw new Error('Linked goals must use their fund ledger.');
  }
  for (const e of s.entries)
    if (balance(s, e.id) < 0) throw new Error('A savings balance cannot be negative.');
  return s;
}
export function emptyState(): State {
  return {
    version: 1,
    demo: false,
    entries: [],
    ledger: [],
    settings: { currency: 'UZS', budget: 12000000, font: 'google', theme: 'dark', name: '' },
    activity: [],
  };
}
export function blankEntry(kind: Kind): Entry {
  return {
    id: uid(),
    kind,
    name: '',
    amount: 0,
    date: today(),
    category: kind === 'subscription' ? 'Entertainment' : 'Other',
    notes: '',
    status: STATUSES[kind][0],
    priority: 'Medium',
    quantity: 1,
    vendor: '',
    frequency: 'Monthly',
    anchorDay: new Date().getDate(),
    fundId: '',
    contribution: 0,
    pinned: false,
    archived: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
}
export function demoState(): State {
  const s = emptyState();
  s.demo = true;
  const date = (day: number) =>
    format(new Date(new Date().getFullYear(), new Date().getMonth(), day), 'yyyy-MM-dd');
  const add = (
    kind: Kind,
    name: string,
    amount: number,
    day: number,
    extra: Partial<Entry> = {},
  ) => {
    const e = { ...blankEntry(kind), name, amount, date: date(day), ...extra };
    e.anchorDay = asDate(e.date).getDate();
    s.entries.push(e);
    return e;
  };
  add('purchase', 'Weekly groceries', 386000, 3, {
    category: 'Groceries',
    status: 'Purchased',
    vendor: 'Korzinka',
  });
  add('purchase', 'A little coffee ritual', 185000, 6, {
    category: 'Home & living',
    status: 'Purchased',
    vendor: 'Uzum Market',
  });
  add('purchase', 'Everyday sneakers', 720000, 8, {
    category: 'Other',
    status: 'Purchased',
    vendor: 'Adidas',
    notes: 'A considered replacement for my old pair.',
  });
  add('purchase', 'Desk essentials', 265000, 10, {
    category: 'Home & living',
    status: 'Purchased',
    vendor: 'Uzum Market',
  });
  add('purchase', 'Sony WH-1000XM5', 3200000, 19, {
    category: 'Electronics',
    vendor: 'MediaPark',
    priority: 'High',
    notes: 'Compare prices before buying. A quieter space for focused work.',
  });
  add('purchase', 'A book for the weekend', 148000, 14, {
    category: 'Education',
    vendor: 'Asaxiy',
    priority: 'Low',
  });
  add('purchase', 'Standing desk', 2400000, 24, {
    category: 'Home & living',
    vendor: 'IKEA',
    priority: 'Medium',
  });
  add('subscription', 'Spotify Premium', 39000, 14, {
    category: 'Entertainment',
    vendor: 'Spotify',
  });
  add('subscription', 'YouTube Premium', 49000, 17, {
    category: 'Entertainment',
    vendor: 'YouTube',
  });
  add('subscription', 'iCloud+', 12900, 21, { category: 'Electronics', vendor: 'Apple' });
  add('subscription', 'Notion Plus', 120000, 28, {
    category: 'Education',
    vendor: 'Notion',
    status: 'Trial',
  });
  const f1 = add('fund', 'Rainy day fund', 20000000, 25, {
    category: 'Other',
    contribution: 800000,
    notes: 'A little peace of mind, one deposit at a time.',
  });
  const f2 = add('fund', 'Japan, someday soon', 15000000, 27, {
    category: 'Travel',
    contribution: 600000,
  });
  const f3 = add('fund', 'My next MacBook', 18000000, 28, {
    category: 'Electronics',
    contribution: 1000000,
  });
  const goal = add('goal', 'MacBook Air M4', 18000000, 28, {
    category: 'Electronics',
    fundId: f3.id,
    priority: 'High',
  });
  goal.date = format(addMonths(asDate(goal.date), 4), 'yyyy-MM-dd');
  const g2 = add('goal', 'A camera for the little things', 6500000, 26, {
    category: 'Electronics',
    priority: 'Medium',
  });
  g2.date = format(addMonths(asDate(g2.date), 3), 'yyyy-MM-dd');
  add('event', 'Monthly money check-in', 0, 28, {
    notes: 'Review subscriptions, celebrate progress, and plan next month.',
  });
  for (const [e, amount] of [
    [f1, 12400000],
    [f2, 5700000],
    [f3, 8200000],
    [g2, 1600000],
  ] as [Entry, number][])
    s.ledger.push({
      id: uid(),
      entryId: e.id,
      kind: 'deposit',
      amount,
      date: date(1),
      note: 'Example opening deposit',
    });
  for (let i = 1; i <= 5; i++) {
    const e = add(
      'purchase',
      `Monthly essentials · ${format(addMonths(new Date(), -i), 'MMM')}`,
      1800000 + i * 130000,
      5,
      { category: 'Groceries', status: 'Purchased', archived: true },
    );
    e.date = format(addMonths(asDate(e.date), -i), 'yyyy-MM-dd');
  }
  return s;
}
export const STORAGE_KEY = 'mmv-purchases-v1';
export function loadState(): { state: State; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { state: raw ? validateState(JSON.parse(raw)) : demoState(), error: '' };
  } catch {
    return {
      state: emptyState(),
      error:
        'Your saved data could not be read. It has not been overwritten. Export a recovery copy in Settings before starting a new workspace.',
    };
  }
}
export function money(value: number, currency: string, compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    ...(compact ? { notation: 'compact' as const, maximumFractionDigits: 1 } : {}),
  }).format(value);
}
export const niceDate = (date: string) => format(asDate(date), 'MMM d, yyyy');
export const daysLeft = (date: string) => differenceInCalendarDays(asDate(date), new Date());
export function monthlyNeed(s: State, e: Entry) {
  return Math.max(0, e.amount - saved(s, e)) / Math.max(1, Math.ceil(daysLeft(e.date) / 30));
}
export function download(name: string, body: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function purchaseCSV(entries: Entry[]) {
  const cell = (v: string | number) => {
    let value = String(v);
    if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
    return '"' + value.replaceAll('"', '""') + '"';
  };
  return [
    [
      'Name',
      'Unit price',
      'Quantity',
      'Total',
      'Date',
      'Category',
      'Vendor',
      'Status',
      'Priority',
      'Notes',
    ],
    ...entries
      .filter((e) => e.kind === 'purchase')
      .map((e) => [
        e.name,
        e.amount,
        e.quantity,
        total(e),
        e.date,
        e.category,
        e.vendor,
        e.status,
        e.priority,
        e.notes,
      ]),
  ]
    .map((row) => row.map(cell).join(','))
    .join('\r\n');
}
export const monthRange = (month: Date) => ({
  start: format(startOfMonth(month), 'yyyy-MM-dd'),
  end: format(endOfMonth(month), 'yyyy-MM-dd'),
});
