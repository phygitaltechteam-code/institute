import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';
import { deleteAdmin, getAdmins, InstituteAdmin, updateAdmin, UpdateAdminPayload } from '@/lib/api/superAdmin/adminApi';
import { apiError } from '@/lib/api/admin/academyApi';
import {
  actionsCol,
  Badge,
  Btn,
  DataTable,
  Empty,
  Field,
  Input,
  Modal,
  Page,
  Pagination,
  Panel,
  SearchBox,
  srNoCol,
  Toggle,
  Toolbar,
  useConfirm,
  useDebounced,
} from '@/components/academy/ui';

export const Route = createFileRoute('/_app/_superadmin/superadmin/admins')({
  component: AdminsPage,
});

const PAGE_SIZE = 10;

function AdminsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 400);
  const [editing, setEditing] = useState<InstituteAdmin | null>(null);
  const { confirm, dialog } = useConfirm();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['superadmin-admins', page, PAGE_SIZE, term],
    queryFn: () => getAdmins({ page, limit: PAGE_SIZE, searchTerm: term }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success('Admin deleted');
      queryClient.invalidateQueries({ queryKey: ['superadmin-admins'] });
    },
    onError: (err) => toast.error(apiError(err).message),
  });

  const admins = data?.data;
  // If a delete empties the last page, step back one page
  useEffect(() => {
    if (data && page > 1 && data.data.length === 0) setPage((p) => p - 1);
  }, [data, page]);

  return (
    <Page
      title="Institute Admins"
      subtitle={data ? `${data.totalCount} total · ${data.activeCount} active` : 'Manage institute admin accounts'}
      action={
        <Link to="/superadmin/add-admin">
          <Btn icon={<Plus className="h-4 w-4" />}>Add Admin</Btn>
        </Link>
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
            placeholder="Search name, user ID, email, phone"
          />
        </Toolbar>
        <DataTable
          rows={admins}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          minWidth={960}
          startIndex={(page - 1) * PAGE_SIZE}
          empty={<Empty icon={<Users className="h-5 w-5" />} title={term ? 'No admins match your search' : 'No admins yet'} text={term ? undefined : 'Click “Add Admin” to create one.'} />}
          columns={[
            srNoCol(),
            { header: 'Name', cell: (r) => <span className="font-medium text-primary-navy">{r.fullname}</span> },
            { header: 'User ID', cell: (r) => <span className="whitespace-nowrap">{r.username}</span> },
            { header: 'Email', cell: (r) => <span className="break-all">{r.email}</span> },
            { header: 'Phone', cell: (r) => <span className="whitespace-nowrap">{r.phoneNumber}</span> },
            { header: 'Institute ID', cell: (r) => <span className="whitespace-nowrap">{r.adminId}</span> },
            { header: 'City', cell: (r) => r.city || '—' },
            { header: 'Status', cell: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
            actionsCol<InstituteAdmin>((r) => [
              { kind: 'edit', onClick: () => setEditing(r) },
              {
                kind: 'delete',
                disabled: remove.isPending && remove.variables === r.id,
                onClick: async () => {
                  if (await confirm({ title: `Delete admin “${r.fullname}”?`, message: 'They will no longer be able to log in.' })) remove.mutate(r.id);
                },
              },
            ]),
          ]}
        />
        {data && <Pagination page={page} totalPages={Math.max(data.totalPages, 1)} totalItems={data.totalItems} onChange={setPage} />}
      </Panel>
      {editing && <EditAdminModal admin={editing} onClose={() => setEditing(null)} />}
      {dialog}
    </Page>
  );
}

type EditForm = {
  fullname: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  isActive: boolean;
  adminId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gst: string;
  tagLine: string;
};

function EditAdminModal({ admin, onClose }: { admin: InstituteAdmin; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState<EditForm>({
    fullname: admin.fullname,
    username: admin.username,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    password: '',
    isActive: admin.isActive,
    adminId: admin.adminId,
    address: admin.address,
    city: admin.city,
    state: admin.state,
    country: admin.country,
    pincode: admin.pincode,
    gst: admin.gst ?? '',
    tagLine: admin.tagLine ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: (d: EditForm) => updateAdmin(admin.id, { ...d, password: d.password || null } as UpdateAdminPayload),
    onSuccess: () => {
      toast.success('Admin updated');
      queryClient.invalidateQueries({ queryKey: ['superadmin-admins'] });
      onClose();
    },
    onError: (err) => {
      const e = apiError(err);
      setErrors(e.fields);
      toast.error(e.message);
    },
  });

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.fullname.trim().length < 2) e.fullname = 'Enter the name';
    if (f.username.trim().length < 3) e.username = 'At least 3 characters';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (!/^[0-9+ -]{7,16}$/.test(f.phoneNumber)) e.phoneNumber = 'Enter a valid phone number';
    if (f.password && f.password.length < 6) e.password = 'At least 6 characters';
    (['adminId', 'address', 'city', 'state', 'country', 'pincode'] as const).forEach((k) => {
      if (!f[k].trim()) e[k] = 'Required';
    });
    setErrors(e);
    if (!Object.keys(e).length) save.mutate(f);
  };

  type TextKey = Exclude<keyof EditForm, 'isActive'>;
  const text = (k: TextKey, label: string, opts: { required?: boolean; type?: string; hint?: string; full?: boolean } = {}) => (
    <Field label={label} required={opts.required} error={errors[k]} hint={opts.hint} className={opts.full ? 'sm:col-span-2' : ''}>
      <Input
        type={opts.type ?? 'text'}
        value={f[k]}
        onChange={(e) => set(k, e.target.value)}
        autoComplete={opts.type === 'password' ? 'new-password' : undefined}
      />
    </Field>
  );

  return (
    <Modal
      open
      size="lg"
      title={`Edit admin · ${admin.fullname}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={save.isPending} onClick={submit}>
            Save changes
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-teal">Login details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {text('fullname', 'Name', { required: true })}
            {text('username', 'User ID', { required: true, hint: 'Used to log in' })}
            {text('email', 'Email', { required: true, type: 'email' })}
            {text('phoneNumber', 'Phone', { required: true, type: 'tel' })}
            {text('password', 'New password', { type: 'password', hint: 'Leave empty to keep the current password' })}
            <div className="flex items-end pb-1">
              <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active" hint="Inactive admins cannot log in" />
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-teal">Institute</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {text('adminId', 'Institute ID', { required: true })}
            {text('gst', 'GST number')}
            {text('tagLine', 'Tagline', { full: true })}
            {text('address', 'Address', { required: true, full: true })}
            {text('city', 'City', { required: true })}
            {text('state', 'State', { required: true })}
            {text('country', 'Country', { required: true })}
            {text('pincode', 'Pincode', { required: true })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
