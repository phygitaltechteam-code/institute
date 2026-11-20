import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, TicketPercent } from 'lucide-react';
import { academyApi, apiError, Coupon, CouponInput } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCoupons, useCourseOptions, usePartners } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, fmtDate, Input, inr, Modal, numOrNull, Page, Panel, SearchBox, Select, Textarea, toDateInput, Toggle, Toolbar, useConfirm, actionsCol, RowAction } from '../ui';

const EMPTY: CouponInput = { code: '', description: '', discountType: 'PERCENT', value: 10, maxUses: null, minAmount: null, validFrom: '', validTo: '', isActive: true, courseId: '', partnerId: '' };

const couponState = (c: Coupon): { label: string; tone: 'green' | 'gray' | 'amber' | 'red' } => {
  const now = Date.now();
  if (!c.isActive) return { label: 'Inactive', tone: 'gray' };
  if (c.validTo && new Date(c.validTo).getTime() + 86399999 < now) return { label: 'Expired', tone: 'red' };
  if (c.validFrom && new Date(c.validFrom).getTime() > now) return { label: 'Scheduled', tone: 'amber' };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { label: 'Used up', tone: 'red' };
  return { label: 'Active', tone: 'green' };
};

const Coupons = () => {
  const { data, isLoading, error } = useCoupons();
  const { data: courses } = useCourseOptions();
  const { data: partners } = usePartners();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<CouponInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (d: CouponInput) => (editing && editing !== 'new' ? academyApi.updateCoupon(editing, d) : academyApi.createCoupon(d)),
    { invalidate: [AK.coupons], success: 'Coupon saved' },
  );
  const remove = useAcademyMutation(academyApi.deleteCoupon, { invalidate: [AK.coupons], success: 'Coupon deleted' });
  const set = <K extends keyof CouponInput>(k: K, v: CouponInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const open = (c?: Coupon) => {
    setErrors({});
    setEditing(c ? c.id : 'new');
    setF(
      c
        ? {
            code: c.code,
            description: c.description ?? '',
            discountType: c.discountType,
            value: c.value,
            maxUses: c.maxUses,
            minAmount: c.minAmount,
            validFrom: toDateInput(c.validFrom),
            validTo: toDateInput(c.validTo),
            isActive: c.isActive,
            courseId: c.course?.id ?? '',
            partnerId: c.partner?.id ?? '',
          }
        : EMPTY,
    );
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z0-9_-]{3,30}$/.test(f.code)) e.code = '3–30 letters, numbers, - or _';
    if (!(f.value > 0)) e.value = 'Must be more than 0';
    if (f.discountType === 'PERCENT' && f.value > 100) e.value = 'Percentage cannot exceed 100';
    if (f.validFrom && f.validTo && f.validFrom > f.validTo) e.validTo = 'End date must be after start date';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { ...f, courseId: f.courseId || null, partnerId: f.partnerId || null, validFrom: f.validFrom || null, validTo: f.validTo || null },
      { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) },
    );
  };

  const rows = (data ?? []).filter((c) => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page
      title="Coupons"
      subtitle="Discount codes students or staff can apply at enrollment"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Create Coupon
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search code" />
        </Toolbar>
        <DataTable
          rows={rows}
          loading={isLoading}
          error={error}
          rowKey={(r) => r.id}
          minWidth={860}
          empty={<Empty icon={<TicketPercent className="h-5 w-5" />} title="No coupons yet" text="Create codes like WELCOME10 or FESTIVE500." />}
          columns={[
            {
              header: 'Code',
              cell: (r) => (
                <div className="flex items-center gap-1">
                  <span className="rounded-md border border-dashed border-accent-teal bg-accent-teal/5 px-2 py-0.5 font-mono text-xs font-bold text-accent-teal">{r.code}</span>
                  <RowAction
                    kind="copy"
                    title="Copy code"
                    onClick={() => {
                      navigator.clipboard?.writeText(r.code);
                      toast.success('Copied');
                    }}
                  />
                </div>
              ),
            },
            { header: 'Discount', cell: (r) => <span className="font-semibold">{r.discountType === 'PERCENT' ? `${r.value}%` : inr(r.value)}</span> },
            { header: 'Applies to', cell: (r) => <span className="text-xs">{r.course?.name ?? 'All courses & bundles'}</span> },
            { header: 'Usage', cell: (r) => `${r.usedCount}${r.maxUses != null ? ` / ${r.maxUses}` : ''}` },
            { header: 'Validity', cell: (r) => <span className="whitespace-nowrap text-xs">{r.validFrom || r.validTo ? `${r.validFrom ? fmtDate(r.validFrom) : '…'} – ${r.validTo ? fmtDate(r.validTo) : '…'}` : 'No limit'}</span> },
            { header: 'Partner', cell: (r) => r.partner?.name ?? '—' },
            {
              header: 'Status',
              cell: (r) => {
                const s = couponState(r);
                return <Badge tone={s.tone}>{s.label}</Badge>;
              },
            },
            actionsCol<Coupon>((r) => [
              { kind: 'edit', onClick: () => open(r) },
              {
                kind: 'delete',
                onClick: async () => {
                  if (await confirm({ title: `Delete coupon ${r.code}?`, message: 'Past enrollments keep their discount; the code stops working.' })) remove.mutate(r.id);
                },
              },
            ]),
          ]}
        />
      </Panel>

      <Modal
        open={!!editing}
        size="lg"
        title={editing === 'new' ? 'Create coupon' : 'Edit coupon'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn loading={save.isPending} onClick={submit}>
              Save coupon
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" required error={errors.code}>
            <Input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="WELCOME10" className="font-mono uppercase" />
          </Field>
          <Field label="Discount" required error={errors.value}>
            <div className="flex gap-2">
              <Select value={f.discountType} onChange={(e) => set('discountType', e.target.value as CouponInput['discountType'])} className="w-28">
                <option value="PERCENT">%</option>
                <option value="FLAT">₹ flat</option>
              </Select>
              <Input type="number" min={0} value={f.value} onChange={(e) => set('value', Number(e.target.value))} />
            </div>
          </Field>
          <Field label="Valid from" error={errors.validFrom}>
            <Input type="date" value={f.validFrom ?? ''} onChange={(e) => set('validFrom', e.target.value)} />
          </Field>
          <Field label="Valid until" error={errors.validTo}>
            <Input type="date" value={f.validTo ?? ''} onChange={(e) => set('validTo', e.target.value)} />
          </Field>
          <Field label="Maximum uses" hint="Empty = unlimited" error={errors.maxUses}>
            <Input type="number" min={1} value={f.maxUses ?? ''} onChange={(e) => set('maxUses', numOrNull(e.target.value))} />
          </Field>
          <Field label="Minimum order (₹)" hint="Empty = no minimum" error={errors.minAmount}>
            <Input type="number" min={0} value={f.minAmount ?? ''} onChange={(e) => set('minAmount', numOrNull(e.target.value))} />
          </Field>
          <Field label="Only for course">
            <Select value={f.courseId ?? ''} onChange={(e) => set('courseId', e.target.value)}>
              <option value="">All courses & bundles</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Linked partner" hint="Sales with this code earn the partner commission">
            <Select value={f.partnerId ?? ''} onChange={(e) => set('partnerId', e.target.value)}>
              <option value="">None</option>
              {partners?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea className="min-h-[60px]" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Internal note, e.g. Diwali campaign" />
          </Field>
          <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active" />
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default Coupons;
