import { createFileRoute } from '@tanstack/react-router';
import FeeCollectionReport from '@/components/admin/reports/FeeCollectionReport';

export const Route = createFileRoute('/_app/_admin/admin/reports/fee-collections')({
  component: FeeCollectionReport,
});
