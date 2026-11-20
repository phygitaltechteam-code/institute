import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { UserPlus, Users } from 'lucide-react';
import { academyApi, apiError, Learner, LearnerInput } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useLearnerEnrollments, useLearners } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, fmtDate, Input, inr, Modal, Page, Pagination, Panel, SearchBox, Toggle, Toolbar, useDebounced, srNoCol, actionsCol } from '../ui';

const EMPTY: LearnerInput = { fullname: '', phoneNumber: '', email: '', password: '', city: '', state: '', pincode: '', address: '', qualification: '', collegeName: '', isActive: true };

const ManageStudents = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const { data, isLoading, error, isFetching } = useLearners({ page, limit: 20, search: term || undefined });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<LearnerInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<Learner | null>(null);
  const { data: enrollments, isLoading: loadingEnr } = useLearnerEnrollments(viewing?.id ?? null);

  const save = useAcademyMutation(
    (d: LearnerInput) => (editing && editing !== 'new' ? academyApi.updateLearner(editing, d) : academyApi.createLearner(d)),
    { invalidate: [AK.learners], success: editing === 'new' ? 'Student added' : 'Student updated' },
  );
  const toggleActive = useAcademyMutation(({ id, isActive }: { id: string; isActive: boolean }) => academyApi.updateLearner(id, { isActive }), {
    invalidate: [AK.learners],
    success: 'Status updated',
  });
  const set = <K extends keyof LearnerInput>(k: K, v: LearnerInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const open = (l?: Learner) => {
    setErrors({});
    setEditing(l ? l.id : 'new');
    setF(
      l
        ? { fullname: l.user.fullname, phoneNumber: l.user.phoneNumber, email: l.user.email, password: '', city: l.city, state: l.state, qualification: l.qualification ?? '', collegeName: l.collegeName ?? '', isActive: l.user.isActive }
        : EMPTY,
    );
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.fullname.trim().length < 2) e.fullname = 'Enter the full name';
    if (editing === 'new' ? !/^\d{10}$/.test(f.phoneNumber) : !/^[0-9+\- ]{7,16}$/.test(f.phoneNumber))
      e.phoneNumber = editing === 'new' ? 'Enter a 10-digit phone number' : 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (editing === 'new' && (f.password ?? '').length < 6) e.password = 'At least 6 characters';
    if (editing !== 'new' && f.password && f.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(f, { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) });
  };

  return (
    <Page
      title="Manage Students"
      subtitle="All students of your institute: online learners and batch students"
      action={
        <Btn icon={<UserPlus className="h-4 w-4" />} onClick={() => open()}>
          Add Student
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Name, phone, email or username"
          />
          <Link to="/admin/settings/bulk-students" className="ml-auto text-xs font-medium text-accent-teal hover:underline">
            Bulk import from Excel →
          </Link>
        </Toolbar>
        <DataTable
          rows={data?.items}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          minWidth={900}
          startIndex={(page - 1) * 20}
          empty={<Empty icon={<Users className="h-5 w-5" />} title={term ? 'No student matches your search' : 'No students yet'} />}
          columns={[
            srNoCol(),
            {
              header: 'Student',
              cell: (r) => (
                <div>
                  <p className="font-medium text-text-charcoal">{r.user.fullname}</p>
                  <p className="text-[11px] text-slate-500">Login: {r.user.username}</p>
                </div>
              ),
            },
            {
              header: 'Contact',
              cell: (r) => (
                <div className="text-xs">
                  <p>{r.user.phoneNumber}</p>
                  <p className="text-slate-500">{r.user.email}</p>
                </div>
              ),
            },
            { header: 'City', cell: (r) => r.city || '—' },
            {
              header: 'Batches',
              cell: (r) => (r.batches.length ? <span className="text-xs">{r.batches.join(', ')}</span> : <span className="text-xs text-slate-400">Online only</span>),
            },
            {
              header: 'Courses',
              align: 'center',
              cell: (r) => (
                <button type="button" onClick={() => setViewing(r)} className="font-semibold text-accent-teal hover:underline">
                  {r.enrollmentCount}
                </button>
              ),
            },
            { header: 'Joined', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
            {
              header: 'Active',
              cell: (r) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.user.isActive}
                  title={r.user.isActive ? 'Disable login' : 'Enable login'}
                  onClick={() => toggleActive.mutate({ id: r.id, isActive: !r.user.isActive })}
                  className={`relative h-5 w-9 rounded-full transition ${r.user.isActive ? 'bg-accent-teal' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${r.user.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              ),
            },
            actionsCol<Learner>((r) => [
              { kind: 'view', title: 'View courses', onClick: () => setViewing(r) },
              { kind: 'edit', onClick: () => open(r) },
            ]),
          ]}
        />
        {data && <Pagination page={page} totalPages={data.totalPages} totalItems={data.totalItems} onChange={setPage} />}
      </Panel>

      <Modal
        open={!!editing}
        size="lg"
        title={editing === 'new' ? 'Add student' : 'Edit student'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn loading={save.isPending} onClick={submit}>
              Save
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.fullname}>
            <Input value={f.fullname} onChange={(e) => set('fullname', e.target.value)} />
          </Field>
          <Field label="Phone" required error={errors.phoneNumber}>
            <Input
              inputMode="tel"
              maxLength={editing === 'new' ? 10 : 16}
              value={f.phoneNumber}
              onChange={(e) => set('phoneNumber', editing === 'new' ? e.target.value.replace(/\D/g, '') : e.target.value)}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label={editing === 'new' ? 'Password' : 'New password'} required={editing === 'new'} error={errors.password} hint={editing === 'new' ? 'Student logs in with email/username and this password' : 'Leave empty to keep the current password'}>
            <Input type="password" value={f.password ?? ''} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="City">
            <Input value={f.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={f.state ?? ''} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Qualification">
            <Input value={f.qualification ?? ''} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. B.Pharm, BDS" />
          </Field>
          <Field label="College">
            <Input value={f.collegeName ?? ''} onChange={(e) => set('collegeName', e.target.value)} />
          </Field>
          {editing !== 'new' && <Toggle checked={!!f.isActive} onChange={(v) => set('isActive', v)} label="Can log in" />}
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        size="lg"
        title={`Courses · ${viewing?.user.fullname ?? ''}`}
        onClose={() => setViewing(null)}
        footer={
          <Link to="/admin/enrollment/course">
            <Btn>Enroll in a course</Btn>
          </Link>
        }
      >
        <DataTable
          minWidth={560}
          rows={enrollments}
          loading={loadingEnr}
          rowKey={(r) => r.id}
          empty={<Empty title="Not enrolled in any course yet" />}
          columns={[
            { header: 'Course / Bundle', cell: (r) => r.course?.name ?? r.bundle?.name ?? '—' },
            { header: 'Enrolled', cell: (r) => fmtDate(r.createdAt) },
            { header: 'Paid', align: 'right', cell: (r) => inr(r.amountPaid) },
            { header: 'Access till', cell: (r) => (r.expiresAt ? fmtDate(r.expiresAt) : 'Lifetime') },
            { header: 'Status', cell: (r) => <Badge tone={r.status === 'ACTIVE' ? 'green' : 'red'}>{r.status === 'ACTIVE' ? 'Active' : 'Revoked'}</Badge> },
          ]}
        />
      </Modal>
    </Page>
  );
};

export default ManageStudents;
