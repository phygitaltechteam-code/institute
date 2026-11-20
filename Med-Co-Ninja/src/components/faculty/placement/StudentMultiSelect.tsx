import { useEffect, useState } from 'react';
import { StudentMultiSelectProps, StudentOption } from './types';

const StudentMultiSelect = ({
  options,
  isLoading,
  selectedBatchId,
  setValue,
}: StudentMultiSelectProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Sync selection into React Hook Form
  useEffect(() => {
    setValue('studentIds', selectedValues, { shouldValidate: true });
  }, [selectedValues, setValue]);

  // Reset when batch changes
  useEffect(() => {
    setSelectedValues([]);
    setValue('studentIds', [], { shouldValidate: true });
    setIsOpen(false);
  }, [selectedBatchId, setValue]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-multi-select')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStudent = (studentId: string) => {
    setSelectedValues((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const removeStudent = (studentId: string) => {
    setSelectedValues((prev) => prev.filter((id) => id !== studentId));
  };

  const getSelectedStudent = (studentId: string): StudentOption | undefined =>
    options.find((option) => option.value === studentId);

  return (
    <div className="student-multi-select mb-4">
      <label className="text-gray-700 mb-2 block text-sm font-medium">
        Select Students ({options.length} available)
      </label>

      <div className="relative">
        {/* Trigger */}
        <div
          className={`min-h-[42px] w-full cursor-pointer rounded-lg border px-3 py-2 text-sm ${
            options.length === 0
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 bg-white'
          }`}
          onClick={() => {
            if (options.length > 0) setIsOpen((prev) => !prev);
          }}
        >
          {selectedValues.length === 0 ? (
            <span className={options.length === 0 ? 'text-gray-400' : 'text-gray-500'}>
              {isLoading
                ? 'Loading students...'
                : options.length === 0
                  ? 'No students available in this batch'
                  : 'Select students...'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((studentId) => {
                const student = getSelectedStudent(studentId);
                return (
                  <span
                    key={studentId}
                    className="bg-primary-navy/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-primary-navy"
                  >
                    {student?.label}
                    <button
                      type="button"
                      className="ml-1 font-bold hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStudent(studentId);
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Dropdown list */}
        {isOpen && options.length > 0 && (
          <div className="border-gray-200 absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
            {options.map((option) => (
              <label
                key={option.value}
                className="hover:bg-gray-50 flex cursor-pointer items-center gap-2 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleStudent(option.value)}
                  className="h-4 w-4"
                />
                <span className="text-gray-700 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedValues.length > 0 && (
        <p className="text-gray-500 mt-1 text-xs">
          {selectedValues.length} student{selectedValues.length > 1 ? 's' : ''} selected
        </p>
      )}

      {!selectedBatchId && (
        <p className="mt-1 text-xs text-amber-600">
          Please select a batch to see available students
        </p>
      )}
    </div>
  );
};

export default StudentMultiSelect;
