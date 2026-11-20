import { createFileRoute } from '@tanstack/react-router';
import LiveClasses from '@/components/academy/courses/LiveClasses';

export const Route = createFileRoute('/_app/_admin/admin/courses/live-classes')({
  component: LiveClasses,
});
