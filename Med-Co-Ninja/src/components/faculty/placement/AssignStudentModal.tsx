import { useState } from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import { IoClose } from 'react-icons/io5';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { AssignmentFormValues, StudentOption } from './types';

interface StudentRow {
  id: string;
  name: string;
  attendance: string | number;
  totalExams: string | number;
  finalExam: string | number;
  placementForm: string;
  internship: string;
  pendingFees: string | number;
  followUpDate: string;
  interviewsGiven: string | number;
  placementReceived: string;
  referrals: string | number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  methods: UseFormReturn<AssignmentFormValues>;
  onSubmit: (data: AssignmentFormValues) => void;
  courseOptions: StudentOption[];
  batchOptions: StudentOption[];
  studentOptions: StudentOption[];
  studentTableData: StudentRow[];
  isCoursesLoading: boolean;
  isBatchLoading: boolean;
  isStudentsLoading: boolean;
  selectedCourseId: string;
  selectedBatchId: string;
  isAssigning: boolean;
}

const COLUMNS = [
  { key: 'name',             label: 'Name' },
  { key: 'attendance',       label: 'Attendance' },
  { key: 'totalExams',       label: 'Total Exams' },
  { key: 'finalExam',        label: 'Final Exam' },
  { key: 'placementForm',    label: 'Placement Form' },
  { key: 'internship',       label: 'Internship' },
  { key: 'pendingFees',      label: 'Pending Fees' },
  { key: 'followUpDate',     label: 'Follow Up Date' },
  { key: 'interviewsGiven',  label: 'Interviews Given' },
  { key: 'placementReceived',label: 'Placement Received' },
  { key: 'referrals',        label: 'Referrals' },
];

const AssignStudentModal = ({
  open,
  onClose,
  methods,
  onSubmit,
  courseOptions,
  batchOptions,
  studentOptions,
  studentTableData,
  isCoursesLoading,
  isBatchLoading,
  isStudentsLoading,
  selectedCourseId,
  selectedBatchId,
  isAssigning,
}: Props) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const { handleSubmit, setValue, control, watch } = methods;
  const watchMode = watch('interviewMode');

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // sync with react-hook-form
      setValue('studentIds', Array.from(next));
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === studentTableData.length) {
      setSelectedIds(new Set());
      setValue('studentIds', []);
    } else {
      const allIds = studentTableData.map((s) => String(s.id));
      setSelectedIds(new Set(allIds));
      setValue('studentIds', allIds);
    }
  };

  const allSelected =
    studentTableData.length > 0 && selectedIds.size === studentTableData.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {/* Modal — wider + taller to fit the table */}
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <h2 className="text-xl font-bold text-primary-navy">
            Assign Students to Placement
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-red-500"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Top filters row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 border-b px-6 py-4">
                <GenericDropdown
                  label="Course"
                  name="courseId"
                  control={control as any}
                  options={courseOptions}
                  defaultOption={isCoursesLoading ? 'Loading courses...' : 'Select Course'}
                  isLoading={isCoursesLoading}
                />

                <GenericDropdown
                  label="Batch"
                  name="batchId"
                  control={control as any}
                  options={batchOptions}
                  defaultOption={selectedCourseId ? 'Select Batch' : 'Select a course first'}
                  isLoading={isBatchLoading}
                  disabled={!selectedCourseId}
                />

                <GenericDropdown
                  label="Interview Mode *"
                  name="interviewMode"
                  control={control as any}
                  options={[
                    { label: 'Online', value: 'ONLINE' },
                    { label: 'Offline', value: 'OFFLINE' },
                  ]}
                  defaultOption="Select Mode"
                  required
                />

                <GenericInputField
                  label="Interview Date *"
                  type="date"
                  name="interviewDate"
                  required
                />

                <GenericInputField
                  label="Interview Time *"
                  type="time"
                  name="interviewTime"
                  required
                />

                {watchMode === 'OFFLINE' && (
                  <GenericInputField
                    label="Interview Location *"
                    name="interviewLocation"
                    required
                  />
                )}
              </div>

              {/* Student table */}
              <div className="flex-1 overflow-auto px-2 py-2">
                {!selectedBatchId ? (
                  <p className="py-6 md:py-10 text-center text-sm text-gray-400">
                    Select a course and batch to see students.
                  </p>
                ) : isStudentsLoading ? (
                  <p className="py-6 md:py-10 text-center text-sm text-gray-400">Loading students…</p>
                ) : studentTableData.length === 0 ? (
                  <p className="py-6 md:py-10 text-center text-sm text-gray-400">
                    No students found in this batch.
                  </p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        {selectedIds.size} of {studentTableData.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-sm font-medium text-primary-navy hover:underline"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="sticky top-0 bg-primary-navy text-white">
                          <tr>
                            {/* Checkbox header */}
                            <th className="w-10 px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleAll}
                                className="h-4 w-4 cursor-pointer accent-accent-teal"
                              />
                            </th>
                            {COLUMNS.map((col) => (
                              <th
                                key={col.key}
                                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 bg-white">
                          {studentTableData.map((student) => {
                            const id = String(student.id);
                            const isChecked = selectedIds.has(id);
                            return (
                              <tr
                                key={id}
                                onClick={() => toggleStudent(id)}
                                className={`cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-primary-navy/5'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleStudent(id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4 cursor-pointer accent-accent-teal"
                                  />
                                </td>
                                {COLUMNS.map((col) => (
                                  <td
                                    key={col.key}
                                    className="whitespace-nowrap px-4 py-2.5 text-gray-700"
                                  >
                                    {String((student as any)[col.key] ?? '-')}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer ───────────────────────────────────────────────── */}
              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                <GenericButton type="button" onClick={onClose} variant="cancel" className="px-6 py-2">
                  Cancel
                </GenericButton>
                <GenericButton
                  type="submit"
                  variant="navy"
                  className="px-7 py-2"
                  disabled={isAssigning || !selectedBatchId || selectedIds.size === 0}
                >
                  {isAssigning
                    ? 'Assigning...'
                    : `Assign Students${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentModal;
