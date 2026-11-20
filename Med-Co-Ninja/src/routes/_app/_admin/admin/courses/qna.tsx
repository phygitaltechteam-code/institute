import { createFileRoute } from '@tanstack/react-router';
import StudentQnA from '@/components/academy/courses/StudentQnA';

export const Route = createFileRoute('/_app/_admin/admin/courses/qna')({
  component: StudentQnA,
});
