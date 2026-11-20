import { createFileRoute } from '@tanstack/react-router';
import BulkStudentImport from '@/components/admin/students/BulkStudentImport';

export const Route = createFileRoute('/_app/_admin/admin/settings/bulk-students')({
  component: BulkStudentImport,
});
