import { createFileRoute } from '@tanstack/react-router';
import HomeLanding from '@/components/academy/public/HomeLanding';

/** Public home page shown before sign-in. Logged-in users are sent to their own panel. */
export const Route = createFileRoute('/')({
  component: HomeLanding,
});
