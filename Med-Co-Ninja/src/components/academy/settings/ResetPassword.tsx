import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useChangeOwnPassword } from '@/lib/react-query/queriesAndMutations/dashboardAdmin';
import { Btn, Field, Input, Page, Panel } from '../ui';

const rules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p), label: 'Upper and lower case letters' },
  { test: (p: string) => /\d/.test(p), label: 'At least one number' },
];

/** Change the signed-in admin's own password (POST /users/change-password). */
const ResetPassword = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const change = useChangeOwnPassword();

  const submit = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Enter your current password';
    if (!rules.every((r) => r.test(next))) e.next = 'Password does not meet the rules below';
    if (next && next === current) e.next = 'New password must be different';
    if (confirm !== next) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
        },
      },
    );
  };

  return (
    <Page title="Reset Password" subtitle="Change the password you use to sign in">
      <Panel className="max-w-lg">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-navy/5 text-primary-navy">
              <KeyRound className="h-5 w-5" />
            </span>
            <p className="text-sm text-slate-600">For security, you will need your current password.</p>
          </div>
          <Field label="Current password" required error={errors.current}>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="New password" required error={errors.next}>
            <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <ul className="space-y-1 text-xs">
            {rules.map((r) => (
              <li key={r.label} className={r.test(next) ? 'text-accent-teal' : 'text-slate-500'}>
                {r.test(next) ? '✓' : '•'} {r.label}
              </li>
            ))}
          </ul>
          <Field label="Confirm new password" required error={errors.confirm}>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </Field>
          <Btn className="w-full" loading={change.isPending} onClick={submit}>
            Update password
          </Btn>
        </div>
      </Panel>
    </Page>
  );
};

export default ResetPassword;
