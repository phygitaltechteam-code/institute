import { ExpenditureTable } from '@/components/faculty/expenditure/ExpenditureTable'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import GenericButton from '@/components/Forms/Buttons/GenericButton'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/expenditure/expenditure-list',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="p-4 md:p-6">
      {/* Header with Title and Add Button */}
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl md:text-2xl">
            Expenditure Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Manage and view all expenditure records
          </p>
        </div>

        <GenericButton
          onClick={() => navigate({ to: '/faculty/expenditure/expenditure-form' })}
          className="flex items-center gap-2 bg-primary-navy text-white hover:bg-primary-navy/90"
        >
          <Plus className="h-4 w-4" />
          Add Expenditure
        </GenericButton>
      </div>

      {/* Expenditure Table */}
      <div>
        <ExpenditureTable />
      </div>
    </div>
  )
}