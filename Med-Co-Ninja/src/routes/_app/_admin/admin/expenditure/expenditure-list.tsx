import { ExpenditureTable } from '@/components/faculty/expenditure/ExpenditureTable'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import GenericButton from '@/components/Forms/Buttons/GenericButton'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/Common/PageHeader'

export const Route = createFileRoute(
  '/_app/_admin/admin/expenditure/expenditure-list',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Expenditure Management"
        subtitle="Manage and view all expenditure records"
        action={
          <GenericButton
            onClick={() => navigate({ to: '/admin/expenditure/expenditure-form' })}
            variant="navy"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expenditure
          </GenericButton>
        }
      />

      <div>
        <ExpenditureTable />
      </div>
    </div>
  )
}