import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import GenericTable from '@/components/Forms/Table/GenericTable';
import { Column } from '@/types/index';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, X } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import {
  useGetLeads,
  useDeleteLeadMutation,
  useUpdateLeadMutation,
} from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { showPopup } from '@/components/Common/AlertPopup';

interface LeadTableProps {
  batchId?: string;
}

type LeadType = {
  id: string;
  name: string;
  phoneNumber: string;
  source: string;
  course: string;
  qualification: string;
  interested: string;
  teacher: string;
  batchType: string;
  batch: string;
  batchId?: string;
  nextFollowUpDate: string;
  note: string;
  collegeName: string;
  status: string;
};

/** Popup to shift a lead into another batch (keeps the lead + its follow-ups, only the batch changes). */
const MoveLeadDialog = ({
  lead,
  currentBatchId,
  role,
  onClose,
}: {
  lead: LeadType;
  currentBatchId?: string;
  role?: string;
  onClose: () => void;
}) => {
  const { data: batchesData } = useGetBatches(role);
  const updateLead = useUpdateLeadMutation();
  const [target, setTarget] = useState('');
  const batches: any[] = (batchesData?.data || []).filter((b: any) => b.id !== (currentBatchId || lead.batchId));

  const handleMove = () => {
    if (!target) return showPopup('Please select the batch to move this lead to');
    const batch = batches.find((b) => b.id === target);
    updateLead.mutate(
      { leadId: lead.id, role, data: { batchId: target, ...(batch?.courseId ? { courseId: batch.courseId } : {}) } as any },
      { onSuccess: onClose },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-primary-navy/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-boxdark" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-primary-navy px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <ArrowRightLeft className="h-4 w-4" /> Move Lead to Another Batch
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="font-semibold text-text-charcoal">{lead.name}</p>
            <p className="text-xs text-slate-500">
              {lead.phoneNumber} · Current batch: <b>{lead.batch}</b>
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Move to batch *</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary-navy"
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.course?.name ? `(${b.course.name})` : ''} {b.batchType ? `· ${b.batchType}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Follow-ups and notes stay with the lead.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-stroke bg-gray-50 px-4 py-3">
          <GenericButton type="button" variant="cancel" onClick={onClose}>
            Cancel
          </GenericButton>
          <GenericButton type="button" variant="navy" onClick={handleMove} disabled={updateLead.isPending}>
            {updateLead.isPending ? 'Moving…' : 'Move Lead'}
          </GenericButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const LeadTable = ({ batchId: propBatchId }: LeadTableProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const role = user?.role;

  const batchId: string = propBatchId || (location.state as any)?.batchId || '';
  const inBatch = Boolean(propBatchId);

  // Inside a batch only that batch's leads are listed
  const { data: leadsData, isLoading, isError } = useGetLeads(inBatch ? { batchId: propBatchId } : undefined, role);
  const deleteLeadMutation = useDeleteLeadMutation(role);

  const [toDelete, setToDelete] = useState<LeadType | null>(null);
  const [toMove, setToMove] = useState<LeadType | null>(null);

  const tableData: LeadType[] = useMemo(
    () =>
      leadsData?.data?.map((lead: any) => ({
        id: lead.id,
        name: lead.name || 'N/A',
        phoneNumber: lead.phoneNumber || 'N/A',
        source: lead.source || 'N/A',
        course: lead.course?.name || 'N/A',
        qualification: lead.qualification || 'N/A',
        interested: lead.interested || 'N/A',
        teacher: lead.teacher?.user?.fullname || 'N/A',
        nextFollowUpDate:
          lead?.leadFollowUps?.length > 0
            ? lead.leadFollowUps.map((item: any) => formatDateTimeAuto(item.nextFollowUpDate)).join(', ')
            : '-',
        note: lead?.leadFollowUps?.length > 0 ? lead.leadFollowUps.map((item: any) => item.note).join(', ') : '-',
        batchType: lead.batch?.batchType || 'N/A',
        batch: lead.batch?.name || 'N/A',
        batchId: lead.batchId,
        collegeName: lead.collegeName || 'N/A',
        status: lead.status || 'NEW',
      })) || [],
    [leadsData],
  );

  const handleEdit = (lead: LeadType) => {
    if (role === 'ADMIN') {
      navigate({ to: '/admin/lead/folloupUpdate/$id', params: { id: lead.id }, state: { batchId } as any });
    } else {
      navigate({ to: '/faculty/lead/lead/$id', params: { id: lead.id }, state: { batchId } as any });
    }
  };

  const handleClick = (id: string) => {
    if (role === 'ADMIN') navigate({ to: '/admin/lead/batchlead/$id', params: { id } });
    else navigate({ to: '/faculty/lead/lead/$id', params: { id } });
  };

  const leadColumn: Column<LeadType>[] = [
    { accessor: 'name', header: 'Name' },
    { accessor: 'phoneNumber', header: 'Phone' },
    { accessor: 'source', header: 'Source' },
    ...(!inBatch ? [{ accessor: 'batch' as const, header: 'Batch' }] : []),
    { accessor: 'qualification', header: 'Qualification' },
    {
      accessor: 'interested',
      header: 'Interested',
      render: (item: LeadType) => (item.interested === 'NOT_INTERESTED' ? 'Not Interested' : item.interested || '-'),
    },
    { accessor: 'nextFollowUpDate', header: 'Next Follow Up' },
    { accessor: 'note', header: 'Note' },
  ];

  if (isLoading) return <div className="py-8 text-center text-sm text-slate-500">Loading leads…</div>;
  if (isError) return <div className="py-8 text-center text-sm text-red-500">Error loading leads. Please try again.</div>;

  return (
    <div>
      <GenericTable
        columns={leadColumn}
        data={tableData}
        title={inBatch ? `Batch Leads (${tableData.length})` : 'Lead Management'}
        itemsPerPage={10}
        searchAble
        action
        onEdit={handleEdit}
        // Inside a batch, leads are shifted to another batch instead of being deleted
        onDelete={inBatch ? undefined : (lead: LeadType) => setToDelete(lead)}
        customActions={(lead: LeadType) => (
          <button
            className="action-button rounded p-1 text-slate-600 transition-colors hover:bg-accent-teal/10 hover:text-accent-teal sm:p-1.5"
            onClick={(e) => {
              e.stopPropagation();
              setToMove(lead);
            }}
            title="Move to another batch"
          >
            <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        onRowClick={(item: LeadType) => handleClick(item.id)}
        showSrNo
      />

      {toMove && <MoveLeadDialog lead={toMove} currentBatchId={propBatchId} role={role} onClose={() => setToMove(null)} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete lead?"
        message={`"${toDelete?.name}" and its follow-ups will be removed. This cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          const lead = toDelete;
          setToDelete(null);
          if (lead) await deleteLeadMutation.mutateAsync(lead.id).catch(() => undefined);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default LeadTable;
