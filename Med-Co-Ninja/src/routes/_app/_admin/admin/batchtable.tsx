import React, { useState } from 'react';
import BatchTable from '@/components/faculty/batch/BatchTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

export const Route = createFileRoute('/_app/_admin/admin/batchtable')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  // const [batchTypeFilter, setBatchTypeFilter] = useState('ALL');

  return (
    <div className="p-2 md:p-2">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl md:text-2xl">
            Batch Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Manage and view all batch records
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* <select
            value={batchTypeFilter}
            onChange={(e) => setBatchTypeFilter(e.target.value)}
            className="rounded-md border border-gray-100 px-3 py-1.5 text-sm focus:outline-none  focus:primary-navy/90"
          >
            <option value="ALL">Batch Type</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select> */}

          <GenericButton
            onClick={() => navigate({ to: '/admin/create-batch' })}
            className="flex items-center gap-2 bg-primary-navy text-white hover:bg-primary-navy/90"
          >
            <Plus className="h-4 w-4" />
            Create Batch
          </GenericButton>
        </div>
      </div>

      {/* Batch Table */}
      <BatchTable />
    </div>
  );
}