import { createFileRoute } from '@tanstack/react-router';
import WebsiteSettings from '@/components/academy/settings/WebsiteSettings';

export const Route = createFileRoute('/_app/_admin/admin/settings/website')({
  component: WebsiteSettings,
});
