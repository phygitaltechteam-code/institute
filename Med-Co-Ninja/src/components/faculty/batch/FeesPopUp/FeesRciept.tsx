import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import React, { useRef } from 'react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import { formatDate } from '@/utils/dateTimeUtils';
import Logo from '@/assets/logo.png';

interface FeesRecieptProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudent?: any | null;
}

const inr = (n: number) => `₹${(Math.round(n) || 0).toLocaleString('en-IN')}`;

// Fee table cell styles
const td = 'border border-gray-300 px-3 py-2';
const th = 'border border-primary-navy px-3 py-2 font-semibold';

export const FeesReciept: React.FC<FeesRecieptProps> = ({
    isOpen,
    onClose,
    selectedStudent
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receipt-${selectedStudent?.name || 'student'}`,
        pageStyle: `
            @page { size: A4 portrait; margin: 12mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                #receipt { page-break-inside: avoid; break-inside: avoid; box-shadow: none !important; }
                .no-print { display: none !important; }
            }
        `,
    });

    if (!isOpen || !selectedStudent) return null;

    const s = selectedStudent as any;
    const now = new Date();
    const today = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const receiptNo = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate(),
    ).padStart(2, '0')}-${String(s.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    // Fee figures — same formula as the backend: net = total − discount%, pending = net − paid
    const totalFees = parseFloat(s.totalFees) || 0;
    const discountPct = parseFloat(s.discount) || 0;
    const discountAmt = Math.round((totalFees * discountPct) / 100);
    const netPayable = totalFees - discountAmt;
    const totalPaid = parseFloat(s.paidFees) || 0;
    const pendingAmount = Math.max(parseFloat(s.pendingFees) || 0, 0);

    // The follow-up is the NEXT installment due — a reminder, not money received
    const followUp = s.followUp;
    const nextDueAmount = followUp?.amount ? parseFloat(followUp.amount) : 0;
    const nextDueDate = followUp?.followUpDate ? formatDateTimeAuto(followUp.followUpDate) : '';

    const batch = s.batch || {};
    const isFullyPaid = pendingAmount <= 0;

    const rows: { label: string; amount: string; cls?: string }[] = [
        { label: 'Total Course Fee', amount: inr(totalFees) },
        ...(discountAmt > 0 ? [{ label: `Discount (${discountPct}%)`, amount: `− ${inr(discountAmt)}` }] : []),
        { label: 'Net Payable', amount: inr(netPayable), cls: 'font-semibold' },
        { label: 'Amount Paid', amount: inr(totalPaid), cls: 'font-semibold' },
    ];

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-primary-navy/50 p-2 backdrop-blur-sm sm:p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[95dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-gray-100 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Toolbar */}
                <div className="no-print flex items-center justify-between gap-2 bg-primary-navy px-4 py-2.5">
                    <h2 className="text-sm font-semibold text-white sm:text-base">Fee Receipt</h2>
                    <div className="flex items-center gap-2">
                        <GenericButton
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 rounded-md bg-accent-teal px-3 py-1.5 text-xs font-semibold text-white sm:text-sm"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </GenericButton>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Receipt (printable area) */}
                <div className="overflow-y-auto p-2 sm:p-4">
                    <div ref={printRef} id="receipt" className="mx-auto bg-white p-4 text-text-charcoal shadow sm:p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 border-b-2 border-primary-navy pb-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <img src={Logo} alt="MedCode Ninja" className="h-10 w-auto shrink-0 object-contain sm:h-14" />
                                <div className="min-w-0">
                                    <h1 className="text-base font-extrabold tracking-wide text-primary-navy sm:text-xl">
                                        MED CODE NINJA
                                    </h1>
                                    <p className="text-[10px] font-semibold tracking-widest text-gray-500 sm:text-xs">
                                        TRAINING &amp; PLACEMENT INSTITUTE
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <span className="inline-block rounded bg-primary-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
                                    Fee Receipt
                                </span>
                                <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">
                                    No: <span className="font-semibold text-text-charcoal">{receiptNo}</span>
                                </p>
                                <p className="text-[11px] text-gray-500 sm:text-xs">
                                    Date: <span className="font-semibold text-text-charcoal">{today}</span>
                                </p>
                            </div>
                        </div>

                        {/* Student & batch details */}
                        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-lg bg-gray-50 p-3 text-xs sm:grid-cols-2 sm:text-sm">
                            <p><span className="text-gray-500">Student Name:</span> <b>{s.name || 'N/A'}</b></p>
                            <p><span className="text-gray-500">Phone:</span> <b>{s.phone || 'N/A'}</b></p>
                            <p><span className="text-gray-500">Batch:</span> <b>{batch.name || 'N/A'}</b></p>
                            <p><span className="text-gray-500">Batch Type:</span> <b>{batch.batchType || 'N/A'}</b></p>
                            <p className="sm:col-span-2">
                                <span className="text-gray-500">Batch Duration:</span>{' '}
                                <b>
                                    {batch.startDate ? formatDate(batch.startDate) : 'N/A'} to{' '}
                                    {batch.endDate ? formatDate(batch.endDate) : 'N/A'}
                                </b>
                            </p>
                        </div>

                        {/* Fee breakdown */}
                        <table className="mt-4 w-full border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-primary-navy text-white">
                                    <th className={`${th} w-14 text-center`}>Sr No.</th>
                                    <th className={`${th} text-left`}>Particulars</th>
                                    <th className={`${th} w-40 text-right`}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={r.label} className={`${i % 2 ? 'bg-gray-50' : 'bg-white'} ${r.cls || ''}`}>
                                        <td className={`${td} text-center text-gray-500`}>{i + 1}</td>
                                        <td className={td}>{r.label}</td>
                                        <td className={`${td} text-right tabular-nums`}>{r.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td className={`${td} text-right`} colSpan={2}>Balance Pending</td>
                                    <td className={`${td} text-right tabular-nums`}>{inr(pendingAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Next installment (only while a balance is pending) */}
                        {!isFullyPaid && nextDueAmount > 0 && (
                            <p className="mt-3 text-right text-xs text-gray-600 sm:text-sm">
                                Next installment: <b>{inr(nextDueAmount)}</b>
                                {nextDueDate && <> due on <b>{nextDueDate}</b></>}
                            </p>
                        )}

                        {/* Signatures */}
                        <div className="mt-10 flex justify-between gap-6 text-center text-[11px] sm:text-xs">
                            <div className="w-36">
                                <div className="mb-1 border-b border-gray-400" />
                                Student Signature
                            </div>
                            <div className="w-36">
                                <div className="mb-1 border-b border-gray-400" />
                                Authorized Signatory
                            </div>
                        </div>

                        <p className="mt-4 border-t border-dashed border-gray-300 pt-2 text-center text-[10px] text-gray-400">
                            This is a computer-generated receipt.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
