import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { searchStudents } from '@/lib/api/studentLookupApi';
import StudentProfileDrawer, { inr } from './StudentProfileDrawer';

// Tiny global store so any button (sidebar, mobile bar) can open the search
let isOpen = false;
const listeners = new Set<() => void>();
const setOpen = (v: boolean) => {
  isOpen = v;
  listeners.forEach((l) => l());
};
export const openStudentSearch = () => setOpen(true);
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const useDebounced = (value: string, ms = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

/** Ctrl+K student search for Admin / Faculty panels. Mount once in the panel layout. */
const UniversalSearch = () => {
  const open = useSyncExternalStore(subscribe, () => isOpen);
  const role = useAuthContext().user?.role;
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = useDebounced(q.trim());
  const enabled = role === 'ADMIN' || role === 'TEACHER';

  // Ctrl/Cmd + K anywhere opens the search
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ('');
  }, [open]);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ['student-search', term, role],
    queryFn: () => searchStudents(role, term, 15),
    enabled: open && enabled && term.length >= 2,
    staleTime: 30_000,
  });
  useEffect(() => setActive(0), [term]);

  const pick = (id: string) => {
    setOpen(false);
    setProfileId(id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) pick(hits[active].id);
  };

  if (!enabled) return null;

  return (
    <>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-primary-navy/50 p-3 pt-[10vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 border-b border-stroke px-3">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search student by name, phone, email or college…"
                  className="h-12 w-full bg-transparent text-sm outline-none"
                />
                <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {term.length < 2 ? (
                  <p className="p-5 text-center text-sm text-slate-500">Type at least 2 letters to search students.</p>
                ) : isFetching && !hits.length ? (
                  <p className="p-5 text-center text-sm text-slate-500">Searching…</p>
                ) : !hits.length ? (
                  <p className="p-5 text-center text-sm text-slate-500">No student found for “{term}”.</p>
                ) : (
                  <ul>
                    {hits.map((h, i) => (
                      <li key={h.id}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => pick(h.id)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${i === active ? 'bg-primary-navy/10' : ''}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text-charcoal">{h.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {h.phone}
                              {h.batches.length ? ` · ${h.batches.map((b) => b.name).join(', ')}` : ' · No batch'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right text-xs">
                            {h.pendingFees > 0 ? (
                              <span className="font-semibold text-red-600">Due {inr(h.pendingFees)}</span>
                            ) : (
                              <span className="text-slate-500">Fees clear</span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-between border-t border-stroke bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                <span>↑ ↓ to move · Enter to open</span>
                <span>Ctrl + K</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <StudentProfileDrawer studentId={profileId} onClose={() => setProfileId(null)} />
    </>
  );
};

export default UniversalSearch;
