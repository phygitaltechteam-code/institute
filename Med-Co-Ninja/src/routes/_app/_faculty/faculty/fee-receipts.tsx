import FeeReceiptSearch from '@/components/faculty/batch/FeeReceiptSearch';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_faculty/faculty/fee-receipts')({
  component: FeeReceiptSearch,
});
