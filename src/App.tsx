import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FolderArchive,
  Gift,
  LayoutDashboard,
  Leaf,
  Menu,
  MoreHorizontal,
  Package,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import { addDays, addMonths, format, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import {
  active,
  asDate,
  balance,
  blankEntry,
  calendarEvents,
  CATEGORIES,
  completeGoal,
  contribute,
  daysLeft,
  demoState,
  download,
  emptyState,
  entrySchema,
  FREQUENCIES,
  loadState,
  money,
  monthlyCost,
  monthlyNeed,
  monthSpending,
  niceDate,
  payment,
  progress,
  purchaseCSV,
  saved,
  STATUSES,
  STORAGE_KEY,
  today,
  total,
  uid,
  validateState,
} from './model';
import type { Entry, Kind, State } from './model';

type Page =
  | 'Overview'
  | 'Purchases'
  | 'Subscriptions'
  | 'Savings'
  | 'Purchase goals'
  | 'Calendar'
  | 'Reports'
  | 'Settings';
const pages: { name: Page; icon: typeof LayoutDashboard; kind?: Kind }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Purchases', icon: ShoppingBag, kind: 'purchase' },
  { name: 'Subscriptions', icon: CreditCard, kind: 'subscription' },
  { name: 'Savings', icon: PiggyBank, kind: 'fund' },
  { name: 'Purchase goals', icon: Target, kind: 'goal' },
  { name: 'Calendar', icon: CalendarDays, kind: 'event' },
  { name: 'Reports', icon: TrendingUp },
  { name: 'Settings', icon: Settings2 },
];
const kindName: Record<Kind, string> = {
  purchase: 'purchase',
  subscription: 'subscription',
  fund: 'savings fund',
  goal: 'purchase goal',
  event: 'event',
};
const icons: Record<Kind, typeof ShoppingBag> = {
  purchase: ShoppingBag,
  subscription: CreditCard,
  fund: PiggyBank,
  goal: Target,
  event: CalendarDays,
};
const categoryIcon = (category: string) =>
  category === 'Travel'
    ? Leaf
    : category === 'Electronics'
      ? Package
      : category === 'Groceries'
        ? ShoppingBag
        : category === 'Education'
          ? FolderArchive
          : Gift;
const urlPage = () =>
  pages.find((p) => p.name.toLowerCase().replaceAll(' ', '-') === location.hash.slice(1))?.name ||
  'Overview';
function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function Empty({
  title = 'A little space for something new',
  text = 'Add your first record to start seeing the bigger picture.',
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Progress({ value, tone = 'teal' }: { value: number; tone?: string }) {
  return (
    <div
      className={`progress ${tone}`}
      role="progressbar"
      aria-label="Progress"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className={`modal ${wide ? 'wide' : ''}`}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function Editor({
  entry,
  state,
  onClose,
  onSave,
}: {
  entry: Entry;
  state: State;
  onClose: () => void;
  onSave: (e: Entry) => void;
}) {
  const [draft, setDraft] = useState(entry);
  const [error, setError] = useState('');
  const isNew = !state.entries.some((e) => e.id === entry.id);
  const field = <K extends keyof Entry>(key: K, value: Entry[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const parsed = entrySchema.parse({
        ...draft,
        anchorDay:
          draft.date === entry.date && !isNew ? entry.anchorDay : asDate(draft.date).getDate(),
      });
      onSave(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the details and try again.');
    }
  };
  const savings = ['fund', 'goal'].includes(draft.kind);
  return (
    <Modal
      title={`${isNew ? 'New' : 'Edit'} ${kindName[draft.kind]}`}
      subtitle="A small step toward a more intentional plan."
      onClose={onClose}
    >
      <form onSubmit={submit} className="editor">
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={160}
            placeholder={draft.kind === 'goal' ? 'What are you saving for?' : 'Give it a name'}
            value={draft.name}
            onChange={(e) => field('name', e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            {savings
              ? 'Target amount'
              : draft.kind === 'event'
                ? 'Amount (optional)'
                : 'Unit price'}{' '}
            ({state.settings.currency})
            <input
              required
              type="number"
              min={savings ? '0.01' : '0'}
              max="1000000000000"
              step="0.01"
              value={draft.amount}
              placeholder="0"
              onChange={(e) => field('amount', Number(e.target.value))}
            />
          </label>
          <label>
            {draft.kind === 'subscription'
              ? 'Next billing date'
              : draft.kind === 'fund'
                ? 'Next planned contribution'
                : savings
                  ? 'Target date'
                  : 'Date'}
            <input
              required
              type="date"
              value={draft.date}
              onChange={(e) => field('date', e.target.value)}
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Category
            <select value={draft.category} onChange={(e) => field('category', e.target.value)}>
              {Array.from(new Set([...CATEGORIES, ...state.entries.map((e) => e.category)])).map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Status
            <select value={draft.status} onChange={(e) => field('status', e.target.value)}>
              {STATUSES[draft.kind]
                .filter(
                  (s) => draft.kind !== 'goal' || s !== 'Purchased' || entry.status === 'Purchased',
                )
                .map((s) => (
                  <option key={s}>{s}</option>
                ))}
            </select>
          </label>
        </div>
        {draft.kind === 'purchase' && (
          <div className="form-grid">
            <label>
              Quantity
              <input
                type="number"
                required
                min="1"
                max="100000"
                step="1"
                value={draft.quantity}
                onChange={(e) => field('quantity', Number(e.target.value))}
              />
            </label>
            <label>
              Vendor
              <input
                maxLength={160}
                value={draft.vendor}
                onChange={(e) => field('vendor', e.target.value)}
                placeholder="Store or seller"
              />
            </label>
          </div>
        )}
        {draft.kind === 'subscription' && (
          <label>
            Billing frequency
            <select
              value={draft.frequency}
              onChange={(e) => field('frequency', e.target.value as Entry['frequency'])}
            >
              {FREQUENCIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
        {draft.kind === 'fund' && (
          <label>
            Planned monthly contribution ({state.settings.currency})
            <input
              type="number"
              min="0"
              max="1000000000000"
              step="0.01"
              value={draft.contribution || ''}
              placeholder="0"
              onChange={(e) => field('contribution', Number(e.target.value))}
            />
          </label>
        )}
        {draft.kind === 'goal' && (
          <label>
            Connect a savings fund
            <select
              value={draft.fundId}
              disabled={state.ledger.some((t) => t.entryId === entry.id)}
              onChange={(e) => field('fundId', e.target.value)}
            >
              <option value="">Save directly toward this goal</option>
              {active(state, 'fund')
                .filter(
                  (f) =>
                    !state.entries.some(
                      (g) =>
                        g.kind === 'goal' && !g.deletedAt && g.id !== draft.id && g.fundId === f.id,
                    ),
                )
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
            <small>
              One fund per goal, so your savings are never counted twice. Goals with direct
              transactions cannot be linked.
            </small>
          </label>
        )}
        {['purchase', 'goal'].includes(draft.kind) && (
          <label>
            Priority
            <div className="segmented">
              {(['Low', 'Medium', 'High'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={draft.priority === p ? 'selected' : ''}
                  onClick={() => field('priority', p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </label>
        )}
        <label>
          Notes
          <textarea
            rows={3}
            maxLength={3000}
            placeholder="A reason, a reminder, or something worth remembering…"
            value={draft.notes}
            onChange={(e) => field('notes', e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            <Check size={16} />
            {isNew ? 'Create' : 'Save'} {kindName[draft.kind]}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Contribution({
  entry,
  state,
  onClose,
  onSave,
}: {
  entry: Entry;
  state: State;
  onClose: () => void;
  onSave: (amount: number, kind: 'deposit' | 'withdrawal', note: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'deposit' | 'withdrawal'>('deposit');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <Modal title="Every little bit adds up" subtitle={entry.name} onClose={onClose}>
      <form
        className="editor"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(Number(amount), kind, note);
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <div className="balance-preview">
          <span>Available savings</span>
          <strong>{money(saved(state, entry), state.settings.currency)}</strong>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={kind === 'deposit' ? 'selected' : ''}
            onClick={() => setKind('deposit')}
          >
            Deposit
          </button>
          <button
            type="button"
            className={kind === 'withdrawal' ? 'selected' : ''}
            onClick={() => setKind('withdrawal')}
          >
            Withdraw
          </button>
        </div>
        <label>
          Amount ({state.settings.currency})
          <input
            autoFocus
            required
            type="number"
            min="0.01"
            max={kind === 'withdrawal' ? saved(state, entry) : 1e12}
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Note
          <textarea
            maxLength={3000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this contribution for?"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Record {kind}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function App() {
  const initial = useRef<ReturnType<typeof loadState> | null>(null);
  if (!initial.current) initial.current = loadState();
  const [state, setState] = useState(initial.current.state);
  const [storageError, setStorageError] = useState(initial.current.error);
  const [page, setPage] = useState<Page>(urlPage);
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<Entry | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Entry | null>(null);
  const [buyGoal, setBuyGoal] = useState<Entry | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    text: string;
    action: () => void;
  } | null>(null);
  const [toast, setToast] = useState('');
  const [undo, setUndo] = useState<State | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState('All categories');
  const [sort, setSort] = useState('Newest');
  const [listMode, setListMode] = useState('Active');
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(today());
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [notifications, setNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentKind = pages.find((p) => p.name === page)?.kind;
  const fmt = (v: number, compact = false) =>
    privacy ? '••••' : money(v, state.settings.currency, compact);
  const notify = (text: string) => setToast(text);
  const navigate = (name: Page) => {
    setPage(name);
    location.hash = name.toLowerCase().replaceAll(' ', '-');
    setSidebar(false);
    setFilter('All');
    setCategory('All categories');
    setQuery('');
    setListMode('Active');
  };
  useEffect(() => {
    const handler = () => {
      setPage(urlPage());
      setFilter('All');
      setCategory('All categories');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.font = state.settings.font;
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state.settings.font, state.settings.theme]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        setSidebar(false);
        setNotifications(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const commit = (next: State, message: string) => {
    if (storageError) throw new Error('Recover your saved data in Settings before making changes.');
    const validated = validateState({
      ...next,
      activity: [
        { id: uid(), text: message, date: new Date().toISOString() },
        ...next.activity,
      ].slice(0, 200),
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    } catch {
      throw new Error(
        'Your browser could not save this change. Export a backup and free some storage, then try again.',
      );
    }
    setUndo(state);
    setState(validated);
    notify(message);
  };
  const run = (action: () => void) => {
    try {
      action();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const updateEntry = (e: Entry, message: string) =>
    commit({ ...state, entries: state.entries.map((x) => (x.id === e.id ? e : x)) }, message);
  const saveEntry = (e: Entry) => {
    commit(
      {
        ...state,
        entries: state.entries.some((x) => x.id === e.id)
          ? state.entries.map((x) => (x.id === e.id ? e : x))
          : [e, ...state.entries],
      },
      `${e.name} saved`,
    );
    setEditor(null);
  };
  const deleteEntry = (e: Entry) => {
    if (state.entries.some((g) => g.fundId === e.id && !g.deletedAt)) {
      notify('Unlink this fund from its purchase goal before moving it to trash.');
      return;
    }
    setConfirmation({
      title: `Move ${e.name} to trash?`,
      text: 'Its history will be preserved. You can restore it from the Trash view.',
      action: () => {
        updateEntry({ ...e, deletedAt: new Date().toISOString() }, `${e.name} moved to trash`);
        setDetail(null);
      },
    });
  };
  const all = active(state);
  const expenses = monthSpending(state, new Date());
  const subscriptions = active(state, 'subscription').filter((e) =>
    ['Active', 'Trial'].includes(e.status),
  );
  const subscriptionTotal = subscriptions.reduce((sum, e) => sum + monthlyCost(e), 0);
  const savingsTotal = state.entries
    .filter((e) => !e.deletedAt && ['fund', 'goal'].includes(e.kind) && !e.fundId)
    .reduce((sum, e) => sum + balance(state, e.id), 0);
  const goals = active(state, 'goal').filter((e) => !['Purchased', 'Cancelled'].includes(e.status));
  const upcoming = calendarEvents(state, today(), format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const remaining = state.settings.budget - expenses;
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const searchResults = query.trim()
    ? all
        .filter((e) =>
          `${e.name} ${e.vendor} ${e.category} ${e.notes}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : [];
  const shown = state.entries
    .filter(
      (e) =>
        e.kind === currentKind &&
        (listMode === 'Trash'
          ? !!e.deletedAt
          : listMode === 'Archived'
            ? e.archived && !e.deletedAt
            : !e.archived && !e.deletedAt) &&
        (filter === 'All' || e.status === filter) &&
        (category === 'All categories' || e.category === category) &&
        `${e.name} ${e.vendor} ${e.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (sort === 'Price: high to low'
          ? total(b) - total(a)
          : sort === 'Name'
            ? a.name.localeCompare(b.name)
            : sort === 'Priority'
              ? ['High', 'Medium', 'Low'].indexOf(a.priority) -
                ['High', 'Medium', 'Low'].indexOf(b.priority)
              : sort === 'Due date'
                ? a.date.localeCompare(b.date)
                : b.createdAt.localeCompare(a.createdAt)),
    );
  const selectedEntry = state.entries.find((e) => e.id === detail);
  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
  const values = months.map((m) => monthSpending(state, m));
  const maxValue = Math.max(...values, 1);
  const reportEntries = state.entries.filter(
    (e) =>
      !e.deletedAt &&
      e.kind === 'purchase' &&
      e.status === 'Purchased' &&
      e.date.startsWith(format(month, 'yyyy-MM')),
  );
  const categoryTotals = Array.from(new Set(reportEntries.map((e) => e.category)))
    .map((name) => ({
      name,
      value: reportEntries.filter((e) => e.category === name).reduce((s, e) => s + total(e), 0),
    }))
    .sort((a, b) => b.value - a.value);
  const chart = (
    <div
      className="bar-chart"
      role="img"
      aria-label={`Monthly spending: ${months.map((m, i) => `${format(m, 'MMMM')}: ${fmt(values[i])}`).join(', ')}`}
    >
      <div className="chart-grid">
        <span>{fmt(maxValue, true)}</span>
        <span>{fmt(maxValue / 2, true)}</span>
        <span>0</span>
      </div>
      <div className="bars">
        {months.map((m, i) => (
          <div className="bar-column" key={i}>
            <div className="bar-track">
              <div
                className={`bar ${i === 5 ? 'current' : ''}`}
                style={{ height: `${Math.max(values[i] ? 3 : 0, (values[i] / maxValue) * 100)}%` }}
              >
                <span className="bar-tooltip">{fmt(values[i])}</span>
              </div>
            </div>
            <span className={i === 5 ? 'cream' : ''}>{format(m, 'MMM')}</span>
          </div>
        ))}
      </div>
    </div>
  );
  const sectionHeader = (title: string, action?: ReactNode) => (
    <div className="section-heading">
      <h2>{title}</h2>
      {action}
    </div>
  );
  const recordIcon = (e: Entry) => {
    const Icon = e.kind === 'purchase' ? categoryIcon(e.category) : icons[e.kind];
    return (
      <span
        className={`record-icon ${e.kind === 'subscription' ? 'sub-' + (e.name.charCodeAt(0) % 4) : e.kind}`}
      >
        <Icon size={19} />
      </span>
    );
  };
  const viewButton = (name: Page, label = 'View all') => (
    <button className="text-button" onClick={() => navigate(name)}>
      {label}
      <ArrowUpRight size={15} />
    </button>
  );
  const goalCard = (e: Entry, index = 0) => (
    <article className="goal-card" key={e.id}>
      <div className="row-between">
        <span className={`record-icon goal tone-${index % 3}`}>
          <Target size={21} />
        </span>
        <button
          className="icon-button"
          aria-label={`Open ${e.name}`}
          onClick={() => setDetail(e.id)}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      <button className="card-title" onClick={() => setDetail(e.id)}>
        {e.name}
      </button>
      <p className="small muted">
        {e.fundId ? 'Connected to a savings fund' : `Target · ${niceDate(e.date)}`}
      </p>
      <div className="goal-amount">
        <strong>{fmt(saved(state, e), true)}</strong>
        <span>of {fmt(e.amount, true)}</span>
        <b>{Math.round(progress(state, e))}%</b>
      </div>
      <Progress value={progress(state, e)} tone={index % 2 ? 'gold' : 'teal'} />
      <div className="goal-footer">
        <span>
          {progress(state, e) >= 100
            ? 'Ready when you are'
            : `${fmt(monthlyNeed(state, e), true)} / month to target`}
        </span>
        <button
          className="icon-button"
          aria-label={`Add savings to ${e.name}`}
          onClick={() => setTransaction(e)}
        >
          <Plus size={17} />
        </button>
      </div>
    </article>
  );
  const eventRows = (events: ReturnType<typeof calendarEvents>, limit = 5) =>
    events.slice(0, limit).map((e) => (
      <button className="event-row" key={e.id} onClick={() => setDetail(e.entryId)}>
        <span className="date-tile">
          <b>{format(asDate(e.date), 'dd')}</b>
          <small>{format(asDate(e.date), 'MMM')}</small>
        </span>
        <span className="event-name">
          <strong>{e.name}</strong>
          <small>
            {kindName[e.kind]}
            {e.date === today() ? ' · Today' : ''}
          </small>
        </span>
        <span className="event-price">
          {e.amount ? fmt(e.amount, true) : 'Check-in'}
          <ChevronRight size={14} />
        </span>
      </button>
    ));
  const saveSettings = (patch: Partial<State['settings']>) =>
    run(() => commit({ ...state, settings: { ...state.settings, ...patch } }, 'Preferences saved'));
  const backup = () => download(`mmv-purchases-${today()}.json`, JSON.stringify(state, null, 2));
  const replaceWorkspace = (next: State) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validateState(next)));
      setUndo(state);
      setState(next);
      setStorageError('');
      notify('Workspace updated');
    } catch (e) {
      notify((e as Error).message);
    }
  };

  return (
    <div className={`app ${privacy ? 'private-mode' : ''}`}>
      {sidebar && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
        <a className="brand" href="#overview" onClick={() => navigate('Overview')}>
          <span className="brand-symbol">
            <span>M</span>
            <span>V</span>
          </span>
          <span>
            MMV<span className="brand-sub">purchases</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<small>Your money, your pace</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-caption">YOUR WORKSPACE</span>
        <nav aria-label="Main navigation">
          {pages.slice(0, 6).map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              className={`nav-item ${page === name ? 'active' : ''}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === 'Subscriptions' && <b>{subscriptions.length}</b>}
              {page === name && name !== 'Subscriptions' && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <span className="nav-caption second">A LITTLE PERSPECTIVE</span>
        <nav aria-label="Tools">
          {pages.slice(6).map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              className={`nav-item ${page === name ? 'active' : ''}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mindful-note">
            <Leaf size={21} />
            <strong>Small steps. Real progress.</strong>
            <p>
              Make room for what
              <br />
              matters most to you.
            </p>
            <span className="note-line" />
          </div>
          <button className="profile" onClick={() => navigate('Settings')}>
            <span className="avatar">
              {state.settings.name ? state.settings.name.slice(0, 2).toUpperCase() : 'ME'}
            </span>
            <span>
              {state.settings.name || 'My workspace'}
              <small>
                <span className="online-dot" /> Saved on this device
              </small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setSidebar(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>My workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Search everything"
                placeholder="Search anything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
              {query && (
                <div className="search-results">
                  {searchResults.length ? (
                    searchResults.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setDetail(e.id);
                          setQuery('');
                        }}
                      >
                        {recordIcon(e)}
                        <span>
                          {e.name}
                          <small>
                            {kindName[e.kind]} · {e.category}
                          </small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>No matching records.</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-button"
              aria-label={privacy ? 'Show amounts' : 'Hide amounts'}
              onClick={() => setPrivacy(!privacy)}
            >
              {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <div className="notifications-wrap">
              <button
                className={`icon-button notification-button ${upcoming.length ? 'has-dot' : ''}`}
                aria-label="Upcoming reminders"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
              </button>
              {notifications && (
                <div className="notification-panel">
                  <h3>On your horizon</h3>
                  <p className="small muted">Upcoming dates from your records</p>
                  {upcoming.length ? eventRows(upcoming, 4) : <p>No upcoming events.</p>}
                  <button
                    className="text-button"
                    onClick={() => {
                      navigate('Calendar');
                      setNotifications(false);
                    }}
                  >
                    Open calendar
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
            <span className="avatar small-avatar">
              {state.settings.name ? state.settings.name.slice(0, 2).toUpperCase() : 'ME'}
            </span>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="alert error" role="alert">
              {storageError}
              <button onClick={() => navigate('Settings')}>Open recovery settings</button>
            </div>
          )}
          {state.demo && (
            <div className="demo-banner">
              <span>
                <Sparkles size={14} /> You’re exploring a sample workspace. Make yourself at home.
              </span>
              <button
                onClick={() =>
                  setConfirmation({
                    title: 'Make this space yours',
                    text: 'Remove the sample records and start with an empty workspace. Your preferences will be kept.',
                    action: () => replaceWorkspace({ ...emptyState(), settings: state.settings }),
                  })
                }
              >
                Start fresh
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {page === 'Overview'
                  ? 'A LITTLE CLARITY, EVERY DAY'
                  : page === 'Settings'
                    ? 'MAKE YOURSELF AT HOME'
                    : 'YOUR MONEY, WITH INTENTION'}
              </span>
              <h1>
                {page === 'Overview'
                  ? `A little more in control${state.settings.name ? `, ${state.settings.name}` : ''}.`
                  : page}
              </h1>
              <p>
                {
                  {
                    Overview: 'Your everyday spending. Your bigger dreams. All in one place.',
                    Purchases: 'Thoughtful choices, from the wishlist to your doorstep.',
                    Subscriptions: 'Keep the things you love. Stay ahead of every renewal.',
                    Savings: 'Build a cushion for today and a little possibility for tomorrow.',
                    'Purchase goals': 'Turn “one day” into a plan you can see.',
                    Calendar: 'A calmer view of what’s coming.',
                    Reports: 'Find the patterns. Make room for better habits.',
                    Settings: 'Your workspace should feel like you.',
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {page === 'Overview' && (
                <span className="date-chip">
                  <CalendarDays size={15} />
                  {currentMonth}
                </span>
              )}
              {page !== 'Settings' && page !== 'Reports' && (
                <details className="add-menu">
                  <summary className="button primary">
                    <Plus size={17} />
                    Add {currentKind ? kindName[currentKind] : 'new'}
                    {!currentKind && <ChevronDown size={14} />}
                  </summary>
                  <div className="dropdown">
                    {(currentKind
                      ? [currentKind]
                      : (['purchase', 'subscription', 'fund', 'goal', 'event'] as Kind[])
                    ).map((kind) => (
                      <button
                        key={kind}
                        onClick={(e) => {
                          e.currentTarget.closest('details')?.removeAttribute('open');
                          setEditor(blankEntry(kind));
                        }}
                      >
                        {(() => {
                          const Icon = icons[kind];
                          return <Icon size={16} />;
                        })()}
                        New {kindName[kind]}
                      </button>
                    ))}
                  </div>
                </details>
              )}
              {page === 'Reports' && (
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      `mmv-report-${format(month, 'yyyy-MM')}.csv`,
                      purchaseCSV(reportEntries),
                      'text/csv',
                    )
                  }
                >
                  <Download size={16} />
                  Export purchases
                </button>
              )}
            </div>
          </div>

          {page === 'Overview' && (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-label">
                    Spent this month
                    <span className="mini-icon">
                      <Wallet size={17} />
                    </span>
                  </div>
                  <strong>{fmt(expenses)}</strong>
                  <span className="stat-foot">
                    <span className="tiny-dot gold" />{' '}
                    {state.settings.budget
                      ? `${Math.round((expenses / state.settings.budget) * 100)}% of your monthly budget`
                      : 'Set a budget to track your pace'}
                  </span>
                  <div className="stat-sparkline">
                    <svg viewBox="0 0 90 26">
                      <path d="M0 22L12 18L24 21L36 12L48 16L60 8L72 10L90 2" />
                    </svg>
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Monthly subscriptions
                    <span className="mini-icon">
                      <CreditCard size={17} />
                    </span>
                  </div>
                  <strong>{fmt(subscriptionTotal)}</strong>
                  <span className="stat-foot">
                    {subscriptions.length} active services{' '}
                    <span className="subtle">· Monthly equivalent</span>
                  </span>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Total tucked away
                    <span className="mini-icon teal">
                      <PiggyBank size={17} />
                    </span>
                  </div>
                  <strong>{fmt(savingsTotal)}</strong>
                  <span className="stat-foot">
                    <span className="tiny-dot teal" />
                    {active(state, 'fund').length} savings funds{' '}
                    <span className="subtle">+ independent goals</span>
                  </span>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Dreams in motion
                    <span className="mini-icon gold">
                      <Target size={17} />
                    </span>
                  </div>
                  <strong>
                    {goals.length}
                    <span className="stat-unit">active goals</span>
                  </strong>
                  <span className="stat-foot">
                    {goals.filter((e) => progress(state, e) >= 100).length} ready to buy{' '}
                    <span className="subtle">· One step closer</span>
                  </span>
                </article>
              </div>
              <div className="overview-middle">
                <section className="panel spending-panel">
                  {sectionHeader(
                    'Your spending rhythm',
                    <span className="small muted">Last 6 months</span>,
                  )}
                  <div className="chart-summary">
                    <strong>{fmt(expenses)}</strong>
                    <span>this month</span>
                    <Pill tone="teal">Recorded spending</Pill>
                  </div>
                  {chart}
                  <div className="chart-caption">
                    <span className="tiny-dot teal" /> Purchases + recorded subscription payments
                    <span>Good plans start with a clear picture.</span>
                  </div>
                </section>
                <section className="panel budget-panel">
                  {sectionHeader(
                    'Room to breathe',
                    <button
                      className="icon-button"
                      aria-label="Edit monthly budget"
                      onClick={() => navigate('Settings')}
                    >
                      <SlidersHorizontal size={17} />
                    </button>,
                  )}
                  <div className="budget-ring">
                    <svg viewBox="0 0 180 180">
                      <circle cx="90" cy="90" r="73" className="ring-base" />
                      <circle
                        cx="90"
                        cy="90"
                        r="73"
                        className={`ring-value ${remaining < 0 ? 'over' : ''}`}
                        strokeDasharray={`${Math.min(1, state.settings.budget ? expenses / state.settings.budget : 0) * 459} 459`}
                      />
                    </svg>
                    <div>
                      <span>{remaining < 0 ? 'Over budget' : 'Left to spend'}</span>
                      <strong>{fmt(Math.abs(remaining), true)}</strong>
                      <small>
                        {state.settings.budget
                          ? `${Math.round((Math.max(0, remaining) / state.settings.budget) * 100)}% remaining`
                          : 'Set your budget'}
                      </small>
                    </div>
                  </div>
                  <div className="budget-labels">
                    <span>
                      <i className="tiny-dot teal" />
                      Spent<b>{fmt(expenses, true)}</b>
                    </span>
                    <span>
                      <i className="tiny-dot muted-bg" />
                      Budget<b>{fmt(state.settings.budget, true)}</b>
                    </span>
                  </div>
                  <div className="budget-note">
                    <Leaf size={15} />
                    {remaining >= 0
                      ? 'A little awareness goes a long way.'
                      : 'Time to revisit your spending plan.'}
                  </div>
                </section>
              </div>
              <div className="overview-bottom">
                <section className="panel">
                  {sectionHeader('On the horizon', viewButton('Calendar', 'Open calendar'))}
                  <p className="section-description">A few things coming your way.</p>
                  {upcoming.length ? (
                    eventRows(upcoming)
                  ) : (
                    <Empty
                      title="A clear horizon"
                      text="Your upcoming payments and plans will appear here."
                    />
                  )}
                </section>
                <section className="goals-panel">
                  {sectionHeader('Saving for something good', viewButton('Purchase goals'))}
                  <p className="section-description">Big things start with small steps.</p>
                  <div className="dashboard-goals">
                    {goals.length ? (
                      goals.slice(0, 2).map(goalCard)
                    ) : (
                      <Empty
                        action={
                          <button
                            className="button secondary"
                            onClick={() => setEditor(blankEntry('goal'))}
                          >
                            Set a goal
                          </button>
                        }
                      />
                    )}
                  </div>
                  <div className="insight-strip">
                    <span className="insight-icon">
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <strong>Your future self says thanks.</strong>
                      <span>
                        {savingsTotal
                          ? `${fmt(savingsTotal, true)} saved across your funds and goals. Keep showing up.`
                          : 'Start a savings fund. Even a small contribution is progress.'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
              <section className="panel recent-panel">
                {sectionHeader(
                  'The little things add up',
                  viewButton('Purchases', 'All purchases'),
                )}
                <PurchaseTable
                  entries={active(state, 'purchase').slice(0, 4)}
                  fmt={fmt}
                  onOpen={(e) => setDetail(e.id)}
                  recordIcon={recordIcon}
                />
              </section>
            </>
          )}

          {currentKind && page !== 'Calendar' && (
            <>
              <div className="module-summary">
                <span className={`record-icon ${currentKind}`}>
                  {(() => {
                    const Icon = icons[currentKind];
                    return <Icon size={23} />;
                  })()}
                </span>
                <div>
                  <span>
                    {page === 'Subscriptions'
                      ? 'Estimated monthly cost'
                      : page === 'Savings'
                        ? 'Across your savings funds'
                        : page === 'Purchase goals'
                          ? 'Toward your next big things'
                          : 'Planned purchases'}
                  </span>
                  <strong>
                    {fmt(
                      page === 'Subscriptions'
                        ? subscriptionTotal
                        : page === 'Savings'
                          ? active(state, 'fund').reduce((s, e) => s + saved(state, e), 0)
                          : page === 'Purchase goals'
                            ? goals.reduce((s, e) => s + saved(state, e), 0)
                            : active(state, 'purchase')
                                .filter((e) => e.status === 'Planned')
                                .reduce((s, e) => s + total(e), 0),
                    )}
                  </strong>
                </div>
                <div className="summary-meta">
                  {page === 'Subscriptions'
                    ? `${fmt(subscriptionTotal * 12)} / year`
                    : page === 'Purchase goals'
                      ? `${goals.length} goals in motion`
                      : page === 'Savings'
                        ? `${active(state, 'fund').length} funds, a little more peace of mind`
                        : `${active(state, 'purchase').filter((e) => e.status === 'Planned').length} considered choices ahead`}
                </div>
              </div>
              <div className="toolbar">
                <div className="tabs">
                  {['Active', 'Archived', 'Trash'].map((m) => (
                    <button
                      className={listMode === m ? 'active' : ''}
                      key={m}
                      onClick={() => setListMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="filter-controls">
                  <select
                    aria-label="Filter by status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="All">All statuses</option>
                    {STATUSES[currentKind].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>All categories</option>
                    {Array.from(
                      new Set([...CATEGORIES, ...state.entries.map((e) => e.category)]),
                    ).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Sort records"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {['Newest', 'Due date', 'Price: high to low', 'Priority', 'Name'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {currentKind === 'purchase' && (
                    <button
                      className="icon-button"
                      aria-label="Export filtered purchases as CSV"
                      onClick={() =>
                        download(`mmv-purchases-${today()}.csv`, purchaseCSV(shown), 'text/csv')
                      }
                    >
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </div>
              {!shown.length ? (
                <section className="panel">
                  <Empty
                    title={
                      listMode === 'Trash' ? 'Nothing in the trash' : 'A fresh page for your plans'
                    }
                    text={
                      filter !== 'All' || category !== 'All categories'
                        ? 'Try another filter, or add a new record.'
                        : 'Your records will appear here as you add them.'
                    }
                    action={
                      listMode === 'Active' && (
                        <button
                          className="button secondary"
                          onClick={() => setEditor(blankEntry(currentKind))}
                        >
                          <Plus size={16} />
                          Add {kindName[currentKind]}
                        </button>
                      )
                    }
                  />
                </section>
              ) : currentKind === 'purchase' ? (
                <section className="panel table-panel">
                  <PurchaseTable
                    entries={shown}
                    fmt={fmt}
                    onOpen={(e) => setDetail(e.id)}
                    recordIcon={recordIcon}
                  />
                </section>
              ) : (
                <div className="record-grid">
                  {shown.map((e, i) =>
                    currentKind === 'subscription' ? (
                      <article className="subscription-card" key={e.id}>
                        <div className="row-between">
                          <span className={`service-logo sub-${i % 4}`}>{e.name.slice(0, 1)}</span>
                          <Pill
                            tone={
                              e.status === 'Active'
                                ? 'teal'
                                : e.status === 'Trial'
                                  ? 'gold'
                                  : 'muted'
                            }
                          >
                            {e.deletedAt ? 'In trash' : e.status}
                          </Pill>
                        </div>
                        <button className="card-title" onClick={() => setDetail(e.id)}>
                          {e.name}
                        </button>
                        <p className="muted small">{e.category}</p>
                        <div className="subscription-amount">
                          {fmt(e.amount)}
                          <span>/ {e.frequency.toLowerCase().replace('ly', '')}</span>
                        </div>
                        <div className="subscription-due">
                          <CalendarDays size={15} />
                          {daysLeft(e.date) < 0 ? 'Overdue · ' : ''}
                          {niceDate(e.date)}
                        </div>
                        <div className="card-actions">
                          <button className="button secondary" onClick={() => setDetail(e.id)}>
                            Details
                          </button>
                          {!e.deletedAt && ['Active', 'Trial'].includes(e.status) && (
                            <button
                              className="button subtle-button"
                              onClick={() =>
                                run(() =>
                                  commit(payment(state, e.id), `${e.name} payment recorded`),
                                )
                              }
                            >
                              <Check size={15} />
                              Mark paid
                            </button>
                          )}
                        </div>
                      </article>
                    ) : currentKind === 'fund' ? (
                      <article className="fund-card" key={e.id}>
                        <div className="row-between">
                          <span className={`record-icon fund tone-${i % 3}`}>
                            <PiggyBank size={22} />
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Open ${e.name}`}
                            onClick={() => setDetail(e.id)}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        <button className="card-title" onClick={() => setDetail(e.id)}>
                          {e.name}
                        </button>
                        <p className="muted small">
                          {e.deletedAt ? 'In trash' : e.status} · {e.category}
                        </p>
                        <strong className="fund-balance">{fmt(saved(state, e))}</strong>
                        <div className="row-between small muted">
                          <span>of {fmt(e.amount, true)}</span>
                          <span>{Math.round(progress(state, e))}% saved</span>
                        </div>
                        <Progress value={progress(state, e)} tone={i % 2 ? 'gold' : 'teal'} />
                        <p className="small muted">
                          {e.contribution
                            ? `${fmt(e.contribution)} / month planned`
                            : 'Every contribution counts'}
                        </p>
                        <div className="card-actions">
                          <button className="button secondary" onClick={() => setDetail(e.id)}>
                            History
                          </button>
                          {!e.deletedAt && (
                            <button className="button primary" onClick={() => setTransaction(e)}>
                              <Plus size={15} />
                              Add savings
                            </button>
                          )}
                        </div>
                      </article>
                    ) : (
                      goalCard(e, i)
                    ),
                  )}
                </div>
              )}
              {currentKind === 'subscription' && (
                <div className="insight-strip">
                  <Sparkles size={20} />
                  <div>
                    <strong>A quick check-in can go a long way.</strong>
                    <span>
                      Pausing one unused service saves its monthly equivalent. Status changes here
                      track your plan; cancel with the provider separately.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {page === 'Calendar' && (
            <div className="calendar-layout">
              <section className="panel calendar-panel">
                <div className="calendar-toolbar">
                  <h2>{format(month, 'MMMM yyyy')}</h2>
                  <div>
                    <button
                      className="icon-button"
                      aria-label="Previous month"
                      onClick={() => setMonth(subMonths(month, 1))}
                    >
                      <ChevronLeft size={19} />
                    </button>
                    <button
                      className="button ghost"
                      onClick={() => {
                        setMonth(startOfMonth(new Date()));
                        setSelectedDay(today());
                      }}
                    >
                      Today
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Next month"
                      onClick={() => setMonth(addMonths(month, 1))}
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                </div>
                <div className="calendar-filters">
                  {['All', 'purchase', 'subscription', 'fund', 'goal', 'event'].map((k) => (
                    <button
                      key={k}
                      className={calendarFilter === k ? 'selected' : ''}
                      onClick={() => setCalendarFilter(k)}
                    >
                      {k === 'All' ? 'Everything' : kindName[k as Kind]}
                    </button>
                  ))}
                </div>
                <div className="calendar-weekdays">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {Array.from({ length: 42 }, (_, i) => {
                    const day = addDays(startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), i),
                      date = format(day, 'yyyy-MM-dd'),
                      events = calendarEvents(state, date, date).filter(
                        (e) => calendarFilter === 'All' || e.kind === calendarFilter,
                      );
                    return (
                      <button
                        key={date}
                        aria-label={`${niceDate(date)}, ${events.length} events`}
                        className={`calendar-day ${date === today() ? 'today' : ''} ${date === selectedDay ? 'selected' : ''} ${day.getMonth() !== month.getMonth() ? 'outside' : ''}`}
                        onClick={() => setSelectedDay(date)}
                      >
                        <span>{day.getDate()}</span>
                        {events.slice(0, 2).map((e) => (
                          <span key={e.id} className={`calendar-event ${e.kind}`}>
                            {e.name}
                          </span>
                        ))}
                        {events.length > 2 && <small>+{events.length - 2} more</small>}
                      </button>
                    );
                  })}
                </div>
              </section>
              <aside className="calendar-agenda panel">
                <span className="eyebrow">YOUR DAY, AT A GLANCE</span>
                <h2>{format(asDate(selectedDay), 'EEEE, MMM d')}</h2>
                {(() => {
                  const events = calendarEvents(state, selectedDay, selectedDay).filter(
                    (e) => calendarFilter === 'All' || e.kind === calendarFilter,
                  );
                  return events.length ? (
                    eventRows(events, 100)
                  ) : (
                    <Empty title="Some breathing room" text="Nothing scheduled for this day." />
                  );
                })()}
                <button
                  className="button secondary full-width"
                  onClick={() => setEditor({ ...blankEntry('event'), date: selectedDay })}
                >
                  <Plus size={16} />
                  Add an event
                </button>
                <div className="agenda-note">
                  <CircleHelp size={16} />
                  <p>
                    Active subscriptions repeat automatically. Savings dates show your next planned
                    contribution; deposits are recorded manually.
                  </p>
                </div>
              </aside>
            </div>
          )}

          {page === 'Reports' && (
            <>
              <div className="report-toolbar">
                <div className="month-picker">
                  <button
                    className="icon-button"
                    aria-label="Previous report month"
                    onClick={() => setMonth(subMonths(month, 1))}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong>{format(month, 'MMMM yyyy')}</strong>
                  <button
                    className="icon-button"
                    aria-label="Next report month"
                    onClick={() => setMonth(addMonths(month, 1))}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <Pill>Calculated from your recorded data</Pill>
              </div>
              <div className="stats-grid three">
                <article className="stat-card">
                  <span className="stat-label">Recorded spending</span>
                  <strong>{fmt(monthSpending(state, month))}</strong>
                  <span className="stat-foot">Purchases + recorded payments</span>
                </article>
                <article className="stat-card">
                  <span className="stat-label">Completed purchases</span>
                  <strong>{reportEntries.length}</strong>
                  <span className="stat-foot">During {format(month, 'MMMM')}</span>
                </article>
                <article className="stat-card">
                  <span className="stat-label">Average purchase</span>
                  <strong>
                    {fmt(
                      reportEntries.length
                        ? reportEntries.reduce((s, e) => s + total(e), 0) / reportEntries.length
                        : 0,
                    )}
                  </strong>
                  <span className="stat-foot">Across completed purchases</span>
                </article>
              </div>
              <div className="two-columns">
                <section className="panel">
                  {sectionHeader('Where it went')}
                  <p className="section-description">Completed purchases by category</p>
                  {categoryTotals.length ? (
                    categoryTotals.map((c, i) => (
                      <div className="category-report" key={c.name}>
                        <div className="row-between">
                          <span>
                            <i className={`tiny-dot ${i % 2 ? 'gold' : 'teal'}`} />
                            {c.name}
                          </span>
                          <strong>{fmt(c.value)}</strong>
                        </div>
                        <Progress
                          value={
                            (c.value / Math.max(...categoryTotals.map((c) => c.value), 1)) * 100
                          }
                          tone={i % 2 ? 'gold' : 'teal'}
                        />
                      </div>
                    ))
                  ) : (
                    <Empty
                      title="No spending recorded"
                      text="Completed purchases for this month will appear here."
                    />
                  )}
                </section>
                <section className="panel">
                  {sectionHeader('The bigger picture')}
                  <p className="section-description">Recorded spending over the last six months</p>
                  {chart}
                </section>
              </div>
              <section className="panel insights-panel">
                {sectionHeader(
                  'A few useful observations',
                  <Pill tone="teal">
                    <Sparkles size={12} />
                    Calculated insights
                  </Pill>,
                )}
                <div className="insight-cards">
                  <div>
                    <CreditCard size={22} />
                    <h3>A year of the everyday</h3>
                    <p>
                      Your active subscriptions add up to{' '}
                      <strong>{fmt(subscriptionTotal * 12)}</strong> per year at their current
                      rates.
                    </p>
                  </div>
                  <div>
                    <Target size={22} />
                    <h3>Make the next step smaller</h3>
                    <p>
                      {goals.length
                        ? `Your active goals need approximately ${fmt(goals.reduce((s, e) => s + monthlyNeed(state, e), 0))} per month to reach their target dates.`
                        : 'Set a goal and deadline to calculate a monthly contribution.'}
                    </p>
                  </div>
                  <div>
                    <ShieldCheck size={22} />
                    <h3>A little breathing room</h3>
                    <p>
                      {state.settings.budget
                        ? `This month’s recorded spending leaves ${fmt(remaining)} against your budget. Planned purchases and unrecorded bills are not deducted.`
                        : 'Set a monthly budget in Settings to see how your spending compares.'}
                    </p>
                  </div>
                </div>
              </section>
              <section className="panel">
                {sectionHeader('Your activity journal')}
                <div className="activity-list">
                  {state.activity.length ? (
                    state.activity.slice(0, 20).map((a) => (
                      <div key={a.id}>
                        <span className="activity-dot" />
                        <span>{a.text}</span>
                        <time>{format(new Date(a.date), 'MMM d, HH:mm')}</time>
                      </div>
                    ))
                  ) : (
                    <p className="muted">Your changes will be recorded here as you use the app.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {page === 'Settings' && (
            <div className="settings-layout">
              <section className="panel">
                {sectionHeader('The personal touches')}
                <div className="settings-row">
                  <div>
                    <strong>Your name</strong>
                    <p>A small hello, just for you.</p>
                  </div>
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveSettings({ name: new FormData(e.currentTarget).get('name') as string });
                    }}
                  >
                    <input
                      aria-label="Your name"
                      name="name"
                      maxLength={60}
                      defaultValue={state.settings.name}
                      placeholder="Your name"
                    />
                    <button className="icon-button" aria-label="Save name">
                      <Check size={18} />
                    </button>
                  </form>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Monthly budget</strong>
                    <p>Your spending guide, in {state.settings.currency}.</p>
                  </div>
                  <form
                    key={state.settings.budget}
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveSettings({ budget: Number(new FormData(e.currentTarget).get('budget')) });
                    }}
                  >
                    <input
                      aria-label="Monthly budget"
                      required
                      type="number"
                      min="0"
                      max="1000000000000"
                      step="0.01"
                      name="budget"
                      defaultValue={state.settings.budget}
                    />
                    <button className="icon-button" aria-label="Save budget">
                      <Check size={18} />
                    </button>
                  </form>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Currency</strong>
                    <p>Changes the display unit; amounts are not converted.</p>
                  </div>
                  <select
                    aria-label="Currency"
                    value={state.settings.currency}
                    onChange={(e) =>
                      setConfirmation({
                        title: 'Change display currency?',
                        text: 'Existing numeric amounts will stay the same. This does not perform currency conversion.',
                        action: () =>
                          saveSettings({
                            currency: e.target.value as State['settings']['currency'],
                          }),
                      })
                    }
                  >
                    {['UZS', 'USD', 'EUR', 'GBP'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Typography</strong>
                    <p>Uses Arial when your selected font isn’t installed.</p>
                  </div>
                  <select
                    aria-label="Typography"
                    value={state.settings.font}
                    onChange={(e) =>
                      saveSettings({ font: e.target.value as State['settings']['font'] })
                    }
                  >
                    <option value="google">Google Sans</option>
                    <option value="samsung">Samsung Sans</option>
                    <option value="arial">Arial</option>
                    <option value="system">System default</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Appearance</strong>
                    <p>A warm, comfortable view.</p>
                  </div>
                  <div className="segmented">
                    <button
                      className={state.settings.theme === 'dark' ? 'selected' : ''}
                      onClick={() => saveSettings({ theme: 'dark' })}
                    >
                      Gruvbox dark
                    </button>
                    <button
                      className={state.settings.theme === 'light' ? 'selected' : ''}
                      onClick={() => saveSettings({ theme: 'light' })}
                    >
                      Warm light
                    </button>
                  </div>
                </div>
              </section>
              <section className="panel">
                {sectionHeader('Your data stays yours')}
                <div className="privacy-callout">
                  <ShieldCheck size={25} />
                  <div>
                    <strong>Private by default. Saved on this device.</strong>
                    <p>
                      No account, bank connection, analytics, or AI data sharing. Your records stay
                      in this browser. Back up regularly; clearing browser data removes them.
                    </p>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Backup your workspace</strong>
                    <p>Download all records, history, and preferences as JSON.</p>
                  </div>
                  <button className="button secondary" onClick={backup}>
                    <Download size={16} />
                    Export backup
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Restore a backup</strong>
                    <p>Validates the file before replacing this workspace.</p>
                  </div>
                  <button className="button secondary" onClick={() => fileRef.current?.click()}>
                    <ArrowDownToLine size={16} />
                    Import backup
                  </button>
                  <input
                    ref={fileRef}
                    hidden
                    type="file"
                    accept=".json,application/json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        if (file.size > 10 * 1024 * 1024)
                          throw new Error('Choose a backup smaller than 10 MB.');
                        const data = validateState(JSON.parse(await file.text()));
                        setConfirmation({
                          title: 'Restore this backup?',
                          text: `Replace this workspace with ${data.entries.length} records and ${data.ledger.length} transactions. Export your current data first if you want to keep it.`,
                          action: () => replaceWorkspace(data),
                        });
                      } catch (error) {
                        notify(`Import failed: ${(error as Error).message}`);
                      }
                    }}
                  />
                </div>
                {storageError && (
                  <div className="settings-row">
                    <div>
                      <strong>Recover unreadable data</strong>
                      <p>Download the original stored data before resetting.</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() =>
                        download(
                          'mmv-recovery.txt',
                          localStorage.getItem(STORAGE_KEY) || '',
                          'text/plain',
                        )
                      }
                    >
                      Download recovery copy
                    </button>
                  </div>
                )}
                <div className="settings-row">
                  <div>
                    <strong>Storage overview</strong>
                    <p>
                      {state.entries.length} records · {state.ledger.length} transactions ·
                      approximately {Math.ceil(new Blob([JSON.stringify(state)]).size / 1024)} KB
                    </p>
                  </div>
                  <Pill tone="teal">Local storage</Pill>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Sample workspace</strong>
                    <p>Explore with example purchases, subscriptions, and goals.</p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() =>
                      setConfirmation({
                        title: 'Load sample data?',
                        text: 'This replaces your current records. Export a backup first if you want to keep them.',
                        action: () => replaceWorkspace(demoState()),
                      })
                    }
                  >
                    Load sample data
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <strong>Start fresh</strong>
                    <p>Clear all records while keeping your preferences.</p>
                  </div>
                  <button
                    className="button danger"
                    onClick={() =>
                      setConfirmation({
                        title: 'Clear this workspace?',
                        text: 'All records, transactions, and activity will be removed from this browser. Export a backup first. You can undo immediately after clearing.',
                        action: () =>
                          replaceWorkspace({ ...emptyState(), settings: state.settings }),
                      })
                    }
                  >
                    <Trash2 size={15} />
                    Clear all data
                  </button>
                </div>
              </section>
              <div className="settings-footer">
                <span className="brand-symbol tiny-brand">M</span>
                <span>
                  MMV Purchases · v1.0
                  <br />
                  <small>Built for a little more intention.</small>
                </span>
                <button className="text-button" onClick={() => setShowHelp(true)}>
                  About this workspace
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          )}
          <footer className="page-footer">
            <span>
              <Leaf size={13} />
              Spend thoughtfully. Save purposefully.
            </span>
            <button onClick={() => setShowHelp(true)}>
              <CircleHelp size={13} />A little help
            </button>
          </footer>
        </main>
      </div>

      {editor && (
        <Editor entry={editor} state={state} onClose={() => setEditor(null)} onSave={saveEntry} />
      )}
      {transaction && (
        <Contribution
          entry={transaction}
          state={state}
          onClose={() => setTransaction(null)}
          onSave={(amount, kind, note) => {
            commit(
              contribute(state, transaction.id, amount, kind, note),
              `${kind === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded for ${transaction.name}`,
            );
            setTransaction(null);
          }}
        />
      )}
      {selectedEntry && (
        <Modal
          title={selectedEntry.name}
          subtitle={`${kindName[selectedEntry.kind]} · ${selectedEntry.category}`}
          onClose={() => setDetail(null)}
        >
          <div className="detail-hero">
            {recordIcon(selectedEntry)}
            <strong>{fmt(total(selectedEntry))}</strong>
            <Pill tone="teal">{selectedEntry.deletedAt ? 'In trash' : selectedEntry.status}</Pill>
          </div>
          <dl className="detail-facts">
            <div>
              <dt>Date</dt>
              <dd>{niceDate(selectedEntry.date)}</dd>
            </div>
            {selectedEntry.kind === 'subscription' && (
              <div>
                <dt>Frequency</dt>
                <dd>{selectedEntry.frequency}</dd>
              </div>
            )}
            <div>
              <dt>Priority</dt>
              <dd>{selectedEntry.priority}</dd>
            </div>
            {selectedEntry.vendor && (
              <div>
                <dt>Vendor</dt>
                <dd>{selectedEntry.vendor}</dd>
              </div>
            )}
            {selectedEntry.kind === 'purchase' && (
              <div>
                <dt>Quantity</dt>
                <dd>
                  {selectedEntry.quantity} × {fmt(selectedEntry.amount)}
                </dd>
              </div>
            )}
            {['fund', 'goal'].includes(selectedEntry.kind) && (
              <div>
                <dt>Saved so far</dt>
                <dd>
                  {fmt(saved(state, selectedEntry))} · {Math.round(progress(state, selectedEntry))}%
                </dd>
              </div>
            )}
          </dl>
          {selectedEntry.notes && <p className="detail-notes">{selectedEntry.notes}</p>}
          {['fund', 'goal', 'subscription'].includes(selectedEntry.kind) && (
            <div className="history">
              <h3>Transaction history</h3>
              {state.ledger
                .filter((t) => t.entryId === (selectedEntry.fundId || selectedEntry.id))
                .slice()
                .reverse()
                .slice(0, 30)
                .map((t) => (
                  <div key={t.id}>
                    <span className={`history-icon ${t.kind}`}>
                      <ArrowDownLeft size={16} />
                    </span>
                    <span>
                      <strong>{t.kind}</strong>
                      <small>
                        {niceDate(t.date)}
                        {t.note ? ` · ${t.note}` : ''}
                      </small>
                    </span>
                    <b>
                      {t.kind === 'withdrawal' ? '-' : '+'}
                      {fmt(t.amount)}
                    </b>
                  </div>
                ))}
              {!state.ledger.some(
                (t) => t.entryId === (selectedEntry.fundId || selectedEntry.id),
              ) && <p className="muted small">No transactions recorded yet.</p>}
            </div>
          )}
          <div className="detail-actions">
            {selectedEntry.deletedAt ? (
              <button
                className="button primary"
                onClick={() =>
                  run(() =>
                    updateEntry(
                      { ...selectedEntry, deletedAt: null },
                      `${selectedEntry.name} restored`,
                    ),
                  )
                }
              >
                <Undo2 size={16} />
                Restore record
              </button>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => {
                    setEditor(selectedEntry);
                    setDetail(null);
                  }}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                {selectedEntry.kind === 'purchase' && selectedEntry.status !== 'Purchased' && (
                  <button
                    className="button primary"
                    onClick={() =>
                      run(() =>
                        updateEntry(
                          { ...selectedEntry, status: 'Purchased', date: today() },
                          `${selectedEntry.name} marked purchased`,
                        ),
                      )
                    }
                  >
                    <Check size={15} />
                    Mark purchased
                  </button>
                )}
                {selectedEntry.kind === 'subscription' &&
                  ['Active', 'Trial'].includes(selectedEntry.status) && (
                    <button
                      className="button primary"
                      onClick={() =>
                        run(() =>
                          commit(
                            payment(state, selectedEntry.id),
                            `${selectedEntry.name} payment recorded`,
                          ),
                        )
                      }
                    >
                      <Check size={15} />
                      Mark paid
                    </button>
                  )}
                {['fund', 'goal'].includes(selectedEntry.kind) && (
                  <button
                    className="button primary"
                    onClick={() => {
                      setTransaction(selectedEntry);
                      setDetail(null);
                    }}
                  >
                    <Plus size={15} />
                    Record savings
                  </button>
                )}
                {selectedEntry.kind === 'goal' && selectedEntry.status !== 'Purchased' && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setBuyGoal(selectedEntry);
                      setDetail(null);
                    }}
                  >
                    <ShoppingBag size={15} />
                    Complete purchase
                  </button>
                )}
                {selectedEntry.kind === 'event' && (
                  <button
                    className="button primary"
                    onClick={() =>
                      run(() =>
                        updateEntry(
                          {
                            ...selectedEntry,
                            status: selectedEntry.status === 'Completed' ? 'Upcoming' : 'Completed',
                          },
                          'Event updated',
                        ),
                      )
                    }
                  >
                    <Check size={15} />
                    {selectedEntry.status === 'Completed' ? 'Reopen' : 'Complete'}
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={() =>
                    run(() =>
                      updateEntry(
                        { ...selectedEntry, pinned: !selectedEntry.pinned },
                        selectedEntry.pinned ? 'Record unpinned' : 'Record pinned',
                      ),
                    )
                  }
                >
                  {selectedEntry.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    run(() =>
                      updateEntry(
                        { ...selectedEntry, archived: !selectedEntry.archived },
                        selectedEntry.archived ? 'Record unarchived' : 'Record archived',
                      ),
                    )
                  }
                >
                  <FolderArchive size={15} />
                  {selectedEntry.archived ? 'Unarchive' : 'Archive'}
                </button>
                {selectedEntry.kind === 'purchase' && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setEditor({
                        ...selectedEntry,
                        id: uid(),
                        name: `${selectedEntry.name} (copy)`,
                        createdAt: new Date().toISOString(),
                        status: 'Planned',
                      });
                      setDetail(null);
                    }}
                  >
                    <Copy size={15} />
                    Duplicate
                  </button>
                )}
                <button className="button danger" onClick={() => deleteEntry(selectedEntry)}>
                  <Trash2 size={15} />
                  Trash
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {buyGoal && (
        <Modal
          title={`Complete ${buyGoal.name}`}
          subtitle="Record the real price and use the money saved toward this goal."
          onClose={() => setBuyGoal(null)}
        >
          <form
            className="editor"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => {
                const price = Number(new FormData(event.currentTarget).get('price'));
                commit(
                  completeGoal(state, buyGoal.id, price),
                  `${buyGoal.name} purchased and savings updated`,
                );
                setBuyGoal(null);
              });
            }}
          >
            <p className="muted small">
              Available savings: {fmt(saved(state, buyGoal))}. This creates a purchase record and a
              matching savings withdrawal.
            </p>
            <label>
              Actual purchase price ({state.settings.currency})
              <input
                autoFocus
                name="price"
                type="number"
                min="0.01"
                max={saved(state, buyGoal)}
                step="0.01"
                defaultValue={buyGoal.amount}
                required
              />
            </label>
            <div className="modal-footer">
              <button type="button" className="button secondary" onClick={() => setBuyGoal(null)}>
                Cancel
              </button>
              <button className="button primary" type="submit">
                Complete purchase
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => setConfirmation(null)}>
          <p className="confirm-text">{confirmation.text}</p>
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setConfirmation(null)}>
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() =>
                run(() => {
                  confirmation.action();
                  setConfirmation(null);
                })
              }
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {showHelp && (
        <Modal
          title="A home for your money plans"
          subtitle="MMV Purchases · A local-first personal workspace"
          onClose={() => setShowHelp(false)}
        >
          <div className="help-content">
            <p>
              <strong>Purchases</strong> track what you plan to buy and what you’ve bought. Only
              purchased records count toward spending.
            </p>
            <p>
              <strong>Subscriptions</strong> forecast renewals. “Mark paid” records one payment and
              advances the due date. Pausing or cancelling here does not contact the provider.
            </p>
            <p>
              <strong>Savings and goals</strong> use recorded deposits and withdrawals. Connect one
              fund to one goal to keep progress aligned without double counting.
            </p>
            <p>
              <strong>Calendar and reports</strong> use your saved records. Reminders are shown
              inside the app; background push notifications and bank sync are not connected.
            </p>
            <p>
              <strong>Your browser is your workspace.</strong> Export backups regularly. Other
              devices and browsers have separate data. The app works offline after its first
              successful load.
            </p>
            <p>
              <strong>Insights are transparent calculations.</strong> AI, receipt recognition, live
              prices, and cloud sync are future integrations, not active services.
            </p>
            <p>
              <kbd>Ctrl / ⌘ K</kbd> Search everything · <kbd>Esc</kbd> Close dialogs
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          {undo && (
            <button
              onClick={() =>
                run(() => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(undo));
                  setState(undo);
                  setUndo(null);
                  setToast('Change undone');
                })
              }
            >
              <Undo2 size={14} />
              Undo
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function PurchaseTable({
  entries,
  fmt,
  onOpen,
  recordIcon,
}: {
  entries: Entry[];
  fmt: (amount: number, compact?: boolean) => string;
  onOpen: (e: Entry) => void;
  recordIcon: (e: Entry) => ReactNode;
}) {
  return entries.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Purchase</th>
            <th>Category</th>
            <th>Date</th>
            <th>Status</th>
            <th className="align-right">Amount</th>
            <th aria-label="Open record" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>
                <button className="table-name" onClick={() => onOpen(e)}>
                  {recordIcon(e)}
                  <span>
                    <strong>
                      {e.name}
                      {e.pinned && <span className="pin-dot"> · Pinned</span>}
                    </strong>
                    <small>{e.vendor || e.priority + ' priority'}</small>
                  </span>
                </button>
              </td>
              <td>
                <span className="category-label">{e.category}</span>
              </td>
              <td className="muted">{format(asDate(e.date), 'MMM d, yyyy')}</td>
              <td>
                <Pill
                  tone={
                    e.status === 'Purchased' ? 'teal' : e.status === 'Planned' ? 'gold' : 'muted'
                  }
                >
                  {e.deletedAt ? 'In trash' : e.status}
                </Pill>
              </td>
              <td className="align-right table-amount">{fmt(total(e))}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Open ${e.name}`}
                  onClick={() => onOpen(e)}
                >
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
