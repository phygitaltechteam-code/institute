import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/Common/PageHeader';
import { useFeeCollectionReport } from '@/lib/react-query/queriesAndMutations/dashboardAdmin';
import { FeeCollectionRow } from '@/lib/api/admin/dashboardApi';
import { formatDateTimeAuto } from '@/utils/dateTimeUtils';

const inr = (n?: number | null) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Fee collection report: every payment, newest first, searchable by student name and exportable. */
const FeeCollectionReport = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useFeeCollectionReport(page, limit, term);

  const rows: FeeCollectionRow[] = data?.data ?? data?.collections ?? [];
  const totalItems: number = data?.totalItems ?? rows.length;
  const totalPages: number = Math.max(1, data?.totalPages ?? Math.ceil(totalItems / limit));
  const pageTotal = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((r, i) => ({
        'Sr No.': (page - 1) * limit + i + 1,
        Date: formatDateTimeAuto(r.createdAt),
        Student: r.student?.user?.fullname ?? '',
        Phone: r.student?.user?.phoneNumber ?? '',
        Amount: r.amount,
        'Pending After': r.pendingAmount ?? '',
        Account: r.account?.name ?? '',
        'Collected By': r.teacher?.user?.fullname ?? '',
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Fee Collections');
    XLSX.writeFile(book, `fee-collections-page-${page}.xlsx`);
  };

  return (
    <div className="p-3 md:p-6">
      <PageHeader
        title="Fee Collection Report"
        subtitle="All fee payments received, newest first"
        action={
          <button
            onClick={exportExcel}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-navy/90 disabled:opacity-50 sm:text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        }
      />

      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke p-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name"
              className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm outline-none focus:border-accent-teal"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 sm:text-sm">
            <span>
              This page: <b className="text-accent-teal">{inr(pageTotal)}</b>
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-stroke px-2 py-1.5 outline-none focus:border-accent-teal"
              aria-label="Rows per page"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
            <thead className="bg-primary-navy text-white">
              <tr>
                <th className="px-3 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Student</th>
                <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-3 py-2.5 text-right font-semibold">Pending After</th>
                <th className="px-3 py-2.5 font-semibold">Account</th>
                <th className="px-3 py-2.5 font-semibold">Collected By</th>
              </tr>
            </thead>
            <tbody className={isFetching && !isLoading ? 'opacity-60' : ''}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">Loading…</td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-red-600">Could not load fee collections.</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    {term ? 'No payments match your search.' : 'No payments recorded yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-stroke odd:bg-white even:bg-slate-50 hover:bg-bg-light-mint">
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{(page - 1) * limit + i + 1}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDateTimeAuto(r.createdAt)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-text-charcoal">{r.student?.user?.fullname ?? '—'}</p>
                      {r.student?.user?.phoneNumber && (
                        <p className="text-[11px] text-slate-500">{r.student.user.phoneNumber}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-accent-teal">
                      {inr(r.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {r.pendingAmount != null ? inr(r.pendingAmount) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{r.account?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.teacher?.user?.fullname ?? 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-stroke p-3 text-xs text-slate-600 sm:text-sm">
          <span>
            Page {page} of {totalPages} · {totalItems} payments
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeCollectionReport;
