import { createFileRoute } from '@tanstack/react-router';
import { BlogList } from '@/components/academy/public/BlogPages';

/** Public blog list — no login needed. */
export const Route = createFileRoute('/blogs/')({
  component: BlogList,
});
