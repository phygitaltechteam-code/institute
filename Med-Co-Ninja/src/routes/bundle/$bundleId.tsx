import { createFileRoute } from '@tanstack/react-router';
import BundleLanding from '@/components/academy/public/BundleLanding';

/** Public bundle landing page — no login needed, shareable link. */
const BundlePage = () => {
  const { bundleId } = Route.useParams();
  return <BundleLanding id={bundleId} />;
};

export const Route = createFileRoute('/bundle/$bundleId')({
  component: BundlePage,
});
