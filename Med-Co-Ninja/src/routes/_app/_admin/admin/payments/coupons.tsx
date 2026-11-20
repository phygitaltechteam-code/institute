import { createFileRoute } from '@tanstack/react-router';
import Coupons from '@/components/academy/payments/Coupons';

export const Route = createFileRoute('/_app/_admin/admin/payments/coupons')({
  component: Coupons,
});
