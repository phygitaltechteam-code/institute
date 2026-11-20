import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {
  Ban,
  CalendarClock,
  Copy,
  ExternalLink,
  FileText,
  Link2,
  Phone,
  RefreshCw,
  Send,
  Users,
  X,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { formatDate, formatDateTimeAuto } from '@/utils/dateTimeUtils';
import { FeesReciept } from '@/components/faculty/batch/FeesPopUp/FeesRciept';
import { showPopup } from '@/components/Common/AlertPopup';
import {
  cancelPaymentLink,
  createPaymentLink,
  getGatewayStatus,
  getStudentProfile,
  listPaymentLinks,
  syncPaymentLink,
  toReceiptStudent,
  StudentProfile,
} from '@/lib/api/studentLookupApi';

export const inr = (n?: number | null) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const errMsg = (e: any) => e?.response?.data?.message || e?.message || 'Something went wrong';

/** Opens a batch dashboard directly on Student → Fees. */
export const useOpenBatchFees = () => {
  const navigate = useNavigate();
  const role = useAuthContext().user?.role;
  return (batchId: string) => {
    sessionStorage.setItem('batch-activeGroup', '1');
    sessionStorage.setItem('batch-activeSub', '0');
    navigate({
      to: role === 'ADMIN' ? '/admin/batch/batch-dashboard/$id' : '/faculty/batch/batch-dashboard/$id',
      params: { id: batchId },
    } as any);
  };
};

const statusStyle: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  created: 'bg-amber-100 text-amber-700',
  partially_paid: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500',
  expired: 'bg-slate-100 text-slate-500',
};

/** Razorpay payment-link panel: create, share, check status, cancel. */
export const PaymentLinkPanel = ({ student }: { student: StudentProfile }) => {
  const role = useAuthContext().user?.role;
  const qc = useQueryClient();
  const [amount, setAmount] = useState(String(Math.round(student.fees.pendingFees || 0)));

  const { data: gateway } = useQuery({ queryKey: ['gateway-status', role], queryFn: () => getGatewayStatus(role), staleTime: 60_000 });
  const { data: links = [] } = useQuery({
    queryKey: ['payment-links', student.id, role],
    queryFn: () => listPaymentLinks(role, student.id),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['payment-links', student.id] });
    qc.invalidateQueries({ queryKey: ['student-profile', student.id] });
    qc.invalidateQueries({ queryKey: ['batchwiseStudentInterview'] });
  };

  const create = useMutation({
    mutationFn: () => createPaymentLink(role, student.id, Number(amount)),
    onSuccess: (l) => {
      navigator.clipboard?.writeText(l.shortUrl).catch(() => undefined);
      toast.success('Payment link created and copied');
      refresh();
    },
    onError: (e) => showPopup('Could not create payment link', { message: errMsg(e) }),
  });
  const sync = useMutation({
    mutationFn: (id: string) => syncPaymentLink(role, id),
    onSuccess: (l) => {
      toast.success(l.status === 'paid' ? 'Payment received and recorded' : `Status: ${l.status}`);
      refresh();
    },
    onError: (e) => showPopup('Could not check status', { message: errMsg(e) }),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelPaymentLink(role, id),
    onSuccess: () => {
      toast.success('Payment link cancelled');
      refresh();
    },
    onError: (e) => showPopup('Could not cancel link', { message: errMsg(e) }),
  });

  const onCreate = () => {
    const n = Number(amount);
    if (!(n > 0)) return showPopup('Enter a valid amount');
    if (n > (student.fees.pendingFees || 0)) return showPopup(`Amount cannot be more than the pending fee (${inr(student.fees.pendingFees)})`);
    create.mutate();
  };

  const whatsapp = (url: string, amt: number) => {
    const phone = (student.phone || '').replace(/\D/g, '').slice(-10);
    const text = `Hello ${student.name}, please pay your course fee of ${inr(amt)} using this secure link: ${url}\n– MedCode Ninja`;
    window.open(`https://wa.me/${phone ? `91${phone}` : ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-2">
      {gateway && !gateway.configured && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Online payment is not set up yet. Add the Razorpay keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) in the backend
          .env and restart the server.
        </p>
      )}
      {student.fees.pendingFees > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-slate-600">Amount (₹)</label>
            <input
              type="number"
              min={1}
              max={student.fees.pendingFees}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-stroke px-2.5 py-1.5 text-sm outline-none focus:border-primary-navy"
            />
          </div>
          <button
            type="button"
            onClick={onCreate}
            disabled={create.isPending || gateway?.configured === false}
            className="flex items-center gap-1.5 rounded-md bg-primary-navy px-3 py-2 text-xs font-semibold text-white hover:bg-primary-navy/90 disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" /> {create.isPending ? 'Creating…' : 'Create Payment Link'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">No pending fees, so a payment link is not needed.</p>
      )}

      {links.length > 0 && (
        <ul className="divide-y divide-stroke rounded-md border border-stroke">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
              <span className="font-semibold">{inr(l.amount)}</span>
              <span className={`rounded px-1.5 py-0.5 font-semibold capitalize ${statusStyle[l.status] || 'bg-slate-100'}`}>
                {l.status.replace('_', ' ')}
              </span>
              <span className="text-slate-500">{formatDateTimeAuto(l.createdAt)}</span>
              <div className="ml-auto flex items-center gap-1">
                {l.status !== 'paid' && l.status !== 'cancelled' && l.status !== 'expired' && (
                  <>
                    <button title="Copy link" onClick={() => navigator.clipboard?.writeText(l.shortUrl).then(() => toast.success('Link copied'))} className="rounded p-1 hover:bg-slate-100">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button title="Send on WhatsApp" onClick={() => whatsapp(l.shortUrl, l.amount)} className="rounded p-1 text-green-700 hover:bg-green-50">
                      <Send className="h-4 w-4" />
                    </button>
                    <button title="Check payment status" onClick={() => sync.mutate(l.id)} disabled={sync.isPending} className="rounded p-1 hover:bg-slate-100">
                      <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
                    </button>
                    <button title="Cancel link" onClick={() => cancel.mutate(l.id)} className="rounded p-1 text-red-600 hover:bg-red-50">
                      <Ban className="h-4 w-4" />
                    </button>
                  </>
                )}
                <a href={l.shortUrl} target="_blank" rel="noreferrer" title="Open link" className="rounded p-1 hover:bg-slate-100">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Section = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <section className="rounded-lg border border-stroke bg-white p-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-primary-navy">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Info = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="truncate text-sm font-medium text-text-charcoal" title={typeof value === 'string' ? value : undefined}>
      {value || '-'}
    </p>
  </div>
);

/** Right-side drawer with everything about one student. */
const StudentProfileDrawer = ({ studentId, onClose }: { studentId: string | null; onClose: () => void }) => {
  const role = useAuthContext().user?.role;
  const openBatchFees = useOpenBatchFees();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['student-profile', studentId, role],
    queryFn: () => getStudentProfile(role, studentId!),
    enabled: Boolean(studentId && role),
  });

  if (!studentId) return null;

  const goBatch = (id: string) => {
    onClose();
    openBatchFees(id);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex justify-end bg-primary-navy/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 bg-primary-navy px-4 py-3 text-white">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold sm:text-lg">{p?.name || 'Student'}</h2>
            {p && (
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {p.phone}
                </span>
                {p.email && <span>{p.email}</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading student…</p>
        ) : isError || !p ? (
          <p className="p-8 text-center text-sm text-red-600">Could not load this student.</p>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setReceiptOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary-navy px-3 py-1.5 text-xs font-semibold text-white">
                <FileText className="h-4 w-4" /> Fee Receipt
              </button>
              {p.batches.map((b) => (
                <button key={b.id} onClick={() => goBatch(b.id)} className="flex items-center gap-1.5 rounded-md border border-primary-navy px-3 py-1.5 text-xs font-semibold text-primary-navy hover:bg-primary-navy hover:text-white">
                  <Users className="h-4 w-4" /> Open {p.batches.length > 1 ? b.name : 'Batch'}
                </button>
              ))}
            </div>

            <Section title="Fees">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Info label="Total" value={inr(p.fees.totalFees)} />
                <Info label="Discount" value={p.fees.discount ? `${p.fees.discount}%` : '-'} />
                <Info label="Paid" value={inr(p.fees.paidFees)} />
                <Info label="Pending" value={<span className={p.fees.pendingFees > 0 ? 'text-red-600' : ''}>{inr(p.fees.pendingFees)}</span>} />
              </div>
              {p.fees.pendingFees > 0 && p.fees.followUp?.followUpDate && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                  <CalendarClock className="h-3.5 w-3.5" /> Next instalment {inr(p.fees.followUp.amount)} on {formatDate(p.fees.followUp.followUpDate)}
                  {p.fees.followUp.notes ? ` · ${p.fees.followUp.notes}` : ''}
                </p>
              )}
              {p.fees.payments.length > 0 && (
                <table className="mt-2 w-full text-xs">
                  <thead>
                    <tr className="border-b border-stroke text-left text-slate-500">
                      <th className="py-1">Date</th>
                      <th className="py-1">Account</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.fees.payments.map((pay) => (
                      <tr key={pay.id} className="border-b border-stroke/60 last:border-0">
                        <td className="py-1">{formatDate(pay.createdAt)}</td>
                        <td className="py-1">{pay.account?.name || '-'}</td>
                        <td className="py-1 text-right font-semibold">{inr(pay.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Online Payment Link">
              <PaymentLinkPanel student={p} />
            </Section>

            <Section title="Personal Details">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="Username" value={p.username} />
                <Info label="Qualification" value={p.qualification} />
                <Info label="College" value={p.collegeName} />
                <Info label="Joined" value={p.joinedAt ? formatDate(p.joinedAt) : '-'} />
                <Info label="Placement" value={p.placementReceived} />
                <Info label="Internship" value={p.internship} />
                <Info label="Referrals" value={String(p.referrals)} />
                <Info label="Tasks done" value={String(p.tasksCompleted)} />
                <Info label="Assignments done" value={String(p.assignmentsCompleted)} />
              </div>
              {p.address && <p className="mt-2 text-xs text-slate-600">{p.address}</p>}
            </Section>

            <Section title={`Batches (${p.batches.length})`}>
              {p.batches.length ? (
                <div className="space-y-2">
                  {p.batches.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{b.name}</p>
                        <p className="text-xs text-slate-500">
                          {b.course || '-'} · {b.batchType} · {formatDate(b.startDate)} – {formatDate(b.endDate)}
                          {b.teacher ? ` · ${b.teacher}` : ''}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={`font-bold ${b.attendance.percentage >= 75 ? 'text-green-700' : 'text-red-600'}`}>{b.attendance.percentage}% attendance</p>
                        <p className="text-slate-500">
                          {b.attendance.present}/{b.attendance.classes} classes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Not added to any batch.</p>
              )}
            </Section>

            <Section title={`Interviews (${p.interviews.length})`}>
              {p.interviews.length ? (
                <ul className="space-y-1 text-xs">
                  {p.interviews.map((iv) => (
                    <li key={iv.id} className="flex flex-wrap justify-between gap-2 border-b border-stroke/60 pb-1 last:border-0">
                      <span>
                        <b>{iv.placement.companyName}</b> · {iv.placement.jobRole}
                      </span>
                      <span className="text-slate-500">
                        {formatDateTimeAuto(iv.interviewDate)} · {iv.interviewMode} · <b className="text-text-charcoal">{iv.status.replace('_', ' ')}</b>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No interviews yet.</p>
              )}
            </Section>

            <Section title={`Exams (${p.exams.length})`}>
              {p.exams.length ? (
                <ul className="space-y-1 text-xs">
                  {p.exams.map((e) => (
                    <li key={e.id} className="flex justify-between gap-2 border-b border-stroke/60 pb-1 last:border-0">
                      <span>{e.exam.name}</span>
                      <span className="font-semibold">
                        {e.marks} marks{e.percentage != null ? ` · ${Math.round(e.percentage)}%` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No exams attempted.</p>
              )}
            </Section>
          </div>
        )}
        {/* inside the panel so its clicks don't reach the drawer backdrop */}
        {p && <FeesReciept isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} selectedStudent={toReceiptStudent(p)} />}
      </div>
    </div>,
    document.body,
  );
};

export default StudentProfileDrawer;
