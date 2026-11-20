import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { CalendarClock, X } from 'lucide-react';
import { InterestedStudent } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  interestedStudents: InterestedStudent[];
  selectedStudentIds: string[];
  interviewMode: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onToggleStudent: (id: string) => void;
  onSelectAll: () => void;
  onRemoveStudent: (id: string) => void;
  onModeChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSave: () => void;
}

const InterviewScheduleModal = ({
  open,
  onClose,
  interestedStudents,
  selectedStudentIds,
  interviewMode,
  interviewDate,
  interviewTime,
  interviewLocation,
  isDropdownOpen,
  onToggleDropdown,
  onToggleStudent,
  onSelectAll,
  onRemoveStudent,
  onModeChange,
  onDateChange,
  onTimeChange,
  onLocationChange,
  onSave,
}: Props) => {
  if (!open) return null;

  const getStudentName = (studentId: string) =>
    interestedStudents.find((s) => s.id === studentId)?.name || 'Unknown';

  const isSaveDisabled =
    selectedStudentIds.length === 0 ||
    !interviewMode ||
    !interviewDate ||
    !interviewTime ||
    (interviewMode === 'OFFLINE' && !interviewLocation);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-primary-navy/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-pure-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 bg-primary-navy px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-pure-white">
            <CalendarClock className="h-4 w-4 text-accent-teal" />
            Interested Students
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Student multi-select dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Students <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* Trigger */}
              <div
                className="min-h-[40px] w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition hover:border-primary-navy"
                onClick={onToggleDropdown}
              >
                {selectedStudentIds.length === 0 ? (
                  <span className="text-gray-500">Select students...</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedStudentIds.map((studentId) => (
                      <span
                        key={studentId}
                        className="bg-primary-navy/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-primary-navy"
                      >
                        {getStudentName(studentId)}
                        <button
                          type="button"
                          className="ml-1 font-bold hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveStudent(studentId);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown list */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {/* Select All */}
                  <label className="hover:bg-gray-50 flex cursor-pointer items-center gap-2 border-b px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudentIds.length === interestedStudents.length &&
                        interestedStudents.length > 0
                      }
                      onChange={onSelectAll}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                    <span className="ml-auto text-xs text-gray-400">
                      ({selectedStudentIds.length}/{interestedStudents.length})
                    </span>
                  </label>

                  {interestedStudents.map((student) => (
                    <label
                      key={student.id}
                      className="hover:bg-gray-50 flex cursor-pointer items-center gap-2 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => onToggleStudent(student.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{student.name}</span>
                    </label>
                  ))}

                  {interestedStudents.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      No students available
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Interview Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={interviewMode}
              onChange={(e) => onModeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-navy focus:outline-none"
            >
              <option value="">Select Mode</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          {/* Date & Time — both modes */}
          {(interviewMode === 'ONLINE' || interviewMode === 'OFFLINE') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-navy focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-navy focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Location — offline only */}
          {interviewMode === 'OFFLINE' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter interview location"
                value={interviewLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-navy focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Actions — fixed footer, buttons share the row on phones */}
        <div className="flex gap-2 border-t border-stroke bg-gray-50 px-4 py-3 sm:justify-end sm:gap-3">
          <GenericButton type="button" variant="cancel" className="flex-1 sm:flex-none sm:px-6" onClick={onClose}>
            Cancel
          </GenericButton>
          <GenericButton
            type="button"
            variant="navy"
            className="flex-1 sm:flex-none sm:px-6"
            onClick={onSave}
            disabled={isSaveDisabled}
          >
            Save Interview
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;
