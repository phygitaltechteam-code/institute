import { createFileRoute } from '@tanstack/react-router';
import AcademyReport from '@/components/academy/report/AcademyReport';

export const Route = createFileRoute('/_app/_admin/admin/report')({
  component: AcademyReport,
});
