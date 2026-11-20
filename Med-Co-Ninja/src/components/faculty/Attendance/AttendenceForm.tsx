import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCheck, Search, XCircle } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useSubmitAttendance } from '@/lib/api/admin/attendence';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { showPopup } from '@/components/Common/AlertPopup';
import { api } from '@/utils/axios';

type SheetStudent = { id: string; fullname: string; phoneNumber?: string; present: boolean };

const rolePath = (role?: string) => (role === 'ADMIN' || role === 'SUPERADMIN' ? '/admin' : '/teacher');

/** Loads the batch roster + any attendance already saved for that day (same endpoint the records view uses). */
export const fetchAttendanceSheet = async (role: string | undefined, batchId: string, from: string, to: string) => {
  const res = await api.put(`${rolePath(role)}/attendance/${batchId}`, { from, to });
  return (res?.data?.data || res?.data) as {
    dates: { id: string; date: string; totalStudent: number; presentStudent: number; absentStudent: number }[];
    students: { id: string; fullname: string; username: string; phoneNumber?: string; attendance: { attendanceId: string; date: string; status: 'present' | 'absent' }[] }[];
  };
};

const inputCls =
  'w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary-navy dark:border-strokedark dark:bg-boxdark dark:text-white';

const BatchAttendance = ({ batchId: propBatchId = '' }: { batchId?: string }) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const queryClient = useQueryClient();

  const [batchId, setBatchId] = useState(propBatchId);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<SheetStudent[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => setBatchId(propBatchId), [propBatchId]);

  const { data: batchesData } = useGetBatches(role);
  const batches: any[] = batchesData?.data || [];

  const { data: sheet, isFetching, isError } = useQuery({
    queryKey: ['attendance', 'sheet', batchId, date, role],
    queryFn: () => fetchAttendanceSheet(role, batchId, date, date),
    enabled: Boolean(role && batchId && date),
  });

  const alreadyTaken = (sheet?.dates?.length || 0) > 0;

  // Prefill: saved marks when the day was already taken, otherwise everyone present
  useEffect(() => {
    if (!sheet) return setRows([]);
    setRows(
      (sheet.students || []).map((s) => ({
        id: s.id,
        fullname: s.fullname || 'Unknown',
        phoneNumber: s.phoneNumber,
        present: alreadyTaken ? s.attendance?.some((a) => a.status === 'present') : true,
      })),
    );
  }, [sheet, alreadyTaken]);

  const { mutate: submitAttendance, isPending } = useSubmitAttendance(role!);

  const presentCount = rows.filter((r) => r.present).length;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.fullname.toLowerCase().includes(q) || r.phoneNumber?.includes(q)) : rows;
  }, [rows, search]);

  const setAll = (present: boolean) => setRows((prev) => prev.map((r) => ({ ...r, present })));
  const toggle = (id: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, present: !r.present } : r)));

  const handleSave = () => {
    if (!batchId) return showPopup('Please select a batch first');
    if (!date) return showPopup('Please select a date');
    if (date > format(new Date(), 'yyyy-MM-dd')) return showPopup('Attendance cannot be marked for a future date');
    if (!rows.length) return showPopup('No students in this batch');

    const studentIds = rows.filter((r) => r.present).map((r) => r.id);
    submitAttendance(
      {
        batchId,
        date,
        totalStudents: rows.length,
        presentStudents: studentIds.length,
        absentStudents: rows.length - studentIds.length,
        studentIds,
      },
      {
        onSuccess: () => {
          toast.success(`Attendance ${alreadyTaken ? 'updated' : 'saved'}: ${studentIds.length} present, ${rows.length - studentIds.length} absent`);
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
        onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to save attendance'),
      },
    );
  };

  return (
    <div className="space-y-3">
      {/* Batch + date + summary in one compact bar */}
      <div className="flex flex-wrap items-end gap-3">
        {!propBatchId && (
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Batch *</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls}>
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.course?.name ? `(${b.course.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="w-44">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Date *</label>
          <input
            type="date"
            value={date}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-slate-700">Total {rows.length}</span>
            <span className="rounded-md bg-green-100 px-2.5 py-1.5 text-green-700">Present {presentCount}</span>
            <span className="rounded-md bg-red-100 px-2.5 py-1.5 text-red-700">Absent {rows.length - presentCount}</span>
            {alreadyTaken && (
              <span className="rounded-md bg-amber-100 px-2.5 py-1.5 text-amber-700">Already taken, editing</span>
            )}
          </div>
        )}
      </div>

      {!batchId ? (
        <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">Select a batch to mark attendance.</p>
      ) : isFetching && !rows.length ? (
        <p className="p-6 text-center text-sm text-slate-500">Loading students…</p>
      ) : isError ? (
        <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">Could not load the batch students.</p>
      ) : !rows.length ? (
        <p className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-700">No students found in this batch.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student"
                className={`${inputCls} pl-8`}
              />
            </div>
            <div className="flex gap-2">
              <GenericButton type="button" variant="navy" onClick={() => setAll(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs">
                <CheckCheck className="h-4 w-4" /> All Present
              </GenericButton>
              <GenericButton type="button" variant="cancel" onClick={() => setAll(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs">
                <XCircle className="h-4 w-4" /> All Absent
              </GenericButton>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stroke dark:border-strokedark">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-navy text-left text-xs text-white sm:text-sm">
                  <th className="w-14 px-3 py-2">Sr No.</th>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="w-40 px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={`cursor-pointer border-b border-stroke last:border-0 hover:bg-primary-navy/5 dark:border-strokedark ${i % 2 ? 'bg-slate-50' : 'bg-white'} dark:bg-transparent`}
                  >
                    <td className="px-3 py-1.5 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-text-charcoal dark:text-white">{r.fullname}</td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{r.phoneNumber || '-'}</td>
                    <td className="px-3 py-1.5">
                      <div className="mx-auto flex w-fit overflow-hidden rounded-md border border-stroke text-xs font-semibold">
                        <span className={`px-3 py-1 ${r.present ? 'bg-green-600 text-white' : 'bg-white text-slate-500'}`}>P</span>
                        <span className={`px-3 py-1 ${!r.present ? 'bg-red-600 text-white' : 'bg-white text-slate-500'}`}>A</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">No student matches “{search}”.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <GenericButton type="button" variant="navy" onClick={handleSave} disabled={isPending} className="px-6 py-2">
              {isPending ? 'Saving…' : `${alreadyTaken ? 'Update' : 'Save'} Attendance (${presentCount}/${rows.length})`}
            </GenericButton>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchAttendance;
