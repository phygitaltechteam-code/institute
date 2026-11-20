import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, UserRound, Users } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { getStudentProfile, searchStudents, toReceiptStudent, StudentHit } from '@/lib/api/studentLookupApi';
import StudentProfileDrawer, { inr, useOpenBatchFees } from '@/components/Common/StudentProfileDrawer';
import { FeesReciept } from './FeesPopUp/FeesRciept';
import { showPopup } from '@/components/Common/AlertPopup';

const iconBtn =
  'flex h-8 items-center gap-1 rounded-md border border-stroke px-2 text-xs font-medium text-slate-700 transition hover:border-primary-navy hover:bg-primary-navy hover:text-white disabled:opacity-50';

/** Find any student (name / phone / email / college) → print receipt, open their batch, or view the full profile. */
const FeeReceiptSearch = () => {
  const role = useAuthContext().user?.role;
  const qc = useQueryClient();
  const openBatchFees = useOpenBatchFees();

  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: rows = [], isFetching, isError } = useQuery({
    queryKey: ['student-search', term, role, 'receipts'],
    queryFn: () => searchStudents(role, term, 50),
    enabled: Boolean(role),
  });

  const openReceipt = async (s: StudentHit) => {
    try {
      setLoadingId(s.id);
      const profile = await qc.fetchQuery({
        queryKey: ['student-profile', s.id, role],
        queryFn: () => getStudentProfile(role, s.id),
      });
      setReceipt(toReceiptStudent(profile));
    } catch (e: any) {
      showPopup('Could not load the receipt', { message: e?.response?.data?.message || e?.message });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-primary-navy sm:text-xl">Fee Receipts</h1>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student by name, phone, email or college"
            className="w-full rounded-lg border border-stroke bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-navy"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-stroke bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary-navy text-left text-white">
              <th className="w-14 px-3 py-2">Sr No.</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Pending</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isFetching && !rows.length ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">Searching…</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-red-600">Could not load students.</td>
              </tr>
            ) : !rows.length ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  {term ? `No student found for “${term}”.` : 'No students yet.'}
                </td>
              </tr>
            ) : (
              rows.map((s, i) => (
                <tr key={s.id} className={`border-b border-stroke last:border-0 ${i % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setProfileId(s.id)} className="text-left font-semibold text-text-charcoal hover:text-primary-navy hover:underline">
                      {s.name}
                    </button>
                    <p className="text-[11px] text-slate-500">{s.phone}</p>
                  </td>
                  <td className="px-3 py-2">{s.batches.map((b) => b.name).join(', ') || <span className="text-slate-400">No batch</span>}</td>
                  <td className="px-3 py-2 text-right">{inr(s.totalFees)}</td>
                  <td className="px-3 py-2 text-right">{inr(s.paidFees)}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${s.pendingFees > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    {s.pendingFees > 0 ? inr(s.pendingFees) : 'Paid'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className={iconBtn} onClick={() => openReceipt(s)} disabled={loadingId === s.id} title="View / print receipt">
                        <FileText className="h-4 w-4" /> {loadingId === s.id ? '…' : 'Receipt'}
                      </button>
                      {s.batches[0] && (
                        <button className={iconBtn} onClick={() => openBatchFees(s.batches[0].id)} title={`Open ${s.batches[0].name}`}>
                          <Users className="h-4 w-4" /> Batch
                        </button>
                      )}
                      <button className={iconBtn} onClick={() => setProfileId(s.id)} title="Full student details">
                        <UserRound className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!term && rows.length > 0 && <p className="text-xs text-slate-500">Showing the latest {rows.length} students. Type to search all.</p>}

      <FeesReciept isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} selectedStudent={receipt} />
      <StudentProfileDrawer studentId={profileId} onClose={() => setProfileId(null)} />
    </div>
  );
};

export default FeeReceiptSearch;
