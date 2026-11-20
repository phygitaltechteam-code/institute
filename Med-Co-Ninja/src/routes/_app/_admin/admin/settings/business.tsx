import { createFileRoute } from '@tanstack/react-router';
import BusinessSettings from '@/components/academy/settings/BusinessSettings';

export const Route = createFileRoute('/_app/_admin/admin/settings/business')({
  component: BusinessSettings,
});
