import PlacementTable from '@/components/faculty/placement/PlacmentTable';

import {createFileRoute, useNavigate} from '@tanstack/react-router';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {Plus} from 'lucide-react';
import PageHeader from '@/components/Common/PageHeader';

export const Route = createFileRoute(
  '/_app/_admin/admin/placement/placement-list',
)({
  component: RouteComponent,
});

function RouteComponent() {
  // return <PlacementTable/>
  const navigate = useNavigate();
  return (
    <div className="p-2 md:p-6">
      <PageHeader
        title="Manage placements"
        subtitle="Manage and view all student records"
        action={
          <GenericButton
            onClick={() => navigate({to: '/admin/placement/placementform'})}
            variant="navy"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add placement
          </GenericButton>
        }
      />

      <div>
        <PlacementTable />
      </div>
    </div>
  );
}
