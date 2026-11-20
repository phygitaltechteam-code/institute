import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { useChangeOwnPassword } from '@/lib/react-query/queriesAndMutations/dashboardAdmin';

type Props = { open: boolean; onClose: () => void };

const passwordOk = (v: string) => v.length >= 8 && /\d/.test(v) && /[a-zA-Z]/.test(v);

/** Change the signed-in user's own password (uses POST /users/change-password). */
const ChangePasswordDialog = ({ open, onClose }: Props) => {
  const { mutate, isPending } = useChangeOwnPassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setTouched(false);
      setShow(false);
    }
  }, [open]);

  if (!open) return null;

  const errors = {
    current: !current ? 'Enter your current password' : '',
    next: !passwordOk(next) ? 'At least 8 characters with a letter and a number' : next === current ? 'Must be different from the current password' : '',
    confirm: confirm !== next ? "Passwords don't match" : '',
  };
  const valid = !errors.current && !errors.next && !errors.confirm;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    mutate({ currentPassword: current, newPassword: next }, { onSuccess: onClose });
  };

  const inputCls = (err: string) =>
    `w-full rounded-lg border px-3 py-2 pr-9 text-sm outline-none transition focus:ring-2 ${
      touched && err ? 'border-red-400 focus:ring-red-100' : 'border-stroke focus:border-accent-teal focus:ring-accent-teal/10'
    }`;

  const field = (label: string, value: string, set: (v: string) => void, err: string, autoComplete: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text-charcoal">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={autoComplete}
          className={inputCls(err)}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent-teal"
          aria-label={show ? 'Hide passwords' : 'Show passwords'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {touched && err && <span className="mt-0.5 block text-xs text-red-600">{err}</span>}
    </label>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-primary-navy/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-primary-navy px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <KeyRound className="h-4 w-4 text-accent-teal" /> Change password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          {field('Current password', current, setCurrent, errors.current, 'current-password')}
          {field('New password', next, setNext, errors.next, 'new-password')}
          {field('Confirm new password', confirm, setConfirm, errors.confirm, 'new-password')}
        </div>
        <div className="flex gap-2 border-t border-stroke bg-gray-50 px-4 py-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:flex-none"
          >
            {isPending ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

export default ChangePasswordDialog;
