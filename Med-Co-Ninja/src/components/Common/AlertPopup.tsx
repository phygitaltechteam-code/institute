import { ReactNode, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'error' | 'success' | 'info';
type PopupState = { title: string; message?: ReactNode; tone: Tone; buttonText: string } | null;

let current: PopupState = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/**
 * App-wide message popup (use instead of the browser's alert()).
 *   showPopup('Please select a batch first')
 *   showPopup('Saved', { tone: 'success', message: 'Details updated.' })
 */
export const showPopup = (
  title: string,
  opts: { message?: ReactNode; tone?: Tone; buttonText?: string } = {},
) => {
  current = { title, message: opts.message, tone: opts.tone ?? 'error', buttonText: opts.buttonText ?? 'OK' };
  emit();
};

const closePopup = () => {
  current = null;
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const toneStyle: Record<Tone, { icon: ReactNode; circle: string }> = {
  error: { icon: <AlertTriangle className="h-5 w-5" />, circle: 'bg-red-100 text-red-600' },
  success: { icon: <CheckCircle2 className="h-5 w-5" />, circle: 'bg-green-100 text-green-600' },
  info: { icon: <Info className="h-5 w-5" />, circle: 'bg-primary-navy/10 text-primary-navy' },
};

/** Mount once (App.tsx). Same look as ConfirmDialog, with a single OK button. */
export const AlertPopupHost = () => {
  const popup = useSyncExternalStore(subscribe, () => current);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && closePopup();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popup]);

  if (!popup) return null;
  const { icon, circle } = toneStyle[popup.tone];

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-primary-navy/50 p-4 backdrop-blur-sm"
      onClick={closePopup}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 px-5 pb-4 pt-5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${circle}`}>{icon}</div>
          <div className="min-w-0 pt-2">
            <h3 className="text-base font-semibold text-text-charcoal">{popup.title}</h3>
            {popup.message && <p className="mt-1 text-sm text-slate-500">{popup.message}</p>}
          </div>
        </div>
        <div className="flex border-t border-stroke bg-gray-50 px-5 py-3 sm:justify-end">
          <button
            type="button"
            onClick={closePopup}
            autoFocus
            className="w-full rounded-lg bg-primary-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-navy/90 sm:w-auto"
          >
            {popup.buttonText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default showPopup;
