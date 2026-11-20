import { createFileRoute } from '@tanstack/react-router';
import EducationalFiles from '@/components/academy/files/EducationalFiles';

export const Route = createFileRoute('/_app/_admin/admin/educational-files')({
  component: EducationalFiles,
});
