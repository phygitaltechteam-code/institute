import { createFileRoute } from '@tanstack/react-router';
import Partners from '@/components/academy/payments/Partners';

export const Route = createFileRoute('/_app/_admin/admin/payments/partners')({
  component: Partners,
});
