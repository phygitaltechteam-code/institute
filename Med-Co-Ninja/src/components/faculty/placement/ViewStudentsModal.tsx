import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { Users, X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  students: Student[];
  isLoading: boolean;
  isError: boolean;
}

const ViewStudentsModal = ({ open, onClose, students, isLoading, isError }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-primary-navy/50 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-pure-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 bg-primary-navy px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-pure-white">
            <Users className="h-4 w-4 text-accent-teal" />
            Assigned Students
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-gray-500">Loading students...</div>
          ) : isError ? (
            <div className="py-4 text-center text-sm text-red-500">Failed to fetch assigned students</div>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Students:{' '}
                <span className="rounded-full bg-accent-teal/10 px-2 py-0.5 text-accent-teal">{students.length}</span>
              </p>

              {students.length > 0 ? (
                <ul className="divide-y divide-stroke rounded-lg border border-stroke">
                  {students.map((student, index) => {
                    const firstLetter = student.name?.trim()?.charAt(0)?.toUpperCase() || 'S';
                    return (
                      <li
                        key={student.id || index}
                        className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-bg-light-mint"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-navy text-xs font-semibold text-pure-white">
                          {firstLetter}
                        </div>
                        <span className="truncate text-sm font-medium text-text-charcoal">{student.name}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">No students assigned yet</div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-stroke bg-gray-50 px-4 py-3">
          <GenericButton type="button" variant="navy" className="px-6" onClick={onClose}>
            Close
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentsModal;
