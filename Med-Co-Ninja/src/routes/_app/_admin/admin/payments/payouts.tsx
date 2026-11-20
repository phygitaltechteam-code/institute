import { createFileRoute } from '@tanstack/react-router';
import Payouts from '@/components/academy/payments/Payouts';

export const Route = createFileRoute('/_app/_admin/admin/payments/payouts')({
  component: Payouts,
});
