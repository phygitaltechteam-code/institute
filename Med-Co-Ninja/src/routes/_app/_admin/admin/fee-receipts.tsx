import FeeReceiptSearch from '@/components/faculty/batch/FeeReceiptSearch';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_admin/admin/fee-receipts')({
  component: FeeReceiptSearch,
});
