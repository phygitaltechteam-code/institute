import FacultyTable from '@/components/admin/FacultyTable'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import GenericButton from '@/components/Forms/Buttons/GenericButton'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/Common/PageHeader'

export const Route = createFileRoute('/_app/_admin/admin/faculty-table')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="p-2 md:p-6">
      <PageHeader
        title="Faculty Management"
        subtitle="Manage and view all faculty records"
        action={
          <GenericButton
            onClick={() => navigate({ to: '/admin/add-faculty'  })}
            variant="navy"
            className="flex items-center gap-2 justify-end"
          >
            <Plus className="h-4 w-4" />
            Add Faculty
          </GenericButton>
        }
      />

      <div>
        <FacultyTable />
      </div>
    </div>
  )
}