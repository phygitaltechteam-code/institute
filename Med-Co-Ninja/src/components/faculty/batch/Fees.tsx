import { useMemo, useState } from 'react';
import { TbReceiptRupee } from 'react-icons/tb';
import { FileText, Link2 } from 'lucide-react';
import StudentProfileDrawer from '@/components/Common/StudentProfileDrawer';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatchwiseStudentInterview } from '@/mutations/courseMutation';
import { formatDate } from '@/utils/dateTimeUtils';
import { FollowUpPopUp } from './FeesPopUp/FollowUpPopUp';
import { FeesCollection } from './FeesPopUp/FeesCollection';
import { FeesReciept } from './FeesPopUp/FeesRciept';

export type feesTableType = {
  id: string;
  name: string;
  phone: string;
  totalFees: string;
  paidFees: string;
  pendingFees: string;
  paidDate: string;
  folloUpDate: string;
};

export const inr = (n: number | string | undefined | null) => `₹${(Math.round(Number(n) || 0)).toLocaleString('en-IN')}`;

const iconBtn =
  'action-button flex h-8 w-8 items-center justify-center rounded-md border border-stroke text-slate-600 transition hover:border-primary-navy hover:bg-primary-navy hover:text-white';

const Fees = ({ batchId }: { batchId: string }) => {
  const role = useAuthContext().user?.role;
  const { data: studentData, refetch } = useGetBatchwiseStudentInterview(batchId, role);

  const [popup, setPopup] = useState<'followUp' | 'collect' | 'receipt' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<feesTableType | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const open = (kind: 'followUp' | 'collect' | 'receipt', s: any) => {
    setSelectedStudent(s);
    setPopup(kind);
  };

  const rows: any[] = Array.isArray(studentData) ? studentData : [];
  const totals = useMemo(
    () =>
      rows.reduce(
        (t, r) => ({
          total: t.total + (Number(r.totalFees) || 0),
          paid: t.paid + (Number(r.paidFees) || 0),
          pending: t.pending + Math.max(Number(r.pendingFees) || 0, 0),
          dueCount: t.dueCount + ((Number(r.pendingFees) || 0) > 0 ? 1 : 0),
        }),
        { total: 0, paid: 0, pending: 0, dueCount: 0 },
      ),
    [rows],
  );

  const columns: Column<any>[] = [
    { header: 'Name', accessor: 'name', render: (r) => <span className="font-medium text-text-charcoal">{r.name}</span> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Total Fees', accessor: 'totalFees', render: (r) => inr(r.totalFees) },
    {
      header: 'Paid',
      accessor: 'paidFees',
      render: (r) => (
        <div className="leading-tight">
          <p className="font-semibold">{inr(r.paidFees)}</p>
          {r.payments?.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Last: {formatDate(r.payments[r.payments.length - 1].createdAt)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Pending',
      accessor: 'pendingFees',
      render: (r) =>
        Number(r.pendingFees) > 0 ? (
          <span className="font-semibold text-red-600">{inr(r.pendingFees)}</span>
        ) : (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Paid</span>
        ),
    },
    {
      header: 'Next Follow-up',
      accessor: (r: any) => r.followUp?.notes || '',
      render: (r) =>
        Number(r.pendingFees) > 0 && r.followUp ? (
          <div className="max-w-[220px] text-left leading-tight lg:mx-auto">
            <p className="text-xs font-semibold">
              {r.followUp.followUpDate ? formatDate(r.followUp.followUpDate) : '-'}
              {Number(r.followUp.amount) > 0 && <span className="font-normal text-slate-500"> · {inr(r.followUp.amount)}</span>}
            </p>
            {r.followUp.notes && <p className="truncate text-[11px] text-slate-500" title={r.followUp.notes}>{r.followUp.notes}</p>}
          </div>
        ) : (
          '-'
        ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          {Number(r.pendingFees) > 0 && (
            <button type="button" className={iconBtn} title="Collect fees" onClick={() => open('collect', r)}>
              <TbReceiptRupee size={18} />
            </button>
          )}
          <button type="button" className={iconBtn} title="View / print receipt" onClick={() => open('receipt', r)}>
            <FileText size={16} />
          </button>
          <button type="button" className={iconBtn} title="Student details / online payment link" onClick={() => setProfileId(r.id)}>
            <Link2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Total Fees', inr(totals.total)],
          ['Collected', inr(totals.paid)],
          ['Pending', inr(totals.pending)],
          ['Students with dues', `${totals.dueCount} / ${rows.length}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stroke bg-white px-3 py-2 shadow-sm dark:border-strokedark dark:bg-boxdark">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-base font-bold text-primary-navy dark:text-white sm:text-lg">{value}</p>
          </div>
        ))}
      </div>

      <GenericTable data={rows} columns={columns} searchAble title="Fees" showSrNo itemsPerPage={10} />

      <FollowUpPopUp isOpen={popup === 'followUp'} onClose={() => setPopup(null)} selectedStudent={selectedStudent} refetch={refetch} />
      <FeesCollection isOpen={popup === 'collect'} onClose={() => setPopup(null)} selectedStudent={selectedStudent} refetch={refetch} />
      <FeesReciept isOpen={popup === 'receipt'} onClose={() => setPopup(null)} selectedStudent={selectedStudent} />
      <StudentProfileDrawer
        studentId={profileId}
        onClose={() => {
          setProfileId(null);
          refetch();
        }}
      />
    </div>
  );
};

export default Fees;
