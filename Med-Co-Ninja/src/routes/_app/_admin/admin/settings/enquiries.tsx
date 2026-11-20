import { createFileRoute } from '@tanstack/react-router';
import ContactMessages from '@/components/academy/settings/ContactMessages';

export const Route = createFileRoute('/_app/_admin/admin/settings/enquiries')({
  component: ContactMessages,
});
