import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { academyApi, apiError, Payout, PayoutStatus } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, usePartners, usePayouts } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, fmtDate, Input, inr, Modal, Page, Panel, Select, Textarea, Toolbar, useConfirm, actionsCol } from '../ui';

const tone = (s: PayoutStatus) => (s === 'PAID' ? 'green' : s === 'PENDING' ? 'amber' : 'gray') as 'green' | 'amber' | 'gray';

const Payouts = () => {
  const [partnerId, setPartnerId] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = usePayouts({ partnerId: partnerId || undefined, status: status || undefined });
  const { data: partners } = usePartners();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ partnerId: '', amount: '', status: 'PAID' as PayoutStatus, reference: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [markPaid, setMarkPaid] = useState<{ id: string; reference: string } | null>(null);
  const { confirm, dialog } = useConfirm();

  const inv = { invalidate: [AK.payouts, AK.partners] };
  const create = useAcademyMutation(academyApi.createPayout, { ...inv, success: 'Payout recorded' });
  const update = useAcademyMutation(({ id, ...d }: { id: string; status?: PayoutStatus; reference?: string | null }) => academyApi.updatePayout(id, d), {
    ...inv,
    success: 'Payout updated',
  });
  const remove = useAcademyMutation(academyApi.deletePayout, { ...inv, success: 'Payout deleted' });

  const selected = partners?.find((p) => p.id === f.partnerId);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.partnerId) e.partnerId = 'Select a partner';
    if (!(Number(f.amount) > 0)) e.amount = 'Enter an amount';
    setErrors(e);
    if (Object.keys(e).length) return;
    create.mutate(
      { partnerId: f.partnerId, amount: Number(f.amount), status: f.status, reference: f.reference || null, note: f.note || null },
      { onSuccess: () => setOpen(false), onError: (err) => setErrors(apiError(err).fields) },
    );
  };

  return (
    <Page
      title="Payouts"
      subtitle="Commission payments made to partners"
      action={
        <Btn
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setErrors({});
            setF({ partnerId: partnerId || '', amount: '', status: 'PAID', reference: '', note: '' });
            setOpen(true);
          }}
        >
          Record Payout
        </Btn>
      }
    >
      {partners && partners.some((p) => p.balance > 0) && (
        <Panel>
          <div className="flex flex-wrap gap-2 p-3 text-xs">
            <span className="self-center font-semibold text-slate-600">Due to partners:</span>
            {partners
              .filter((p) => p.balance > 0)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setF({ partnerId: p.id, amount: String(p.balance), status: 'PAID', reference: '', note: '' });
                    setOpen(true);
                  }}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-medium text-amber-800 hover:bg-amber-100"
                >
                  {p.name}: {inr(p.balance)} → Pay
                </button>
              ))}
          </div>
        </Panel>
      )}
      <Panel>
        <Toolbar>
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="sm:w-56" aria-label="Partner">
            <option value="">All partners</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" aria-label="Status">
            <option value="">Any status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <span className="ml-auto text-xs text-slate-500">
            Total shown: <b className="text-accent-teal">{inr((data ?? []).filter((p) => p.status !== 'CANCELLED').reduce((s, p) => s + p.amount, 0))}</b>
          </span>
        </Toolbar>
        <DataTable
          rows={data}
          loading={isLoading}
          error={error}
          rowKey={(r) => r.id}
          empty={<Empty icon={<Wallet className="h-5 w-5" />} title="No payouts yet" text="Partner commission builds up from enrollments; record each payment here." />}
          columns={[
            { header: 'Date', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.paidAt ?? r.createdAt)}</span> },
            {
              header: 'Partner',
              cell: (r) => (
                <div>
                  <p className="font-medium text-text-charcoal">{r.partner.name}</p>
                  <p className="text-[11px] text-slate-500">{r.partner.upiId ?? r.partner.code}</p>
                </div>
              ),
            },
            { header: 'Amount', align: 'right', cell: (r) => <span className="font-semibold tabular-nums text-accent-teal">{inr(r.amount)}</span> },
            { header: 'Reference', cell: (r) => r.reference ?? '—' },
            { header: 'Note', cell: (r) => <span className="text-xs text-slate-600">{r.note ?? '—'}</span> },
            { header: 'Status', cell: (r) => <Badge tone={tone(r.status)}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge> },
            actionsCol<Payout>((r) => [
              r.status === 'PENDING' && { kind: 'approve', title: 'Mark as paid', onClick: () => setMarkPaid({ id: r.id, reference: r.reference ?? '' }) },
              r.status === 'PENDING' && {
                kind: 'delete',
                onClick: async () => {
                  if (await confirm({ title: 'Delete this pending payout?' })) remove.mutate(r.id);
                },
              },
              r.status === 'PAID' && {
                kind: 'revoke',
                title: 'Cancel payout',
                onClick: async () => {
                  if (await confirm({ title: 'Cancel this payout?', message: 'Use this if the payment bounced or was reversed.', confirmText: 'Cancel payout' }))
                    update.mutate({ id: r.id, status: 'CANCELLED' });
                },
              },
            ]),
          ]}
        />
      </Panel>

      <Modal
        open={open}
        title="Record payout"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn loading={create.isPending} onClick={submit}>
              Save
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Partner" required error={errors.partnerId} className="sm:col-span-2" hint={selected ? `Balance due: ${inr(selected.balance)}${selected.upiId ? ` · UPI ${selected.upiId}` : ''}` : undefined}>
            <Select value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })}>
              <option value="">— Select partner —</option>
              {partners?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (due {inr(p.balance)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (₹)" required error={errors.amount}>
            <Input type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PayoutStatus })}>
              <option value="PAID">Paid now</option>
              <option value="PENDING">Pending (to pay later)</option>
            </Select>
          </Field>
          <Field label="Reference / UTR" className="sm:col-span-2">
            <Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Textarea className="min-h-[60px]" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!markPaid}
        size="sm"
        title="Mark payout as paid"
        onClose={() => setMarkPaid(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setMarkPaid(null)}>
              Cancel
            </Btn>
            <Btn loading={update.isPending} onClick={() => markPaid && update.mutate({ id: markPaid.id, status: 'PAID', reference: markPaid.reference || null }, { onSuccess: () => setMarkPaid(null) })}>
              Mark paid
            </Btn>
          </>
        }
      >
        <Field label="Reference / UTR">
          <Input autoFocus value={markPaid?.reference ?? ''} onChange={(e) => setMarkPaid((p) => p && { ...p, reference: e.target.value })} />
        </Field>
      </Modal>
      {dialog}
    </Page>
  );
};

export default Payouts;
