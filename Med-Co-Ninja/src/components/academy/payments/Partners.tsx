import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Handshake, Plus } from 'lucide-react';
import { academyApi, apiError, Partner, PartnerInput } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, usePartners } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, Input, inr, Modal, Page, Panel, SearchBox, Stat, Textarea, Toggle, Toolbar, useConfirm, actionsCol } from '../ui';

const EMPTY: PartnerInput = { name: '', email: '', phone: '', code: '', commissionPercent: 10, upiId: '', bankDetails: '', isActive: true };

const Partners = () => {
  const { data, isLoading, error } = usePartners();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<PartnerInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (d: PartnerInput) => (editing && editing !== 'new' ? academyApi.updatePartner(editing, d) : academyApi.createPartner(d)),
    { invalidate: [AK.partners], success: 'Partner saved' },
  );
  const remove = useAcademyMutation(academyApi.deletePartner, { invalidate: [AK.partners, AK.coupons], success: 'Partner deleted' });
  const set = <K extends keyof PartnerInput>(k: K, v: PartnerInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const open = (p?: Partner) => {
    setErrors({});
    setEditing(p ? p.id : 'new');
    setF(p ? { name: p.name, email: p.email ?? '', phone: p.phone ?? '', code: p.code, commissionPercent: p.commissionPercent, upiId: p.upiId ?? '', bankDetails: p.bankDetails ?? '', isActive: p.isActive } : EMPTY);
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter the partner name';
    if (!/^[A-Za-z0-9_-]{3,30}$/.test(f.code)) e.code = '3–30 letters, numbers, - or _';
    if (f.commissionPercent < 0 || f.commissionPercent > 100) e.commissionPercent = 'Between 0 and 100';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(f, { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) });
  };

  const rows = (data ?? []).filter((p) => `${p.name} ${p.code} ${p.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const sum = (k: 'totalSales' | 'earned' | 'paid' | 'balance') => (data ?? []).reduce((s, p) => s + p[k], 0);

  return (
    <Page
      title="Partners"
      subtitle="Affiliates and referrers who earn commission on sales"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Add Partner
        </Btn>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Partner sales" value={inr(sum('totalSales'))} />
        <Stat label="Commission earned" value={inr(sum('earned'))} tone="teal" />
        <Stat label="Paid out" value={inr(sum('paid'))} />
        <Stat label="Balance to pay" value={inr(sum('balance'))} tone="amber" hint={<Link to="/admin/payments/payouts" className="text-accent-teal hover:underline">Go to payouts →</Link>} />
      </div>
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search partners" />
        </Toolbar>
        <DataTable
          rows={rows}
          loading={isLoading}
          error={error}
          rowKey={(r) => r.id}
          minWidth={900}
          empty={<Empty icon={<Handshake className="h-5 w-5" />} title="No partners yet" text="Add a partner, link a coupon to them, and track their commission automatically." />}
          columns={[
            {
              header: 'Partner',
              cell: (r) => (
                <div>
                  <p className="font-medium text-text-charcoal">{r.name}</p>
                  <p className="text-[11px] text-slate-500">{[r.phone, r.email].filter(Boolean).join(' · ') || '—'}</p>
                </div>
              ),
            },
            { header: 'Code', cell: (r) => <span className="font-mono text-xs font-semibold">{r.code}</span> },
            { header: 'Commission', cell: (r) => `${r.commissionPercent}%`, align: 'center' },
            { header: 'Sales', cell: (r) => <span className="tabular-nums">{inr(r.totalSales)}</span>, align: 'right' },
            { header: 'Earned', cell: (r) => <span className="tabular-nums text-accent-teal">{inr(r.earned)}</span>, align: 'right' },
            { header: 'Paid', cell: (r) => <span className="tabular-nums">{inr(r.paid)}</span>, align: 'right' },
            { header: 'Balance', cell: (r) => <span className={`font-semibold tabular-nums ${r.balance > 0 ? 'text-amber-600' : ''}`}>{inr(r.balance)}</span>, align: 'right' },
            { header: 'Status', cell: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
            actionsCol<Partner>((r) => [
              { kind: 'edit', onClick: () => open(r) },
              {
                kind: 'delete',
                onClick: async () => {
                  if (await confirm({ title: `Delete partner ${r.name}?`, message: 'Linked coupons stay but lose their partner.' })) remove.mutate(r.id);
                },
              },
            ]),
          ]}
        />
      </Panel>

      <Modal
        open={!!editing}
        size="lg"
        title={editing === 'new' ? 'Add partner' : 'Edit partner'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn loading={save.isPending} onClick={submit}>
              Save partner
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name}>
            <Input value={f.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Partner code" required error={errors.code} hint="Short unique code, e.g. RAHUL">
            <Input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} className="font-mono uppercase" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Commission (%)" required error={errors.commissionPercent}>
            <Input type="number" min={0} max={100} step="0.5" value={f.commissionPercent} onChange={(e) => set('commissionPercent', Number(e.target.value))} />
          </Field>
          <Field label="UPI ID">
            <Input value={f.upiId ?? ''} onChange={(e) => set('upiId', e.target.value)} placeholder="name@bank" />
          </Field>
          <Field label="Bank details" className="sm:col-span-2">
            <Textarea className="min-h-[60px]" value={f.bankDetails ?? ''} onChange={(e) => set('bankDetails', e.target.value)} placeholder="Account name, number, IFSC" />
          </Field>
          <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active" />
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default Partners;
