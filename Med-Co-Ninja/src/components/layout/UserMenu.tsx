import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import ChangePasswordDialog from '@/components/Common/ChangePasswordDialog';

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEACHER: 'Faculty',
  STUDENT: 'Student',
};

/**
 * Signed-in user menu (adapted from the admin-panel DropdownUser): name + role,
 * Change password, Sign out (with confirmation). `tone="dark"` for navy bars.
 */
const UserMenu = ({ tone = 'light' }: { tone?: 'light' | 'dark' }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = user?.fullname || user?.username || 'User';
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const role = ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '';

  const signOut = () => {
    setConfirmLogout(false);
    logout();
    navigate({ to: '/signin' });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-lg px-1.5 py-1 transition ${
          tone === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-teal text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className={`block max-w-[160px] truncate text-sm font-semibold ${tone === 'dark' ? 'text-white' : 'text-text-charcoal'}`}>
            {name}
          </span>
          <span className={`block text-[11px] ${tone === 'dark' ? 'text-white/70' : 'text-slate-500'}`}>{role}</span>
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 transition-transform sm:block ${open ? 'rotate-180' : ''} ${
            tone === 'dark' ? 'text-white/70' : 'text-slate-400'
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-56 overflow-hidden rounded-xl border border-stroke bg-white shadow-xl"
        >
          <div className="border-b border-stroke px-4 py-3">
            <p className="truncate text-sm font-semibold text-text-charcoal">{name}</p>
            <p className="truncate text-xs text-slate-500">
              {role}
              {user?.username ? ` · ${user.username}` : ''}
            </p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setChangePw(true);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-charcoal transition hover:bg-bg-light-mint"
          >
            <KeyRound className="h-4 w-4 text-primary-navy" /> Change password
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmLogout(true);
            }}
            className="flex w-full items-center gap-2.5 border-t border-stroke px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}

      <ChangePasswordDialog open={changePw} onClose={() => setChangePw(false)} />
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="You will need to log in again to continue."
        confirmText="Sign out"
        onConfirm={signOut}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
};

export default UserMenu;
