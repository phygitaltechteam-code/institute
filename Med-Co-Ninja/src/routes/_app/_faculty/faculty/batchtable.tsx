import BatchTable from '@/components/faculty/batch/BatchTable'
import GenericButton from '@/components/Forms/Buttons/GenericButton'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/_app/_faculty/faculty/batchtable')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="p-1 md:p-1">
      {/* Header with Title and Add Button */}
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl md:text-2xl">
            Batch Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Manage and view all records
          </p>
        </div>

        <GenericButton
          onClick={() => navigate({ to: '/faculty/create-batch' })}
          className="flex items-center gap-2 bg-primary-navy text-white hover:bg-primary-navy/90"
        >
          <Plus className="h-4 w-4" />
          Create batch
        </GenericButton>
      </div>

      {/* Batch Table */}
      <div>
        <BatchTable />
      </div>
    </div>
  )
}