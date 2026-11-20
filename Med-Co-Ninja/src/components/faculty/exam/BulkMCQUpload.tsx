import React, { useRef, useState } from 'react';
import {
  downloadMCQTemplate,
  parseMCQExcel,
  validateAndNormalizeMCQRows,
  MCQQuestion,
  MCQValidationResult,
  REQUIRED_COLUMNS,
} from './excelMCQUtils';
import { MCQExcelPreview } from './MCQExcelPreview';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

interface BulkMCQUploadProps {
  onQuestionsLoaded: (questions: MCQQuestion[]) => void;
  currentQuestions: MCQQuestion[];
  onClearQuestions: () => void;
  onPopulateManualForm?: (questions: MCQQuestion[]) => void;
}

export const BulkMCQUpload: React.FC<BulkMCQUploadProps> = ({
  onQuestionsLoaded,
  currentQuestions,
  onClearQuestions,
  onPopulateManualForm,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<MCQValidationResult | null>(null);

  const handleDownloadTemplate = () => {
    try {
      downloadMCQTemplate();
      toast.success('Excel template downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading template:', err);
      toast.error('Failed to download Excel template');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // reset input value so re-uploading the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      toast.error('Invalid file type! Please upload an .xlsx or .xls Excel file.');
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setValidationResult(null);

    try {
      const rawRows = await parseMCQExcel(file);
      const result = validateAndNormalizeMCQRows(rawRows);
      setValidationResult(result);

      if (result.errors.length === 0 && result.questions.length > 0) {
        toast.success(`Successfully parsed ${result.questions.length} questions!`);
        onQuestionsLoaded(result.questions);
      } else if (result.errors.length > 0) {
        toast.error(`Excel validation failed with ${result.errors.length} issue(s).`);
        onQuestionsLoaded([]);
      } else {
        toast.error('No valid questions found in the Excel file.');
        onQuestionsLoaded([]);
      }
    } catch (error: any) {
      console.error('Error parsing Excel:', error);
      toast.error(error?.message || 'Failed to process Excel file.');
      setValidationResult({
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        questions: [],
        errors: [
          {
            rowNumber: 1,
            questionIndex: 0,
            field: 'File Read',
            message: error?.message || 'Could not read file contents.',
          },
        ],
        warnings: [],
      });
      onQuestionsLoaded([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReupload = () => {
    setValidationResult(null);
    setFileName('');
    onClearQuestions();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemoveQuestion = (indexToRemove: number) => {
    const updated = currentQuestions.filter((_, idx) => idx !== indexToRemove);
    onQuestionsLoaded(updated);
    if (validationResult) {
      setValidationResult({
        ...validationResult,
        validCount: updated.length,
        questions: updated,
      });
    }
    toast.success('Question removed from preview');
  };

  // 1. Initial State or No File Uploaded Yet
  const hasValidQuestions = currentQuestions.length > 0;
  const hasErrors = validationResult && validationResult.errors.length > 0;

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Upload / Hero Card if no questions or errors */}
      {!hasValidQuestions && !hasErrors && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-pure-white p-4 md:p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-primary-navy mb-4">
            <FileSpreadsheet className="h-8 w-8" />
          </div>

          <h3 className="text-xl font-bold text-primary-navy">
            Bulk Import MCQs from Excel
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-xl mx-auto">
            Quickly import dozens or hundreds of multiple-choice questions at once using an Excel spreadsheet. Download our pre-formatted template, fill it out, and upload it here.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <GenericButton
              type="button"
              variant="cancel"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 border-primary-navy text-primary-navy hover:bg-blue-50/50 px-5 py-2.5 font-medium"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </GenericButton>

            <GenericButton
              type="button"
              variant="navy"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="flex items-center gap-2 px-6 py-2.5 font-semibold text-white shadow-md"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Parsing File...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload MCQs from Excel
                </>
              )}
            </GenericButton>
          </div>

          {/* Dropzone Box */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
              isDragOver
                ? 'border-primary-navy bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <p className="text-xs text-gray-500">
              or drag & drop your <span className="font-semibold text-gray-700">.xlsx</span> or{' '}
              <span className="font-semibold text-gray-700">.xls</span> file here
            </p>
          </div>

          {/* Guidelines accordion/checklist */}
          {/* <div className="mt-6 border-t border-gray-100 pt-5 text-left max-w-2xl mx-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Template Requirements:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Required columns: {REQUIRED_COLUMNS.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Correct Answer must be: A, B, C, or D</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Marks per question must be positive number</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Explanation is optional</span>
              </div>
            </div>
          </div> */}
        </div>
      )}

      {/* 2. Validation Failed View */}
      {hasErrors && (
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">
                  Excel Validation Failed
                </h3>
                <p className="text-xs text-red-600">
                  Please fix the following issue(s) in your spreadsheet and upload again.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GenericButton
                type="button"
                variant="cancel"
                onClick={handleDownloadTemplate}
                size="sm"
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Template
              </GenericButton>
              <GenericButton
                type="button"
                variant="navy"
                onClick={handleReupload}
                size="sm"
                className="text-xs text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Upload Revised Excel
              </GenericButton>
            </div>
          </div>

          {/* Validation Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <div className="text-xs text-gray-500 font-medium">Total Rows Checked</div>
              <div className="text-xl font-bold text-gray-800">
                {validationResult?.totalRows || 0}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-xs text-emerald-700 font-medium">Valid Questions</div>
              <div className="text-xl font-bold text-emerald-800">
                {validationResult?.validCount || 0}
              </div>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <div className="text-xs text-red-700 font-medium">Rows with Errors</div>
              <div className="text-xl font-bold text-red-800">
                {validationResult?.invalidCount || validationResult?.errors.length || 0}
              </div>
            </div>
          </div>

          {/* Detailed Error List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-800">
                Error Details ({validationResult?.errors.length}):
              </h4>
              <span className="text-xs text-gray-500">
                File: <span className="font-medium text-gray-700">{fileName}</span>
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-red-100 bg-red-50/30 p-3">
              {validationResult?.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-md bg-white p-3 border border-red-200 text-xs shadow-xs"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      Row {err.rowNumber}
                      {err.questionIndex > 0 && ` (Question #${err.questionIndex})`}
                      {' → '}
                      <span className="text-primary-navy font-bold">{err.field}</span>
                    </div>
                    <div className="text-red-700 mt-0.5">{err.message}</div>
                    {err.value !== undefined && (
                      <div className="text-gray-400 mt-0.5 text-[11px]">
                        Received value: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{String(err.value)}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Validation Succeeded & Preview Screen */}
      {hasValidQuestions && !hasErrors && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Excel File Validated Successfully
                </h4>
                <p className="text-xs text-emerald-700">
                  All {currentQuestions.length} questions are verified and ready for review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onPopulateManualForm && (
                <GenericButton
                  type="button"
                  variant="cancel"
                  size="sm"
                  onClick={() => onPopulateManualForm(currentQuestions)}
                  className="text-xs flex items-center gap-1.5"
                  title="Switch to manual editor with these questions loaded"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Edit in Manual Form
                </GenericButton>
              )}
              <GenericButton
                type="button"
                variant="cancel"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Template
              </GenericButton>
              <GenericButton
                type="button"
                variant="navy"
                size="sm"
                onClick={handleReupload}
                className="text-xs text-white"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload New File
              </GenericButton>
            </div>
          </div>

          {/* Full Interactive Preview */}
          <MCQExcelPreview
            questions={currentQuestions}
            warnings={validationResult?.warnings || []}
            onRemoveQuestion={handleRemoveQuestion}
            onReupload={handleReupload}
            fileName={fileName}
          />
        </div>
      )}
    </div>
  );
};
