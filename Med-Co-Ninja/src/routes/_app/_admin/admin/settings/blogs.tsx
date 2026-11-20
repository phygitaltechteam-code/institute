import { createFileRoute } from '@tanstack/react-router';
import Blogs from '@/components/academy/settings/Blogs';

export const Route = createFileRoute('/_app/_admin/admin/settings/blogs')({
  component: Blogs,
});
