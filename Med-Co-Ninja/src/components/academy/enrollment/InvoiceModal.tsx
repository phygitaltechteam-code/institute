import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { academyApi } from '@/lib/api/admin/academyApi';
import { Btn, ErrorState, fmtDate, inr, Loading, Modal, paymentLabel } from '../ui';

/** Tax invoice for one enrollment (GST-inclusive amounts). Print or "Save as PDF" from the browser dialog. */
const InvoiceModal = ({ enrollmentId, onClose }: { enrollmentId: string | null; onClose: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['academy', 'invoice', enrollmentId],
    queryFn: () => academyApi.invoice(enrollmentId!),
    enabled: !!enrollmentId,
  });
  const print = useReactToPrint({ contentRef: ref, documentTitle: data ? `Invoice-${data.enrollment.invoiceNo}` : 'Invoice' });

  const e = data?.enrollment;
  const b = data?.business;
  const gst = Number(b?.gstPercent) || 0;
  const taxable = e ? e.amountPaid - e.taxAmount : 0;
  const sameState = !b?.state || !e?.student.state || b.state.trim().toLowerCase() === e.student.state.trim().toLowerCase();

  return (
    <Modal
      open={!!enrollmentId}
      size="lg"
      title="Invoice"
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Close
          </Btn>
          <Btn icon={<Printer className="h-4 w-4" />} disabled={!data} onClick={() => print()}>
            Print / Save PDF
          </Btn>
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : e && b ? (
        <div ref={ref} className="bg-white p-2 text-sm text-slate-800 print:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary-navy pb-4">
            <div>
              <h2 className="text-xl font-bold text-primary-navy">{b.businessName || 'MedCode Ninja'}</h2>
              {b.legalName && <p className="text-xs">{b.legalName}</p>}
              <p className="text-xs text-slate-600">{[b.address, b.city, b.state, b.pincode].filter(Boolean).join(', ')}</p>
              <p className="text-xs text-slate-600">{[b.phone, b.email].filter(Boolean).join(' · ')}</p>
              {b.gstNumber && <p className="text-xs font-semibold">GSTIN: {b.gstNumber}</p>}
              {b.panNumber && <p className="text-xs">PAN: {b.panNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold uppercase tracking-wide text-accent-teal">{gst > 0 ? 'Tax Invoice' : 'Invoice'}</p>
              <p className="text-xs">
                No: <b>{e.invoiceNo}</b>
              </p>
              <p className="text-xs">Date: {fmtDate(e.createdAt)}</p>
              {e.status === 'REVOKED' && <p className="mt-1 text-xs font-bold text-red-600">ACCESS REVOKED</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Billed to</p>
              <p className="font-semibold">{e.student.user.fullname}</p>
              <p className="text-xs text-slate-600">{e.student.user.phoneNumber} · {e.student.user.email}</p>
              <p className="text-xs text-slate-600">{[e.student.address, e.student.city, e.student.state, e.student.pincode].filter(Boolean).join(', ')}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Payment</p>
              <p className="text-xs">{paymentLabel(e.paymentMode)}{e.paymentRef ? ` · Ref ${e.paymentRef}` : ''}</p>
              {e.expiresAt && <p className="text-xs">Access valid till {fmtDate(e.expiresAt)}</p>}
            </div>
          </div>

          <table className="mt-4 w-full text-xs">
            <thead>
              <tr className="bg-primary-navy text-left text-white">
                <th className="px-2 py-2">Description</th>
                {b.sacCode && <th className="px-2 py-2">SAC</th>}
                <th className="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stroke">
                <td className="px-2 py-2">
                  {e.course ? `Online course: ${e.course.name}` : e.bundle ? `Course bundle: ${e.bundle.name}` : 'Course enrollment'}
                </td>
                {b.sacCode && <td className="px-2 py-2">{b.sacCode}</td>}
                <td className="px-2 py-2 text-right">{inr(e.listPrice)}</td>
              </tr>
              {e.discount > 0 && (
                <tr className="border-b border-stroke">
                  <td className="px-2 py-2">Discount{e.coupon ? ` (coupon ${e.coupon.code})` : ''}</td>
                  {b.sacCode && <td />}
                  <td className="px-2 py-2 text-right">− {inr(e.discount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-3 ml-auto w-full max-w-xs space-y-1 text-xs">
            {gst > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Taxable value</span>
                  <span>{inr(taxable)}</span>
                </div>
                {sameState ? (
                  <>
                    <div className="flex justify-between">
                      <span>CGST @ {gst / 2}%</span>
                      <span>{inr(e.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @ {gst / 2}%</span>
                      <span>{inr(e.taxAmount / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>IGST @ {gst}%</span>
                    <span>{inr(e.taxAmount)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between border-t-2 border-primary-navy pt-1 text-sm font-bold text-primary-navy">
              <span>Total paid</span>
              <span>{inr(e.amountPaid)}</span>
            </div>
            {e.amountPaid < e.listPrice - e.discount && (
              <div className="flex justify-between text-amber-700">
                <span>Balance due</span>
                <span>{inr(e.listPrice - e.discount - e.amountPaid)}</span>
              </div>
            )}
          </div>

          {e.note && <p className="mt-4 text-xs text-slate-600">Note: {e.note}</p>}
          <p className="mt-8 border-t border-stroke pt-2 text-center text-[11px] text-slate-500">
            {b.invoiceFooter || 'This is a computer-generated invoice and does not require a signature.'}
          </p>
        </div>
      ) : null}
    </Modal>
  );
};

export default InvoiceModal;
