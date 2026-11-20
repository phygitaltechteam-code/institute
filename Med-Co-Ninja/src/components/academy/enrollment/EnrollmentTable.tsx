import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { academyApi, Enrollment, EnrollmentQuery } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourseOptions, useEnrollments } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, fmtDate, Input, inr, Page, Pagination, Panel, PAYMENT_MODES, paymentLabel, SearchBox, Select, Stat, Toolbar, useConfirm, useDebounced, actionsCol } from '../ui';
import InvoiceModal from './InvoiceModal';

/**
 * Shared list for "Enroll History" (every enrollment) and "Sales & Invoices" (paid ones, with totals).
 */
const EnrollmentTable = ({ mode }: { mode: 'history' | 'sales' }) => {
  const sales = mode === 'sales';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const term = useDebounced(search);
  const q: EnrollmentQuery = {
    page,
    limit,
    search: term || undefined,
    courseId: courseId || undefined,
    status: status || undefined,
    paymentMode: paymentMode || undefined,
    from: from || undefined,
    to: to || undefined,
    paidOnly: sales || undefined,
  };
  const { data, isLoading, error, isFetching } = useEnrollments(q);
  const { data: courses } = useCourseOptions();
  const { confirm, dialog } = useConfirm();
  const setStatusM = useAcademyMutation(({ id, s }: { id: string; s: 'ACTIVE' | 'REVOKED' }) => academyApi.setEnrollmentStatus(id, s), {
    invalidate: [AK.enrollments, AK.report, AK.partners],
    success: 'Enrollment updated',
  });
  const remove = useAcademyMutation(academyApi.deleteEnrollment, { invalidate: [AK.enrollments, AK.report, AK.partners, AK.coupons], success: 'Enrollment deleted' });

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  const exportExcel = async () => {
    const all = await academyApi.enrollments({ ...q, page: 1, limit: 200 });
    const sheet = XLSX.utils.json_to_sheet(
      all.items.map((r) => ({
        Date: fmtDate(r.createdAt),
        Invoice: r.invoiceNo,
        Student: r.student.user.fullname,
        Phone: r.student.user.phoneNumber,
        Email: r.student.user.email,
        Item: r.course?.name ?? r.bundle?.name ?? '',
        Type: r.course ? 'Course' : 'Bundle',
        Price: r.listPrice,
        Discount: r.discount,
        Coupon: r.coupon?.code ?? '',
        Paid: r.amountPaid,
        GST: r.taxAmount,
        'Payment mode': paymentLabel(r.paymentMode),
        Reference: r.paymentRef ?? '',
        Partner: r.partner?.name ?? '',
        Status: r.status,
        'Access till': r.expiresAt ? fmtDate(r.expiresAt) : 'Lifetime',
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, sales ? 'Sales' : 'Enrollments');
    XLSX.writeFile(book, `${sales ? 'sales' : 'enrollments'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    { header: 'Date', cell: (r: Enrollment) => <span className="whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
    {
      header: 'Student',
      cell: (r: Enrollment) => (
        <div>
          <p className="font-medium text-text-charcoal">{r.student.user.fullname}</p>
          <p className="text-[11px] text-slate-500">{r.student.user.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Course / Bundle',
      cell: (r: Enrollment) => (
        <div className="max-w-[220px]">
          <p className="truncate">{r.course?.name ?? r.bundle?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-500">
            {r.bundle ? 'Bundle' : 'Course'} · {r.expiresAt ? `till ${fmtDate(r.expiresAt)}` : 'Lifetime'}
          </p>
        </div>
      ),
    },
    {
      header: 'Paid',
      align: 'right' as const,
      cell: (r: Enrollment) => (
        <div>
          <p className="font-semibold tabular-nums text-accent-teal">{inr(r.amountPaid)}</p>
          {r.discount > 0 && <p className="text-[11px] text-slate-500">−{inr(r.discount)}{r.coupon ? ` (${r.coupon.code})` : ''}</p>}
        </div>
      ),
    },
    ...(sales ? [{ header: 'GST', align: 'right' as const, cell: (r: Enrollment) => <span className="tabular-nums">{inr(r.taxAmount)}</span> }] : []),
    {
      header: 'Payment',
      cell: (r: Enrollment) => (
        <div>
          <p>{paymentLabel(r.paymentMode)}</p>
          {r.paymentRef && <p className="text-[11px] text-slate-500">{r.paymentRef}</p>}
        </div>
      ),
    },
    { header: 'Invoice', cell: (r: Enrollment) => <span className="whitespace-nowrap font-mono text-xs">{r.invoiceNo}</span> },
    { header: 'Status', cell: (r: Enrollment) => <Badge tone={r.status === 'ACTIVE' ? 'green' : 'red'}>{r.status === 'ACTIVE' ? 'Active' : 'Revoked'}</Badge> },
    actionsCol<Enrollment>((r) => [
      { kind: 'view', title: 'View invoice', onClick: () => setInvoiceId(r.id) },
      r.status === 'ACTIVE'
        ? {
            kind: 'revoke',
            title: 'Revoke access',
            onClick: async () => {
              if (await confirm({ title: 'Revoke access?', message: `${r.student.user.fullname} will lose access. You can restore it later.`, confirmText: 'Revoke' }))
                setStatusM.mutate({ id: r.id, s: 'REVOKED' });
            },
          }
        : { kind: 'restore', title: 'Restore access', onClick: () => setStatusM.mutate({ id: r.id, s: 'ACTIVE' }) },
      {
        kind: 'delete',
        onClick: async () => {
          if (await confirm({ title: 'Delete this enrollment?', message: 'The invoice record is removed permanently. Prefer “Revoke” to keep history.' }))
            remove.mutate(r.id);
        },
      },
    ]),
  ];

  return (
    <Page
      title={sales ? 'Sales & Invoices' : 'Enroll History'}
      subtitle={sales ? 'Every paid enrollment with GST and invoice' : 'All course and bundle enrollments'}
      action={
        <Btn icon={<Download className="h-4 w-4" />} variant="outline" disabled={!data?.items.length} onClick={exportExcel}>
          Export Excel
        </Btn>
      }
    >
      {sales && data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Revenue" value={inr(data.totals.amountPaid)} hint="matching filters" tone="teal" />
          <Stat label="GST collected" value={inr(data.totals.taxAmount)} />
          <Stat label="Discounts given" value={inr(data.totals.discount)} tone="amber" />
          <Stat label="Invoices" value={data.totalItems} />
        </div>
      )}
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={resetPage(setSearch)} placeholder="Student, phone or invoice no." />
          <Select value={courseId} onChange={(e) => resetPage(setCourseId)(e.target.value)} className="sm:w-48" aria-label="Course">
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {sales ? (
            <Select value={paymentMode} onChange={(e) => resetPage(setPaymentMode)(e.target.value)} className="sm:w-40" aria-label="Payment mode">
              <option value="">All modes</option>
              {PAYMENT_MODES.filter((m) => m.value !== 'FREE').map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          ) : (
            <Select value={status} onChange={(e) => resetPage(setStatus)(e.target.value)} className="sm:w-36" aria-label="Status">
              <option value="">Any status</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
            </Select>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} className="w-36" aria-label="From date" />
            to
            <Input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} className="w-36" aria-label="To date" />
          </div>
          <Select value={limit} onChange={(e) => resetPage(setLimit)(Number(e.target.value))} className="ml-auto w-28" aria-label="Rows per page">
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </Select>
        </Toolbar>
        <DataTable
          minWidth={980}
          rows={data?.items}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          empty={<Empty title={sales ? 'No sales found' : 'No enrollments found'} text="Enroll students from Enrollment → Course Enrollment." />}
          columns={columns}
        />
        {data && <Pagination page={page} totalPages={data.totalPages} totalItems={data.totalItems} onChange={setPage} />}
      </Panel>
      <InvoiceModal enrollmentId={invoiceId} onClose={() => setInvoiceId(null)} />
      {dialog}
    </Page>
  );
};

export default EnrollmentTable;
