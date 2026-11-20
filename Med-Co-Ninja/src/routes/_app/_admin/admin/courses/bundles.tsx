import { createFileRoute } from '@tanstack/react-router';
import Bundles from '@/components/academy/courses/Bundles';

export const Route = createFileRoute('/_app/_admin/admin/courses/bundles')({
  component: Bundles,
});
