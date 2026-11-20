import { createFileRoute } from '@tanstack/react-router';
import EnrollmentTable from '@/components/academy/enrollment/EnrollmentTable';

export const Route = createFileRoute('/_app/_admin/admin/payments/invoices')({
  component: () => <EnrollmentTable mode="sales" />,
});
