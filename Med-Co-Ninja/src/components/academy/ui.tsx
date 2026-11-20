import { ReactNode, useEffect, useRef, useState, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  RotateCcw,
  Bold,
  ChevronLeft,
  ChevronRight,
  File as FileIcon,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Search,
  Underline,
  UploadCloud,
  X,
} from 'lucide-react';
import { FiEdit, FiEye } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import PageHeader from '@/components/Common/PageHeader';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import { academyApi, apiError, fileUrl, UploadResult } from '@/lib/api/admin/academyApi';
import toast from 'react-hot-toast';

// ── Formatting ────────────────────────────────────────────────
export const inr = (n?: number | null) =>
  `₹${(Math.round((n || 0) * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
export const fmtBytes = (n?: number | null) => {
  const b = n || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
/** yyyy-mm-dd for <input type="date"> */
export const toDateInput = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
/** yyyy-mm-ddThh:mm in local time for <input type="datetime-local"> */
export const toDateTimeInput = (d?: string | Date | null) => {
  if (!d) return '';
  const x = new Date(d);
  const off = x.getTimezoneOffset() * 60000;
  return new Date(x.getTime() - off).toISOString().slice(0, 16);
};
export const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export const useDebounced = <T,>(value: T, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

// ── Layout ────────────────────────────────────────────────────
export const Page = ({
  title,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <div className="p-2">
    {/* Title left, buttons right on every screen size (like Batch Management); subtitles are not shown */}
    <PageHeader title={title} action={action && <div className="flex flex-wrap justify-end gap-2">{action}</div>} />
    <div className="space-y-4">{children}</div>
  </div>
);

export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`min-w-0 rounded-lg border border-stroke bg-white shadow-default ${className}`}>{children}</div>
);

export const PanelHeader = ({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-4 py-3">
    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-text-charcoal sm:text-base">{title}</h2>
      {subtitle && <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Toolbar = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 border-b border-stroke p-3">{children}</div>
);

// ── Buttons ───────────────────────────────────────────────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'teal' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
};
export const Btn = ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest }: BtnProps) => {
  // Same look as the institute section's GenericButton (e.g. "+ Create Batch"): navy, rounded, medium weight
  const v = {
    primary: 'bg-primary-navy text-white hover:bg-primary-navy/90 focus:ring-primary-navy/50',
    teal: 'bg-primary-navy text-white hover:bg-primary-navy/90 focus:ring-primary-navy/50',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-primary-navy focus:ring-gray-300',
  }[variant];
  const s = size === 'sm' ? 'px-2 py-1 text-xs sm:px-2.5 sm:py-1.5' : 'px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm';
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

export const IconBtn = ({
  title,
  onClick,
  children,
  tone = 'navy',
  disabled,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  tone?: 'navy' | 'red' | 'teal';
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40 ${
      tone === 'red'
        ? 'text-red-600 hover:bg-red-50'
        : tone === 'teal'
          ? 'text-accent-teal hover:bg-accent-teal/10'
          : 'text-primary-navy hover:bg-primary-navy/5'
    }`}
  >
    {children}
  </button>
);

// ── Form controls ─────────────────────────────────────────────
// Same as the institute section's inputs
const control =
  'w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm text-text-charcoal outline-none transition placeholder:text-slate-400 focus:border-primary-navy active:border-primary-navy disabled:cursor-default disabled:bg-slate-50';

export const Field = ({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div className={className}>
    {label && (
      <label className="mb-1.5 block text-sm font-medium text-text-charcoal">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
    )}
    {children}
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

export const Input = ({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`${control} ${className}`} {...p} />
);
export const Textarea = ({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`${control} min-h-[90px] ${className}`} {...p} />
);
export const Select = ({ className = '', children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`${control} ${className}`} {...p}>
    {children}
  </select>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <label className="flex cursor-pointer items-start gap-3">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-accent-teal' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
    <span>
      <span className="block text-sm font-medium text-text-charcoal">{label}</span>
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </span>
  </label>
);

export const SearchBox = ({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="relative w-full sm:max-w-xs">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm outline-none focus:border-accent-teal"
    />
  </div>
);

// ── Status ────────────────────────────────────────────────────
type Tone = 'green' | 'gray' | 'amber' | 'red' | 'navy' | 'teal';
export const Badge = ({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) => {
  const t = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    navy: 'bg-primary-navy/5 text-primary-navy ring-primary-navy/20',
    teal: 'bg-accent-teal/10 text-accent-teal ring-accent-teal/30',
  }[tone];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${t}`}>
      {children}
    </span>
  );
};

export const Empty = ({ icon, title, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
    {icon && (
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-navy/5 text-primary-navy">{icon}</span>
    )}
    <p className="font-semibold text-text-charcoal">{title}</p>
    
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Loading = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
    <Loader2 className="h-4 w-4 animate-spin text-accent-teal" /> {text}
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => (
  <div className="py-10 text-center text-sm text-red-600">
    {apiError(error).message}
    {onRetry && (
      <div className="mt-3">
        <Btn variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Btn>
      </div>
    )}
  </div>
);

// ── Row actions ───────────────────────────────────────────────
/**
 * The one set of row actions used across the panel. Each kind always has the same icon,
 * colour and position, so every table and list looks and behaves the same.
 */
const ACTION_KINDS = {
  // view / edit / delete use the same icons as the institute section's GenericTable
  view: { icon: FiEye, tone: 'teal', title: 'View' },
  open: { icon: ExternalLink, tone: 'teal', title: 'Open' },
  copy: { icon: Copy, tone: 'navy', title: 'Copy' },
  approve: { icon: CheckCircle2, tone: 'teal', title: 'Approve' },
  restore: { icon: RotateCcw, tone: 'navy', title: 'Restore' },
  revoke: { icon: Ban, tone: 'amber', title: 'Revoke' },
  up: { icon: ArrowUp, tone: 'navy', title: 'Move up' },
  down: { icon: ArrowDown, tone: 'navy', title: 'Move down' },
  edit: { icon: FiEdit, tone: 'navy', title: 'Edit' },
  delete: { icon: MdDelete, tone: 'red', title: 'Delete' },
} as const;
export type RowActionKind = keyof typeof ACTION_KINDS;
const KIND_ORDER = Object.keys(ACTION_KINDS) as RowActionKind[];
// Grey icon that takes its colour on hover, as in the institute tables
const TONE_CLASS = {
  navy: 'text-slate-600 hover:bg-primary-navy/10 hover:text-primary-navy',
  teal: 'text-slate-600 hover:bg-accent-teal/10 hover:text-accent-teal',
  amber: 'text-slate-600 hover:bg-amber-500/10 hover:text-amber-600',
  red: 'text-slate-600 hover:bg-red-500/10 hover:text-red-500',
};

export type RowActionDef = {
  kind: RowActionKind;
  /** Tooltip; defaults to the kind's name (e.g. "Edit") */
  title?: string;
  onClick?: () => void;
  /** Render as a link instead of a button (opens in a new tab) */
  href?: string;
  disabled?: boolean;
  /** For "copy": show a tick for a moment after copying */
  done?: boolean;
};

export const RowAction = ({ kind, title, onClick, href, disabled, done }: RowActionDef) => {
  const k = ACTION_KINDS[kind];
  const Icon = kind === 'copy' && done ? Check : k.icon;
  const label = title ?? k.title;
  const cls = `inline-flex shrink-0 items-center justify-center rounded p-1 transition-colors sm:p-1.5 disabled:pointer-events-none disabled:opacity-40 ${TONE_CLASS[k.tone]}`;
  if (href && !disabled)
    return (
      <a href={href} target="_blank" rel="noreferrer" title={label} aria-label={label} className={cls}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </a>
    );
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={cls}>
      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${done ? 'text-emerald-600' : ''}`} />
    </button>
  );
};

/** Pass the actions in any order; they are always shown in the standard order. Falsy entries are skipped. */
export const RowActions = ({ actions, className = '' }: { actions: (RowActionDef | false | null | undefined)[]; className?: string }) => (
  <div className={`flex items-center gap-1 ${className || 'justify-end'}`}>
    {(actions.filter(Boolean) as RowActionDef[])
      .map((a, i) => ({ a, i }))
      .sort((x, y) => KIND_ORDER.indexOf(x.a.kind) - KIND_ORDER.indexOf(y.a.kind) || x.i - y.i)
      .map(({ a, i }) => (
        <RowAction key={`${a.kind}-${i}`} {...a} />
      ))}
  </div>
);

/** Standard last column of every table. */
export const actionsCol = <T,>(actions: (row: T) => (RowActionDef | false | null | undefined)[]): Col<T> => ({
  header: 'Action',
  className: 'w-px whitespace-nowrap',
  cell: (r) => <RowActions actions={actions(r)} className="justify-center" />,
});

// ── Table ─────────────────────────────────────────────────────
export type Col<T> = {
  header: ReactNode;
  cell: (row: T, i: number) => ReactNode;
  className?: string;
  /** Cells are centred like the institute tables; 'left' only for Sr. No. ('right' is kept for old callers and shown centred). */
  align?: 'left' | 'right' | 'center';
};

/** Standard serial-number column (left-aligned, as in the institute tables). */
export const srNoCol = <T,>(): Col<T> => ({
  header: 'Sr. No.',
  cell: (_r, i) => <span className="tabular-nums">{i + 1}</span>,
  className: 'w-14 whitespace-nowrap',
  align: 'left',
});

export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty,
  minWidth = 720,
  dim,
  startIndex = 0,
}: {
  columns: Col<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  empty?: ReactNode;
  minWidth?: number;
  dim?: boolean;
  startIndex?: number;
}) => {
  // Same look as the institute section's GenericTable: everything centred except Sr. No.
  const isLeft = (c: Col<T>) => c.align === 'left';
  const textAlign = (c: Col<T>) => (isLeft(c) ? 'text-left' : 'text-center');
  const justify = (c: Col<T>) => (isLeft(c) ? 'justify-start' : 'justify-center');

  // Loading / error / empty messages sit below the header, outside the scroll area, so they stay centred on phones
  const status = loading ? <Loading /> : error ? <ErrorState error={error} /> : !rows || rows.length === 0 ? (empty ?? <Empty title="No records found." />) : null;

  return (
    <div className="min-w-0">
      {/* Same table on every screen size; on narrow screens it scrolls sideways */}
      <div className="max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className="w-full table-auto" style={{ minWidth }}>
          <thead>
            <tr className="bg-primary-navy">
              {columns.map((c, i) => (
                <th key={i} className={`whitespace-nowrap px-2 py-2 text-xs font-semibold text-pure-white sm:px-3 sm:py-2.5 sm:text-sm ${textAlign(c)} ${c.className ?? ''}`}>
                  <div className={`flex items-center gap-1 ${justify(c)}`}>{c.header}</div>
                </th>
              ))}
            </tr>
          </thead>
          {!status && rows && (
            <tbody className={dim ? 'opacity-60' : ''}>
              {rows.map((r, i) => (
                <tr key={rowKey(r)} className={`border-b border-stroke transition-colors hover:bg-primary-navy/10 ${i % 2 === 0 ? 'bg-pure-white' : 'bg-slate-100'}`}>
                  {columns.map((c, j) => (
                    <td key={j} className={`border-b border-slate-100 px-2 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm ${textAlign(c)} ${c.className ?? ''}`}>
                      <div className={`flex items-center ${justify(c)}`}>
                        <div className={`min-w-0 ${textAlign(c)}`}>{c.cell(r, startIndex + i)}</div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {status}
    </div>
  );
};

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems?: number;
  onChange: (p: number) => void;
}) => (
  // Same as the institute section's GenericTable pagination
  <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3 sm:py-3">
    <span className="text-xs text-slate-600 sm:text-sm">
      Page <span className="font-semibold text-primary-navy">{page}</span> of <span className="font-semibold text-primary-navy">{Math.max(1, totalPages)}</span>
      {totalItems !== undefined && <span className="ml-1 text-slate-400 sm:ml-2">({totalItems} records)</span>}
    </span>
    <div className="flex items-center gap-1">
      {[
        { title: 'Previous page', disabled: page <= 1, to: page - 1, icon: <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /> },
        { title: 'Next page', disabled: page >= totalPages, to: page + 1, icon: <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /> },
      ].map((b) => (
        <button
          key={b.title}
          type="button"
          title={b.title}
          aria-label={b.title}
          disabled={b.disabled}
          onClick={() => onChange(b.to)}
          className="rounded-lg border border-stroke p-1 text-slate-600 transition-all hover:border-primary-navy hover:bg-primary-navy hover:text-pure-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stroke disabled:hover:bg-transparent disabled:hover:text-slate-600 sm:p-1.5"
        >
          {b.icon}
        </button>
      ))}
    </div>
  </div>
);

// ── Modal ─────────────────────────────────────────────────────
export const Modal = ({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-primary-navy/50 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className={`flex max-h-[92dvh] w-full ${w} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-xl`}>
        <div className="flex items-center justify-between gap-3 border-b border-stroke px-4 py-3">
          <h3 className="text-base font-semibold text-text-charcoal">{title}</h3>
          <IconBtn title="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-stroke bg-slate-50 px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

/** Promise-based confirm: `if (await confirm({...})) doIt()` */
export const useConfirm = () => {
  const [state, setState] = useState<{
    title: string;
    message?: ReactNode;
    confirmText?: string;
    tone?: 'danger' | 'primary';
    resolve: (ok: boolean) => void;
  } | null>(null);
  const confirm = (opts: { title: string; message?: ReactNode; confirmText?: string; tone?: 'danger' | 'primary' }) =>
    new Promise<boolean>((resolve) => setState({ ...opts, resolve }));
  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };
  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title ?? ''}
      message={state?.message}
      confirmText={state?.confirmText ?? 'Delete'}
      tone={state?.tone ?? 'danger'}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );
  return { confirm, dialog };
};

// ── File upload ───────────────────────────────────────────────
export const FileUpload = ({
  value,
  onUploaded,
  onClear,
  accept,
  kind = 'file',
  label = 'Click to upload',
  hint,
}: {
  value?: string | null;
  onUploaded: (r: UploadResult) => void;
  onClear?: () => void;
  accept?: string;
  kind?: 'image' | 'video' | 'file';
  label?: string;
  hint?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setProgress(0);
    try {
      const r = await academyApi.upload(file, setProgress);
      onUploaded(r);
    } catch (e) {
      toast.error(apiError(e).message);
    } finally {
      setProgress(null);
      if (ref.current) ref.current.value = '';
    }
  };

  const src = fileUrl(value);
  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {value && progress === null ? (
        <div className="flex items-center gap-3 rounded-lg border border-stroke p-2">
          {kind === 'image' ? (
            <img src={src} alt="" className="h-16 w-24 shrink-0 rounded-md bg-slate-100 object-cover" />
          ) : kind === 'video' ? (
            <video src={src} className="h-16 w-24 shrink-0 rounded-md bg-black object-cover" muted />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-navy/5 text-primary-navy">
              <FileIcon className="h-5 w-5" />
            </span>
          )}
          <a href={src} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs text-accent-teal hover:underline">
            {value.split('/').pop()}
          </a>
          <Btn variant="outline" size="sm" onClick={() => ref.current?.click()}>
            Replace
          </Btn>
          {onClear && (
            <IconBtn title="Remove" tone="red" onClick={onClear}>
              <X className="h-4 w-4" />
            </IconBtn>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={progress !== null}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stroke px-4 py-5 text-center transition hover:border-accent-teal hover:bg-accent-teal/5 disabled:cursor-wait"
        >
          {progress !== null ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-accent-teal" />
              <span className="text-sm font-medium text-text-charcoal">Uploading… {progress}%</span>
              <span className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full bg-accent-teal transition-all" style={{ width: `${progress}%` }} />
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-accent-teal" />
              <span className="text-sm font-medium text-text-charcoal">{label}</span>
              {hint && <span className="text-xs text-slate-500">{hint}</span>}
            </>
          )}
        </button>
      )}
    </div>
  );
};

// ── Rich text (no extra dependency) ───────────────────────────
export const RichText = ({ value, onChange, minHeight = 260 }: { value: string; onChange: (html: string) => void; minHeight?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Load external value only when it differs (avoids caret jumps while typing)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
  }, [value]);
  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };
  const tools: { title: string; icon: ReactNode; act: () => void }[] = [
    { title: 'Bold', icon: <Bold className="h-4 w-4" />, act: () => run('bold') },
    { title: 'Italic', icon: <Italic className="h-4 w-4" />, act: () => run('italic') },
    { title: 'Underline', icon: <Underline className="h-4 w-4" />, act: () => run('underline') },
    { title: 'Heading', icon: <Heading2 className="h-4 w-4" />, act: () => run('formatBlock', 'h2') },
    { title: 'Bulleted list', icon: <List className="h-4 w-4" />, act: () => run('insertUnorderedList') },
    { title: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, act: () => run('insertOrderedList') },
    {
      title: 'Link',
      icon: <Link2 className="h-4 w-4" />,
      act: () => {
        const url = window.prompt('Link URL');
        if (url) run('createLink', url);
      },
    },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-stroke focus-within:border-accent-teal">
      <div className="flex flex-wrap gap-0.5 border-b border-stroke bg-slate-50 p-1">
        {tools.map((t) => (
          <IconBtn key={t.title} title={t.title} onClick={t.act}>
            {t.icon}
          </IconBtn>
        ))}
        <Btn variant="ghost" size="sm" onClick={() => run('formatBlock', 'p')}>
          Normal
        </Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose-academy max-w-none px-3 py-2 text-sm text-text-charcoal outline-none"
        style={{ minHeight }}
      />
    </div>
  );
};

/** Simple key/value stat tile used across academy screens. */
export const Stat = ({ label, value, hint, tone = 'navy' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'navy' | 'teal' | 'amber' | 'red' }) => (
  <div className="rounded-xl border border-stroke bg-white p-3 shadow-sm sm:p-4">
    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
    <p
      className={`mt-1 truncate text-lg font-bold sm:text-2xl ${
        { navy: 'text-primary-navy', teal: 'text-accent-teal', amber: 'text-amber-600', red: 'text-red-600' }[tone]
      }`}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">{hint}</p>}
  </div>
);

export const PAYMENT_MODES = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'ONLINE', label: 'Online gateway' },
  { value: 'FREE', label: 'Free / complimentary' },
] as const;
export const paymentLabel = (m: string) => PAYMENT_MODES.find((x) => x.value === m)?.label ?? m;
