import React, { useState, useMemo } from 'react';
import { MCQQuestion, MCQValidationWarning } from './excelMCQUtils';
import {
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface MCQExcelPreviewProps {
  questions: MCQQuestion[];
  warnings: MCQValidationWarning[];
  onRemoveQuestion?: (index: number) => void;
  onReupload: () => void;
  fileName?: string;
}

export const MCQExcelPreview: React.FC<MCQExcelPreviewProps> = ({
  questions,
  warnings,
  onRemoveQuestion,
  onReupload,
  fileName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  }, [questions]);

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions.map((q, idx) => ({ ...q, originalIndex: idx }));
    const term = searchTerm.toLowerCase();
    return questions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter(
        (q) =>
          q.question.toLowerCase().includes(term) ||
          q.optionA.toLowerCase().includes(term) ||
          q.optionB.toLowerCase().includes(term) ||
          q.optionC.toLowerCase().includes(term) ||
          q.optionD.toLowerCase().includes(term) ||
          (q.explanation && q.explanation.toLowerCase().includes(term))
      );
  }, [questions, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* File & Metric Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Questions
            </div>
            <div className="text-2xl font-bold text-gray-800">{questions.length}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-primary-navy">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Calculated Marks
            </div>
            <div className="text-2xl font-bold text-gray-800">{totalMarks}</div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="truncate">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Imported File
            </div>
            <div className="truncate text-sm font-semibold text-gray-800" title={fileName}>
              {fileName || 'mcq_questions.xlsx'}
            </div>
          </div>
          <GenericButton
            type="button"
            variant="cancel"
            size="sm"
            onClick={onReupload}
            className="text-xs shrink-0"
          >
            Change File
          </GenericButton>
        </div>
      </div>

      {/* Warnings Banner (e.g. Duplicate Questions) */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-900">
              <span className="font-semibold">Notice: Potential duplicate questions found ({warnings.length}):</span>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs text-amber-800 max-h-32 overflow-y-auto">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w.message}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-amber-700 italic">
                You can review the questions below and continue, or re-upload a revised file.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search questions or options..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-navy"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="text-xs text-gray-600">
            Showing{' '}
            <span className="font-semibold">
              {filteredQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>
            -
            <span className="font-semibold">
              {Math.min(currentPage * pageSize, filteredQuestions.length)}
            </span>{' '}
            of <span className="font-semibold">{filteredQuestions.length}</span>
          </div>
        </div>
      </div>

      {/* Questions Preview Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs text-gray-700">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-2 py-2 w-12 text-center">#</th>
              <th scope="col" className="px-4 py-3 min-w-[220px]">Question</th>
              <th scope="col" className="px-2 py-2 min-w-[130px]">Option A</th>
              <th scope="col" className="px-2 py-2 min-w-[130px]">Option B</th>
              <th scope="col" className="px-2 py-2 min-w-[130px]">Option C</th>
              <th scope="col" className="px-2 py-2 min-w-[130px]">Option D</th>
              <th scope="col" className="px-2 py-2 w-16 text-center">Marks</th>
              <th scope="col" className="px-2 py-2 w-20 text-center">Answer</th>
              <th scope="col" className="px-4 py-3 min-w-[160px]">Explanation</th>
              {onRemoveQuestion && <th scope="col" className="px-2 py-2 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedQuestions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-5 md:py-8 text-center text-sm text-gray-500">
                  {searchTerm ? 'No questions match your search.' : 'No questions loaded.'}
                </td>
              </tr>
            ) : (
              paginatedQuestions.map((q) => {
                const qNum = q.originalIndex + 1;
                return (
                  <tr key={q.originalIndex} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-2 py-2 font-semibold text-center text-gray-500">
                      {qNum}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 leading-snug">
                      {q.question}
                    </td>
                    <td
                      className={`px-2 py-2 ${
                        q.correctAnswerLetter === 'A'
                          ? 'font-bold text-emerald-700 bg-emerald-50/50 rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold text-gray-400 mr-1">A:</span>
                      {q.optionA}
                    </td>
                    <td
                      className={`px-2 py-2 ${
                        q.correctAnswerLetter === 'B'
                          ? 'font-bold text-emerald-700 bg-emerald-50/50 rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold text-gray-400 mr-1">B:</span>
                      {q.optionB}
                    </td>
                    <td
                      className={`px-2 py-2 ${
                        q.correctAnswerLetter === 'C'
                          ? 'font-bold text-emerald-700 bg-emerald-50/50 rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold text-gray-400 mr-1">C:</span>
                      {q.optionC}
                    </td>
                    <td
                      className={`px-2 py-2 ${
                        q.correctAnswerLetter === 'D'
                          ? 'font-bold text-emerald-700  rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold text-gray-400 mr-1">D:</span>
                      {q.optionD}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-primary-navy">
                      {q.marks}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold text-emerald-800 ">
                        Option {q.correctAnswerLetter}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate" title={q.explanation || ''}>
                      {q.explanation || <span className="text-gray-300">—</span>}
                    </td>
                    {onRemoveQuestion && (
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveQuestion(q.originalIndex)}
                          title="Remove this question"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center justify-center h-8 w-8 rounded border border-gray-300 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage - 2 + i;
              if (pageNum < 1) pageNum = i + 1;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-8 w-8 rounded text-xs font-semibold ${
                    currentPage === pageNum
                      ? 'bg-primary-navy text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center justify-center h-8 w-8 rounded border border-gray-300 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
