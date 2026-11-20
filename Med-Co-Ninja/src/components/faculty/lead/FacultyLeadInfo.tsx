import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { useAuthContext } from '@/context/AuthContext';
import {
  useGetLeadById,
  useAddNextFollowUp,
  useUpdateLeadMutation,
} from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { useGetCourses } from '@/mutations/courseMutation';
import { useGetFaculties } from '@/lib/react-query/queriesAndMutations/queryMutation';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import z from 'zod';
// import { formatDate } from '@/utils/utilities';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import DatePicker from '@/components/Forms/Input/DatePicker';
import toast from 'react-hot-toast';
import { formatDate, formatTime, formatDateTime } from '@/utils/dateTimeUtils';

/* ─── Helper for parsing Date and Time ─────────────────── */
const parseDateTime = (dateTimeStr?: string) => {
  if (!dateTimeStr) return { date: '', time: '' };
  if (dateTimeStr.includes('T')) {
    // Stored values are UTC ISO strings; show them in the user's local date and time
    const dt = new Date(dateTimeStr);
    if (!Number.isNaN(dt.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
        time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
      };
    }
    const [d, t] = dateTimeStr.split('T');
    return { date: d, time: t ? t.substring(0, 5) : '' };
  }
  return { date: dateTimeStr, time: '' };
};

/* ─── Get current date and time ────────────────────────── */
const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
};

/* ─── Follow-up form schema ─────────────────────────────── */
const followUpSchema = z.object({
  lead: z.array(
    z.object({
      date: z.string().optional(),
      note: z.string().min(1, 'Note is required'),
      nextFollowUp: z.string().optional(),
      nextFollowUpTime: z.string().optional(),
      isSaved: z.boolean().optional(),
    })
  ),
  advance: z.string().optional(),
  discount: z.string().optional(),
});

/* ─── Inline edit form schema ───────────────────────────── */
const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be 10 digits')
    .max(10, 'Phone number must be 10 digits'),
  source: z.string().optional(),
  courseId: z.string().min(1, 'Course is required'),
  qualification: z.string().optional(),
  interested: z.string().optional(),
  teacherId: z.string().optional(),
  mode: z.string().optional(),
  batchId: z.string().optional(),
  collegeName: z.string().optional(),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface LeadInfoProps {
  leadId: string;
}

const FacultyLeadInfo = ({ leadId }: LeadInfoProps) => {
  // Lead details are always shown as an editable form (no separate view/edit toggle)
  const isEdit = true;
  const [infoOpen, setInfoOpen] = useState(false);
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set());
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();

  // Check if user is ADMIN
  const isAdmin = role === 'ADMIN';
  // Get current user's faculty ID (for TEACHER role)
  const currentUserFacultyId = user?.facultyId || user?.teacherId || user?.id || '';

  /* ── Data fetching ────────────────────────────────────── */
  const { data: leadData, isLoading, isError, refetch } = useGetLeadById(leadId, role);
  const { mutate: addFollowUp, isPending } = useAddNextFollowUp();
  const updateLeadMutation = useUpdateLeadMutation();

  const { data: coursesData } = useGetCourses(role);
  const { data: facultyData } = useGetFaculties(role);
  const { data: batchData } = useGetBatches(role);

  const courseOptions =
    coursesData?.data?.data?.map((c: any) => ({ label: c.name, value: c.id })) || [];

  const facultyOptions =
    facultyData?.data?.map((f: any) => ({
      label: f.fullname || f.username || f.email || 'Unknown',
      value: f.id,
    })) || [];

  const batchOptions =
    batchData?.data?.map((b: any) => ({
      label: `${b.name} (${b.course?.name || 'No Course'})`,
      value: b.id,
    })) || [];

  /* ── Follow-up form ───────────────────────────────────── */
  const followUpMethods = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      lead: [{
        date: getCurrentDateTime().date,
        note: '',
        nextFollowUp: '',
        nextFollowUpTime: '',
        isSaved: false
      }],
      advance: '',
      discount: '',
    },
  });
  const { handleSubmit, control, reset, getValues, setValue } = followUpMethods;
  const { fields, append, remove } = useFieldArray({ control, name: 'lead' });

  /* ── Inline edit form ─────────────────────────────────── */
  const editMethods = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      source: '',
      courseId: '',
      qualification: '',
      interested: '',
      teacherId: isAdmin ? '' : currentUserFacultyId, // Empty for ADMIN, set for TEACHER
      mode: '',
      batchId: '',
      collegeName: '',
    },
  });
  const {
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: editReset,
    setValue: setEditValue,
  } = editMethods;

  /* ── Populate both forms when lead data arrives ───────── */
  useEffect(() => {
    if (leadData && leadData.id) {
      const lead = leadData;

      // Follow-up form
      if (lead.leadFollowUps && lead.leadFollowUps.length > 0) {
        const followUps = lead.leadFollowUps.map((fu: any, index: number) => {
          const parsed = parseDateTime(fu.nextFollowUpDate);
          return {
            date: fu.createdAt ? formatDateTime(fu.createdAt) : getCurrentDateTime().date,
            note: fu.note || '',
            nextFollowUp: parsed.date ? formatDate(parsed.date) : '',
            nextFollowUpTime: parsed.time || '',
            isSaved: true,
          };
        });
        const savedIndices = new Set(followUps.map((_: any, i: number) => i));
        setSavedRows(savedIndices);

        reset({
          lead: followUps,
          advance: lead.advance || '',
          discount: lead.discount || '',
        });
      } else {
        const parsed = parseDateTime(lead.nextFollowUp);
        reset({
          lead: [
            {
              date: getCurrentDateTime().date,
              note: '',
              nextFollowUp: parsed.date ? formatDate(parsed.date) : '',
              nextFollowUpTime: parsed.time || '',
              isSaved: false,
            },
          ],
          advance: lead.advance || '',
          discount: lead.discount || '',
        });
      }

      // Inline edit form
      editReset({
        name: lead.name || '',
        phoneNumber: lead.phoneNumber || '',
        source: lead.source || '',
        courseId: lead.courseId || '',
        qualification: lead.qualification || '',
        interested: lead.interested || '',
        teacherId: isAdmin ? (lead.teacherId || '') : currentUserFacultyId,
        mode: lead.mode || '',
        batchId: lead.batchId || '',
        collegeName: lead.collegeName || '',
      });
    }
  }, [leadData, reset, editReset, currentUserFacultyId, isAdmin]);

  const handleAppend = () => {
    append({
      date: getCurrentDateTime().date,
      note: '',
      nextFollowUp: '',
      nextFollowUpTime: '',
      isSaved: false
    });
  };

  /* ── Save single follow-up row ────────────────────────── */
  const saveSingleFollowUp = (index: number) => {
    const values = getValues();
    const item = values.lead[index];

    if (!item.note) {
      toast.error('Note is required');
      return;
    }

    setSavingRow(index);

    let nextFollowUpDate = item.nextFollowUp || undefined;
    if (item.nextFollowUp && item.nextFollowUpTime) {
      // Local date + time -> full ISO timestamp so the server stores the exact moment
      const localDt = new Date(`${item.nextFollowUp}T${item.nextFollowUpTime}`);
      nextFollowUpDate = Number.isNaN(localDt.getTime())
        ? `${item.nextFollowUp}T${item.nextFollowUpTime}`
        : localDt.toISOString();
    }

    const payload = {
      leadId,
      note: item.note,
      nextFollowUpDate,
      teacherId: isAdmin ? (item.facultyId || currentUserFacultyId) : currentUserFacultyId,
    };

    addFollowUp(
      {
        data: payload,
        role,
      },
      {
        onSuccess: () => {
          setSavingRow(null);
          setSavedRows((prev) => new Set(prev).add(index));
          setValue(`lead.${index}.isSaved`, true);
          refetch();
          // toast.success('Follow-up saved successfully!');
        },
        onError: () => {
          setSavingRow(null);
          toast.error('Failed to save follow-up');
        },
      }
    );
  };

  /* ── Save all follow-ups ───────────────────────────────── */
  const onFollowUpSubmit = (data: FollowUpFormValues) => {
    let savedCount = 0;
    let totalToSave = 0;

    data.lead.forEach((item, index) => {
      if (savedRows.has(index)) return;

      if (item.note) {
        totalToSave++;
        let nextFollowUpDate = item.nextFollowUp || undefined;
        if (item.nextFollowUp && item.nextFollowUpTime) {
          // Local date + time -> full ISO timestamp so the server stores the exact moment
          const localDt = new Date(`${item.nextFollowUp}T${item.nextFollowUpTime}`);
          nextFollowUpDate = Number.isNaN(localDt.getTime())
            ? `${item.nextFollowUp}T${item.nextFollowUpTime}`
            : localDt.toISOString();
        }

        const payload = {
          leadId,
          note: item.note,
          nextFollowUpDate,
          teacherId: isAdmin ? (item.facultyId || currentUserFacultyId) : currentUserFacultyId,
        };

        addFollowUp(
          {
            data: payload,
            role,
          },
          {
            onSuccess: () => {
              savedCount++;
              setSavedRows((prev) => new Set(prev).add(index));
              setValue(`lead.${index}.isSaved`, true);
              if (savedCount === totalToSave) {
                refetch();
              }
            },
            onError: () => {
              toast.error('Failed to save some follow-ups');
            },
          }
        );
      }
    });

    if (totalToSave === 0) {
      toast.info('No new follow-ups to save');
    }
  };

  /* ── Inline edit submit ───────────────────────────────── */
  const onEditSubmit = (data: EditFormValues) => {
    const payload = {
      name: data.name,
      phoneNumber: data.phoneNumber,
      source: data.source || undefined,
      courseId: data.courseId,
      qualification: data.qualification || undefined,
      interested: data.interested || undefined,
      teacherId: isAdmin ? data.teacherId : currentUserFacultyId,
      mode: data.mode || undefined,
      batchId: data.batchId || undefined,
      collegeName: data.collegeName || undefined,
    };

    updateLeadMutation.mutate(
      { leadId, data: payload, role },
      {
        onSuccess: (response) => {
          if (response?.interested === 'WIN') {
            user?.role === 'ADMIN'
              ? navigate({ to: '/admin/student/addstd' })
              : navigate({ to: '/faculty/student/addstd' });
          }
          refetch();
        },
        onError: () => {
          toast.error('Failed to update lead');
        },
      }
    );
  };

  /* ── Back navigation ──────────────────────────────────── */
  const handleBack = () => {
    // if (role === 'ADMIN') navigate({ to: '/admin/lead/all-lead-table' });
    // else navigate({ to: '/faculty/lead/all-lead-table' });

    window.history.back();
  };

  /* ── Loading / Error states ───────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-pure-white p-4 shadow">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent" />
          <p className="text-text-charcoal">Loading lead information...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-pure-white p-5 shadow">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-red-600">Failed to load lead information. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-lg bg-primary-blue px-4 py-2 text-white hover:bg-primary-navy"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const lead = leadData || {};

  return (
    <div className="rounded-lg bg-pure-white p-5 shadow">
      {/* Back Button */}
      <div className="mb-4">
        <button
          type="button"
          className="flex w-fit items-center gap-2 rounded bg-primary-navy px-4 py-2 text-white hover:bg-primary-navy/80"
          onClick={handleBack}
        >
          ← Back to Leads
        </button>
      </div>

      {/* Section Header with Edit / Cancel toggle */}
      <div className="mb-4 flex items-center justify-between">
        {/* Collapsed by default: tap to show and edit the lead details */}
        <button
          type="button"
          onClick={() => setInfoOpen((o) => !o)}
          aria-expanded={infoOpen}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-stroke bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-primary-navy/40"
        >
          <span className="min-w-0">
            <span className="block text-base font-bold text-text-charcoal md:text-lg">Lead Information</span>
            {!infoOpen && (
              <span className="block truncate text-xs text-slate-500">
                {lead?.name || "N/A"} · {lead?.phoneNumber || "N/A"} · {lead?.course?.name || "No course"} · {lead?.interested || "N/A"}
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-teal">
            {infoOpen ? "Hide" : "View / Edit"}
            <span className={`inline-block transition-transform ${infoOpen ? "rotate-180" : ""}`}>▾</span>
          </span>
        </button>
      </div>

      {/* ── VIEW mode ────────────────────────────────────── */}
      {!isEdit && (
        <div className="grid grid-cols-1 gap-3 border rounded-lg bg-bg-light-mint p-4 sm:grid-cols-2 lg:grid-cols-3">
          <p><b>Name:</b> {lead.name || 'N/A'}</p>
          <p><b>Mobile:</b> {lead.phoneNumber || 'N/A'}</p>
          <p><b>Source:</b> {lead.source || 'N/A'}</p>
          <p><b>Course:</b> {lead.course?.name || 'N/A'}</p>
          <p><b>Qualification:</b> {lead.qualification || 'N/A'}</p>
          <p><b>Interested:</b> {lead.interested || 'N/A'}</p>
          <p><b>Faculty:</b> {isAdmin ? (lead.teacher?.user?.fullname || 'Not Assigned') : (user?.fullname || 'Current User')}</p>
          <p><b>College:</b> {lead.collegeName || 'N/A'}</p>
          <p>
            <b>Batch Type:</b>
            <span
              className={`ml-1 rounded-full px-2 py-1 text-xs font-semibold ${lead.mode === 'ONLINE'
                ? 'bg-purple-100 text-purple-800'
                : lead.mode === 'OFFLINE'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {lead.mode || 'N/A'}
            </span>
          </p>
          <p><b>Batch:</b> {lead.batch?.name || 'Not Assigned'}</p>
          <p><b>Created:</b> {lead.createdAt ? formatDateTime(lead.createdAt) : 'N/A'}</p>
          <p><b>Updated:</b> {lead.updatedAt ? formatDateTime(lead.updatedAt) : 'N/A'}</p>
        </div>
      )}

      {/* ── EDIT mode ────────────────────────────────────── */}
      {isEdit && infoOpen && (
        <FormProvider {...editMethods}>
          <form
            onSubmit={handleEditSubmit(onEditSubmit)}
            className="grid grid-cols-1 gap-3 rounded-lg border border-stroke bg-bg-light-mint p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          >
            <GenericInputField label="Name" name="name" placeholder="Enter Name" required />
            <GenericInputField
              label="Phone Number"
              name="phoneNumber"
              placeholder="Enter 10-digit Phone Number"
              required
            />

            <GenericDropdown
              label="Source"
              name="source"
              control={editControl as any}
              options={[
                { label: 'WebSite', value: 'WEB' },
                { label: 'Refral', value: 'REFRAL' },
                // Keep the lead's current source selectable even if it is not one of the presets
                ...(lead?.source && !['WEB', 'REFRAL'].includes(lead.source)
                  ? [{ label: lead.source, value: lead.source }]
                  : []),
              ]}
            />

            <GenericDropdown
              control={editControl as any}
              label="Course"
              name="courseId"
              options={courseOptions}
              placeholder="Select Course"
              required
            />
            <GenericInputField label="Qualification" name="qualification" placeholder="Enter Qualification" />
            <GenericDropdown
              label="Interested"
              name="interested"
              control={editControl as any}
              options={[
                { label: 'Not Interested', value: 'NOT_INTERESTED' },
                { label: 'Cold', value: 'COLD' },
                { label: 'Warm', value: 'WARM' },
                { label: 'Win', value: 'WIN' },
              ]}
              placeholder="Select"
            />

            {/* Conditional Faculty Field */}
            {isAdmin ? (
              <GenericDropdown
                label="Faculty"
                name="teacherId"
                control={editControl as any}
                options={facultyOptions}
                placeholder="Select Faculty"
              />
            ) : (
              <div className="flex items-center gap-3">
                <label className="text-md font-medium text-text-charcoal">Faculty</label>
                <p className="text-md text-text-charcoal font-semibold">{user?.fullname || 'Current User'}</p>
                <input type="hidden" name="teacherId" value={currentUserFacultyId} />
              </div>
            )}

            <GenericDropdown
              label="Batch Type"
              name="mode"
              control={editControl as any}
              options={[
                { label: 'Online', value: 'ONLINE' },
                { label: 'Offline', value: 'OFFLINE' },
              ]}
            />
            <GenericDropdown
              label="Batch"
              name="batchId"
              control={editControl as any}
              options={batchOptions}
              placeholder="Select Batch"
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <GenericInputField label="College Name" name="collegeName" placeholder="Enter College Name" />
            </div>

            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
              <GenericButton
                type="submit"
                disabled={updateLeadMutation.isPending}
                className="rounded-lg bg-accent-teal px-4 md:px-8 py-2.5 font-medium text-white transition hover:bg-primary-navy disabled:opacity-60"
              >
                {updateLeadMutation.isPending ? 'Updating...' : 'Update Lead'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      )}

      {/* ── Follow-up table ───────────────────────────────── */}
      <FormProvider {...followUpMethods}>
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-text-charcoal">Follow-ups</h2>
          <div className="overflow-x-auto rounded-lg border border-stroke">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-primary-navy text-center">
                  <th className="min-w-[50px] px-3 py-2.5 text-sm font-semibold text-pure-white">Sr No.</th>
                  <th className="min-w-[150px] px-3 py-2.5 text-md font-semibold text-pure-white">Date</th>
                  <th className="min-w-[280px] px-3 py-2.5 text-md font-semibold text-pure-white">Note</th>
                  <th className="min-w-[220px] px-3 py-2.5 text-md font-semibold text-pure-white">Next Follow Up</th>
                  <th className="min-w-[180px] px-3 py-2.5 text-md font-semibold text-pure-white">Faculty</th>
                  <th className="min-w-[120px] px-3 py-2.5 text-md font-semibold text-pure-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const isSaved = savedRows.has(index);
                  const isSavedRow = field.isSaved || isSaved;

                  return (
                    <tr
                      key={field.id}
                      className={`border-b border-stroke transition-colors ${isSavedRow
                        ? 'bg-pure-white dark:bg-green-900/10'
                        : index % 2 === 0
                          ? 'bg-pure-white dark:bg-primary-navy/5'
                          : 'bg-slate-50/50 dark:bg-primary-navy/10'
                        }`}
                    >
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        {index + 1}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        {isSavedRow ? (
                          <span className="text-md">{field.date || '-'}</span>
                        ) : (
                          <DatePicker control={control} name={`lead.${index}.date`} />
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        {isSavedRow ? (
                          <span className="text-md">{field.note || '-'}</span>
                        ) : (
                          <GenericInputField
                            control={control}
                            name={`lead.${index}.note`}
                            placeholder="Enter note"
                            className="w-full"
                          />
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        {isSavedRow ? (
                          <div className="flex flex-col items-center justify-center ">
                            <span>{field.nextFollowUp || '-'}</span>
                            {formatTime(field.nextFollowUpTime)}
                          </div>
                        ) : (
                        <div className="flex items-center justify-center gap-1">
                          <DatePicker control={control} name={`lead.${index}.nextFollowUp`} />
                          <GenericInputField
                            control={control}
                            name={`lead.${index}.nextFollowUpTime`}
                            type="time"
                            className="w-24"
                          />
                        </div>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        <span className="text-md">
                          {isAdmin
                            ? (facultyOptions.find((f: any) => f.value === field.facultyId)?.label || field.facultyId || user?.fullname || 'Current User')
                            : (user?.fullname || 'Current User')}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-center dark:border-strokedark">
                        <div className="flex items-center justify-center gap-1">
                          {isSavedRow ? (
                            <span className="flex items-center gap-1 text-primary-navy">
                              {/* <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Saved</span> */}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => saveSingleFollowUp(index)}
                              disabled={savingRow === index}
                              className="rounded p-1 text-primary-navy transition hover:bg-green-50 hover:scale-110 disabled:opacity-50"
                              title="Save this row"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          )}

                          {index === fields.length - 1 && (
                            <button
                              type="button"
                              onClick={handleAppend}
                              className="rounded p-1 text-accent-teal transition hover:bg-accent-teal/10 hover:scale-110"
                              title="Add new row"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}

                          {!isSavedRow && fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSavedRows((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(index);
                                  return newSet;
                                });
                                remove(index);
                              }}
                              className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-5 md:py-8 text-center text-md text-slate-500">
                      No follow-up records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FormProvider>
    </div>
  );
};

export default FacultyLeadInfo;