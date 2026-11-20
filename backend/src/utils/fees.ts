import httpStatus from 'http-status';
import ApiError from './ApiError';

/**
 * Single source of truth for a student's fee numbers.
 *  - totalFees : gross course fee from the installment plan
 *  - discount  : percentage (0–100) taken off the gross fee
 *  - paidFees  : money actually received so far
 * Net payable = total − discount%, pending = net − paid.
 */
export const computeStudentFees = (
    totalFees: number | null = 0,
    discountPercent: number | null = 0,
    paidFees: number | null = 0,
) => {
    const total = Math.max(0, Number(totalFees) || 0);
    const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    const paid = Math.max(0, Number(paidFees) || 0);

    const netPayable = Math.round(total - (total * discount) / 100);

    if (paid > netPayable) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Paid amount (₹${paid}) cannot be more than the payable fee after discount (₹${netPayable})`,
        );
    }

    return {netPayable, paid, pending: netPayable - paid};
};
