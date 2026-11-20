import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

/** Small themed confirmation popup (used for logout and other irreversible actions). */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmCls =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-primary-navy hover:bg-primary-navy/90';

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-primary-navy/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-primary-navy/10 text-primary-navy'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-charcoal">{title}</h3>
            {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
          </div>
        </div>
        <div className="flex gap-2 border-t border-stroke bg-gray-50 px-5 py-3 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-text-charcoal transition hover:bg-gray-100 sm:flex-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition sm:flex-none ${confirmCls}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialog;
