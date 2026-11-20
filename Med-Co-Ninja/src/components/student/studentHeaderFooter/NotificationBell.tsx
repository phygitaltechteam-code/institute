import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileQuestion,
  IndianRupee,
} from 'lucide-react';
import { getStudentNotifications, StudentNotification } from '@/lib/api/studentLookupApi';
import { formatDateTimeAuto } from '@/utils/dateTimeUtils';

const SEEN_KEY = 'student-notifications-seen';
const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeSeen = (ids: string[]) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-300)));
  } catch {
    /* storage unavailable */
  }
};

const icons: Record<StudentNotification['type'], { icon: JSX.Element; cls: string }> = {
  CLASS: { icon: <CalendarClock className="h-4 w-4" />, cls: 'bg-blue-100 text-blue-700' },
  INTERVIEW: { icon: <Briefcase className="h-4 w-4" />, cls: 'bg-purple-100 text-purple-700' },
  TASK: { icon: <BookOpen className="h-4 w-4" />, cls: 'bg-teal-100 text-teal-700' },
  ASSIGNMENT: { icon: <ClipboardList className="h-4 w-4" />, cls: 'bg-amber-100 text-amber-700' },
  EXAM: { icon: <FileQuestion className="h-4 w-4" />, cls: 'bg-indigo-100 text-indigo-700' },
  FEE: { icon: <IndianRupee className="h-4 w-4" />, cls: 'bg-red-100 text-red-700' },
  PAYMENT: { icon: <CreditCard className="h-4 w-4" />, cls: 'bg-green-100 text-green-700' },
};

/** Opens a student-dashboard tab (the dashboard listens for this event). */
export const STUDENT_TAB_EVENT = 'student-dashboard-tab';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: getStudentNotifications,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const unread = useMemo(() => items.filter((n) => !seen.includes(n.id)).length, [items, seen]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markAllRead = () => {
    const ids = Array.from(new Set([...seen, ...items.map((n) => n.id)]));
    setSeen(ids);
    writeSeen(ids);
  };

  const onItem = (n: StudentNotification) => {
    const ids = Array.from(new Set([...seen, n.id]));
    setSeen(ids);
    writeSeen(ids);
    setOpen(false);
    if (n.url) {
      window.open(n.url, '_blank', 'noopener');
      return;
    }
    if (n.tab !== undefined) {
      localStorage.setItem('activeDashboardTab', String(n.tab));
      window.dispatchEvent(new CustomEvent(STUDENT_TAB_EVENT, { detail: n.tab }));
      navigate({ to: '/student/studentdahboard' });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-pure-white transition hover:bg-white/10"
        title="Notifications"
        aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-14 z-50 overflow-hidden rounded-xl border border-stroke bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-10 sm:w-96">
          <div className="flex items-center justify-between border-b border-stroke px-3 py-2">
            <p className="text-sm font-semibold text-text-charcoal">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary-navy hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <p className="p-5 text-center text-sm text-slate-500">Loading…</p>
            ) : isError ? (
              <p className="p-5 text-center text-sm text-red-600">Could not load notifications.</p>
            ) : !items.length ? (
              <p className="p-5 text-center text-sm text-slate-500">You're all caught up.</p>
            ) : (
              <ul>
                {items.map((n) => {
                  const isNew = !seen.includes(n.id);
                  const { icon, cls } = icons[n.type] || icons.TASK;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => onItem(n)}
                        className={`flex w-full items-start gap-3 border-b border-stroke/70 px-3 py-2.5 text-left transition hover:bg-slate-50 ${isNew ? 'bg-primary-navy/5' : ''}`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>{icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-text-charcoal">{n.title}</span>
                            {isNew && <span className="h-2 w-2 rounded-full bg-red-500" />}
                          </span>
                          <span className="block text-xs text-slate-600">{n.message}</span>
                          {n.type !== 'PAYMENT' && <span className="block text-[11px] text-slate-400">{formatDateTimeAuto(n.date)}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
