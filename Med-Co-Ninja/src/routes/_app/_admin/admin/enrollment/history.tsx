import { createFileRoute } from '@tanstack/react-router';
import EnrollmentTable from '@/components/academy/enrollment/EnrollmentTable';

export const Route = createFileRoute('/_app/_admin/admin/enrollment/history')({
  component: () => <EnrollmentTable mode="history" />,
});
