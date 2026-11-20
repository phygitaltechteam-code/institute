import Batchleadinfo from '@/components/faculty/lead/BetchLead';
import {createFileRoute} from '@tanstack/react-router';
export const Route = createFileRoute('/_app/_admin/admin/lead/batchlead/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Batchleadinfo />;
}
