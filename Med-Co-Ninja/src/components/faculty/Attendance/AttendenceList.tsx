import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ClipboardCheck, Table2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import BatchAttendance, { fetchAttendanceSheet } from './AttendenceForm';

const inputCls =
  'w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary-navy dark:border-strokedark dark:bg-boxdark dark:text-white';

const pctColor = (p: number) => (p >= 75 ? 'text-green-700' : p >= 50 ? 'text-amber-600' : 'text-red-600');

const AttendanceList = ({ batchId = '' }: { batchId?: string }) => {
  const { user } = useAuthContext();
  const role = user?.role;

  const [tab, setTab] = useState<'mark' | 'records'>('mark');
  const [selectedBatchId, setSelectedBatchId] = useState(batchId);
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');

  useEffect(() => setSelectedBatchId(batchId), [batchId]);

  const { data: batchesData } = useGetBatches(role);
  const batches: any[] = batchesData?.data || [];

  const rangeValid = Boolean(from && to && from <= to);
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['attendance', 'records', selectedBatchId, from, to, role],
    queryFn: () => fetchAttendanceSheet(role, selectedBatchId, from, to),
    enabled: tab === 'records' && Boolean(role && selectedBatchId && rangeValid),
  });

  const dates = data?.dates || [];
  const students = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.students || [])
      .map((s) => {
        const byId = new Map(s.attendance.map((a) => [a.attendanceId, a.status]));
        const present = s.attendance.filter((a) => a.status === 'present').length;
        return { ...s, byId, present, pct: dates.length ? Math.round((present / dates.length) * 100) : 0 };
      })
      .filter((s) => !q || s.fullname?.toLowerCase().includes(q));
  }, [data, dates.length, search]);

  const totalMarks = (data?.students?.length || 0) * dates.length;
  const totalPresent = (data?.students || []).reduce(
    (n, s) => n + s.attendance.filter((a) => a.status === 'present').length,
    0,
  );
  const overallPct = totalMarks ? Math.round((totalPresent / totalMarks) * 100) : 0;
  const lowCount = students.filter((s) => dates.length && s.pct < 75).length;

  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      active ? 'bg-primary-navy text-white shadow' : 'text-slate-600 hover:bg-primary-navy/10'
    }`;

  return (
    <div className="space-y-3 rounded-lg border border-stroke bg-white p-3 shadow-sm dark:border-strokedark dark:bg-boxdark sm:p-4">
      <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1 dark:bg-meta-4">
        <button type="button" className={tabCls(tab === 'mark')} onClick={() => setTab('mark')}>
          <ClipboardCheck className="h-4 w-4" /> Mark Attendance
        </button>
        <button type="button" className={tabCls(tab === 'records')} onClick={() => setTab('records')}>
          <Table2 className="h-4 w-4" /> Records
        </button>
      </div>

      {tab === 'mark' ? (
        <BatchAttendance batchId={batchId} />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            {!batchId && (
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Batch *</label>
                <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className={inputCls}>
                  <option value="">Select a batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.course?.name ? `(${b.course.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </div>
            <div className="w-full sm:w-56">
              <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student name" className={inputCls} />
            </div>
          </div>

          {!selectedBatchId ? (
            <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">Select a batch to see its attendance.</p>
          ) : !rangeValid ? (
            <p className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-700">“From” date must be on or before “To” date.</p>
          ) : isFetching && !data ? (
            <p className="p-6 text-center text-sm text-slate-500">Loading attendance…</p>
          ) : isError ? (
            <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              {(error as any)?.response?.data?.message || 'Failed to load attendance'}
            </p>
          ) : !dates.length ? (
            <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">No attendance was taken in this date range.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Students', data?.students.length ?? 0, 'text-primary-navy'],
                  ['Classes Taken', dates.length, 'text-primary-navy'],
                  ['Overall Attendance', `${overallPct}%`, pctColor(overallPct)],
                  ['Below 75%', lowCount, lowCount ? 'text-red-600' : 'text-green-700'],
                ].map(([label, value, cls]) => (
                  <div key={label as string} className="rounded-lg border border-stroke bg-slate-50 px-3 py-2 dark:border-strokedark dark:bg-meta-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-lg font-bold ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-stroke dark:border-strokedark">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-primary-navy text-white">
                      <th className="sticky left-0 z-10 min-w-[180px] bg-primary-navy px-3 py-2 text-left">Student</th>
                      {dates.map((d) => (
                        <th key={d.id} className="min-w-[44px] px-1 py-2 text-center font-medium leading-tight">
                          <div>{format(new Date(d.date), 'dd')}</div>
                          <div className="text-[10px] font-normal opacity-80">{format(new Date(d.date), 'MMM')}</div>
                        </th>
                      ))}
                      <th className="sticky right-0 z-10 bg-primary-navy px-3 py-2 text-center">Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} className={`border-b border-stroke last:border-0 dark:border-strokedark ${i % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                        <td className={`sticky left-0 z-10 px-3 py-1.5 font-medium text-text-charcoal ${i % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                          <span className="mr-2 text-slate-400">{i + 1}.</span>
                          {s.fullname}
                        </td>
                        {dates.map((d) => {
                          const present = s.byId.get(d.id) === 'present';
                          return (
                            <td key={d.id} className="px-1 py-1.5 text-center">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${
                                  present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {present ? 'P' : 'A'}
                              </span>
                            </td>
                          );
                        })}
                        <td className={`sticky right-0 z-10 whitespace-nowrap px-3 py-1.5 text-center ${i % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                          <span className="font-semibold">
                            {s.present}/{dates.length}
                          </span>{' '}
                          <span className={`text-xs font-bold ${pctColor(s.pct)}`}>({s.pct}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceList;
