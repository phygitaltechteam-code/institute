import StudentDetailsTable from '@/components/faculty/StudentDetailsTable';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {Plus} from 'lucide-react';
import PageHeader from '@/components/Common/PageHeader';

export const Route = createFileRoute('/_app/_admin/admin/student-details')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="p-2 md:p-6">
      <PageHeader
        title="Student Management."
        subtitle="Manage and view all student records"
        action={
          <GenericButton
            onClick={() => navigate({to: '/admin/student/addstd'})}
            variant="navy"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </GenericButton>
        }
      />

      <div>
        <StudentDetailsTable />
      </div>
    </div>
  );
}
