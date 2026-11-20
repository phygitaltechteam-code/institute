import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import GenericInputField from '../../Forms/Input/GenericInputField';
import GenericButton from '../../Forms/Buttons/GenericButton';
import GenericDropdown from '../../Forms/DropDown/GenericDropDown';
import { useCreateExamMutation } from '@/lib/react-query/queriesAndMutations/examMutations';
import { useNavigate } from '@tanstack/react-router';
import { useGetCourses } from '@/mutations/courseMutation';
import { useAuthContext } from '@/context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import { X, FileSpreadsheet, FileText, RotateCcw } from 'lucide-react';
import { useGetSubject } from '@/mutations/subjectMutation';
import { BulkMCQUpload } from './BulkMCQUpload';
import { MCQQuestion, calculateTotalMarks } from './excelMCQUtils';
import toast from 'react-hot-toast';

interface ExamFormProps {
  batchId?: string;
}

const LOCAL_STORAGE_KEY = 'exam_question_draft';

const ExamForm = ({ batchId }: ExamFormProps) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();
  const createExamMutation = useCreateExamMutation();

  // Mode: manual creation vs Excel bulk import
  const [creationMode, setCreationMode] = useState<'manual' | 'excel'>('manual');
  // State for parsed & verified Excel questions
  const [excelQuestions, setExcelQuestions] = useState<MCQQuestion[]>([]);

  // Draft recovery states
  const [savedDraft, setSavedDraft] = useState<any | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(false);
  const isRestoringRef = useRef<boolean>(false);

  // Fetch courses and subjects
  const { data: coursesData, isLoading: coursesLoading } = useGetCourses(role);
  const { data: subjectsData, isLoading: subjectsLoading } = useGetSubject(role);

  const subjectOptions =
    subjectsData?.data?.map((subject: any) => ({
      label: subject.name,
      value: subject.id,
    })) || [];

  const courseOptions =
    coursesData?.data?.data?.map((course: any) => ({
      label: course.name,
      value: course.id,
    })) || [];

  const typeOptions = [
    { label: 'Regular', value: 'REGULAR' },
    { label: 'Final Exam', value: 'FINAL' },
  ];

  const QuestionSchema = z.object({
    question: z.string().min(5, 'Question must be at least 5 characters'),
    optionA: z.string().min(1, 'Option A is required'),
    optionB: z.string().min(1, 'Option B is required'),
    optionC: z.string().min(1, 'Option C is required'),
    optionD: z.string().min(1, 'Option D is required'),
    marks: z.coerce.number().min(1, 'Marks per question must be at least 1'),
    answer: z.string().min(1, 'Correct answer is required'),
    explanation: z.string().optional(),
  });

  const ExamFormSchema = z.object({
    name: z.string().min(3, 'Exam name is required'),
    title: z.string().min(1, 'Title is required'),
    type: z.string().min(1, 'Exam type is required'),
    subject: z.string().min(1, 'Subject is required'),
    courseId: z.string().optional(),
    marks: z.coerce.number().min(1, 'Total marks is required'),
    minutes: z.coerce.number().min(1, 'Duration in minutes is required'),
    questions: z.array(QuestionSchema).min(1, 'At least one question is required'),
  });

  type ExamFormValues = z.infer<typeof ExamFormSchema>;

  const defaultQuestion = {
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    marks: 0,
    answer: '',
    explanation: '',
  };

  const methods = useForm<ExamFormValues>({
    resolver: zodResolver(ExamFormSchema),
    defaultValues: {
      name: '',
      title: '',
      type: '',
      subject: '',
      courseId: '',
      marks: 0,
      minutes: 0,
      questions: [defaultQuestion],
    },
  });

  const { handleSubmit, control, setValue, reset, watch, trigger, getValues } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  // Check for unsaved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.formData || (parsed.excelQuestions && parsed.excelQuestions.length > 0))) {
          setSavedDraft(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch (e) {
      console.error('Failed to parse saved exam draft:', e);
    }
  }, []);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (!savedDraft) return;
    try {
      isRestoringRef.current = true;
      if (savedDraft.formData) {
        reset(savedDraft.formData);
      }
      if (savedDraft.excelQuestions && Array.isArray(savedDraft.excelQuestions)) {
        setExcelQuestions(savedDraft.excelQuestions);
      }
      if (savedDraft.creationMode) {
        setCreationMode(savedDraft.creationMode);
      }
      setShowDraftBanner(false);
      toast.success('Draft restored successfully!');
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 500);
    } catch (err) {
      console.error('Error restoring draft:', err);
      toast.error('Failed to restore draft');
      isRestoringRef.current = false;
    }
  };

  // Discard draft handler
  const handleDiscardDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
    toast.success('Unsaved draft discarded');
  };

  // Debounced auto-save to localStorage
  useEffect(() => {
    const subscription = watch((currentValues) => {
      if (isRestoringRef.current) return;

      const hasName = Boolean(currentValues.name?.trim());
      const hasTitle = Boolean(currentValues.title?.trim());
      const hasQuestions = currentValues.questions?.some(
        (q) => q?.question?.trim() || q?.optionA?.trim()
      );

      if (hasName || hasTitle || hasQuestions || excelQuestions.length > 0) {
        const timeoutId = setTimeout(() => {
          try {
            const draft = {
              timestamp: new Date().toISOString(),
              creationMode,
              formData: currentValues,
              excelQuestions,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
          } catch (e) {
            console.error('Failed to auto-save exam draft:', e);
          }
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, creationMode, excelQuestions]);

  // When Excel questions are loaded and validated
  const handleExcelQuestionsLoaded = (questions: MCQQuestion[]) => {
    setExcelQuestions(questions);

    if (questions.length > 0) {
      // Sync into React Hook Form's questions array so form validation & submission remain unified
      const formQuestions = questions.map((q) => ({
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        marks: Number(q.marks),
        answer: q.answer,
        explanation: q.explanation || '',
      }));

      setValue('questions', formQuestions, { shouldValidate: true });

      // Auto-calculate & set total marks
      const calculatedMarks = calculateTotalMarks(questions);
      setValue('marks', calculatedMarks, { shouldValidate: true });
    }
  };

  // When admin wants to load Excel questions into the manual editor
  const handlePopulateManualForm = (questions: MCQQuestion[]) => {
    const formQuestions = questions.map((q) => ({
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      marks: Number(q.marks),
      answer: q.answer,
      explanation: q.explanation || '',
    }));

    setValue('questions', formQuestions, { shouldValidate: true });
    setCreationMode('manual');
    toast.success('Questions loaded into Manual Editor');
  };

  // Clear Excel questions
  const handleClearExcelQuestions = () => {
    setExcelQuestions([]);
    // Restore default blank question in form if in excel mode
    if (creationMode === 'excel') {
      setValue('questions', [defaultQuestion]);
    }
  };

  // Form submission (unified for both manual and Excel imports)
  const onSubmit = (data: ExamFormValues) => {
    // If in Excel mode, verify we actually have loaded questions
    if (creationMode === 'excel' && excelQuestions.length === 0) {
      toast.error('Please upload and validate an Excel file before submitting.');
      return;
    }

    const examData = {
      name: data.name,
      title: data.title,
      type: data.type,
      subject: data.subject,
      marks: Number(data.marks),
      minutes: Number(data.minutes),
      questions: data.questions.map((q) => ({
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        marks: Number(q.marks),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      })),
    };

    createExamMutation.mutate(
      { data: examData as any, batchId: batchId || '', role: role || '' },
      {
        onSuccess: () => {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          sessionStorage.setItem('batch-activeGroup', '1');
          sessionStorage.setItem('batch-activeSub', '1');
          if (role === 'ADMIN') {
            navigate({ to: '/admin/exams-table' });
          } else {
            navigate({ to: '/faculty/exam-table' });
          }
        },
      }
    );
  };

  const backPath = role === 'ADMIN' ? '/admin/exams-table' : '/faculty/exam-table';

  // Options for answer dropdown
  const answerOptions = [
    { label: 'Option A', value: 'optionA' },
    { label: 'Option B', value: 'optionB' },
    { label: 'Option C', value: 'optionC' },
    { label: 'Option D', value: 'optionD' },
  ];

  return (
    <div className="mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      {/* Header with Back Button and Title */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <GenericButton
            onClick={() => navigate({ to: backPath })}
            variant="navy"
            aria-label="Go back"
          >
            <span> ← Back</span>
          </GenericButton>
          <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
            Exam Creation
          </h1>
        </div>
      </div>

      {/* Feature 10: Unsaved Draft Recovery Banner */}
      {showDraftBanner && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-primary-navy shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-primary-navy">
                Unsaved Draft Found
              </div>
              <div className="text-xs text-blue-700">
                You have an unsaved exam draft from a previous session
                {savedDraft?.timestamp &&
                  ` (${new Date(savedDraft.timestamp).toLocaleDateString()} ${new Date(
                    savedDraft.timestamp
                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                . Would you like to restore it?
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <GenericButton
              type="button"
              variant="cancel"
              size="sm"
              onClick={handleDiscardDraft}
              className="text-xs"
            >
              Discard Draft
            </GenericButton>
            <GenericButton
              type="button"
              variant="navy"
              size="sm"
              onClick={handleRestoreDraft}
              className="text-xs text-white"
            >
              Restore Draft
            </GenericButton>
          </div>
        </div>
      )}

      {/* Main Form Area */}
      <div>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
            {/* Exam Details Card */}
            <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-3 shadow-md sm:p-4 md:p-5">
              <h2 className="mb-3 text-base font-semibold text-primary-navy md:text-lg">
                Exam Details
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <GenericInputField
                  name="name"
                  label="Topic / Exam Name"
                  placeholder="e.g. JavaScript Fundamentals"
                />
                <GenericInputField
                  name="title"
                  label="Title"
                  placeholder="e.g. Mid-term Assessment"
                />
                <GenericDropdown
                  name="type"
                  label="Exam Type"
                  control={control}
                  options={typeOptions}
                  placeholder="Select Exam Type"
                  required
                />

                <GenericDropdown
                  name="subject"
                  label="Subject"
                  control={control}
                  options={subjectOptions}
                  isLoading={subjectsLoading}
                  placeholder={subjectsLoading ? 'Loading subjects...' : 'Select Subject'}
                  required
                />

                <GenericInputField
                  name="marks"
                  label="Total Marks"
                  type="number"
                  placeholder="Enter total marks"
                />

                <GenericInputField
                  name="minutes"
                  label="Duration (Minutes)"
                  type="number"
                  placeholder="e.g. 60"
                />
              </div>
            </div>

            {/* Question Creation Method: two selectable cards */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                How do you want to add questions?
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setCreationMode('manual')}
                  aria-pressed={creationMode === 'manual'}
                  className={`relative flex items-start gap-2 rounded-xl border-2 bg-pure-white p-2.5 text-left transition-all sm:gap-3 sm:p-3 ${
                    creationMode === 'manual'
                      ? 'border-primary-navy shadow-md ring-2 ring-primary-navy/10'
                      : 'border-gray-200 hover:border-primary-navy/40'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${
                      creationMode === 'manual' ? 'bg-primary-navy text-white' : 'bg-gray-100 text-primary-navy'
                    }`}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-primary-navy">
                      Manual
                      {fields.length > 0 && (
                        <span className="rounded-full bg-primary-navy/10 px-1.5 py-0.5 text-[10px] text-primary-navy">
                          {fields.length}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                      Type each question and its options one by one.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMode('excel')}
                  aria-pressed={creationMode === 'excel'}
                  className={`relative flex items-start gap-2 rounded-xl border-2 bg-pure-white p-2.5 text-left transition-all sm:gap-3 sm:p-3 ${
                    creationMode === 'excel'
                      ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/10'
                      : 'border-gray-200 hover:border-emerald-600/40'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${
                      creationMode === 'excel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-primary-navy">
                      <span className="sm:hidden">Bulk Excel</span>
                      <span className="hidden sm:inline">Bulk Import (Excel)</span>
                      {excelQuestions.length > 0 && (
                        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {excelQuestions.length}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                      Upload an Excel sheet to add many questions at once.
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Mode 1: Manual Creation Flow */}
            {creationMode === 'manual' && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    Questions ({fields.length})
                  </h3>
                  <GenericButton
                    type="button"
                    onClick={() => append(defaultQuestion)}
                    variant="navy"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs text-white"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                    Add Question
                  </GenericButton>
                </div>

                {/* One compact row per question: Question | A | B | C | D | Answer | Marks (explanation below) */}
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border-l-4 border-primary-navy bg-pure-white p-2.5 shadow-sm transition-all sm:p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-navy text-xs font-bold text-white"
                          title={`Question ${index + 1}`}
                        >
                          {index + 1}
                        </span>

                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_minmax(0,1.2fr)_72px]">
                          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                            <GenericInputField
                              name={`questions.${index}.question`}
                              label="Question"
                              placeholder="Enter the question"
                            />
                          </div>
                          <GenericInputField name={`questions.${index}.optionA`} label="Option A" placeholder="Option A" />
                          <GenericInputField name={`questions.${index}.optionB`} label="Option B" placeholder="Option B" />
                          <GenericInputField name={`questions.${index}.optionC`} label="Option C" placeholder="Option C" />
                          <GenericInputField name={`questions.${index}.optionD`} label="Option D" placeholder="Option D" />
                          <div className="sm:col-span-2 lg:col-span-1">
                            <GenericDropdown
                              name={`questions.${index}.answer`}
                              label="Answer"
                              control={control}
                              options={answerOptions}
                              placeholder="Select"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-1">
                            <GenericInputField
                              name={`questions.${index}.marks`}
                              label="Marks"
                              type="number"
                              placeholder="1"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-4 lg:col-span-7">
                            <GenericInputField
                              name={`questions.${index}.explanation`}
                              label="Explanation (Optional)"
                              placeholder="Add explanation for the answer"
                            />
                          </div>
                        </div>

                        {fields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            title="Delete question"
                            className="mt-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-300 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="w-7 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Question Button at the Bottom */}
                <div className="flex justify-center pt-2">
                  <GenericButton
                    type="button"
                    onClick={() => append(defaultQuestion)}
                    variant="navy"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-pure-white"
                  >
                    <FaPlus className="h-4 w-4" />
                    Add Another Question
                  </GenericButton>
                </div>
              </div>
            )}

            {/* Mode 2: Bulk Import Excel Flow */}
            {creationMode === 'excel' && (
              <BulkMCQUpload
                currentQuestions={excelQuestions}
                onQuestionsLoaded={handleExcelQuestionsLoaded}
                onClearQuestions={handleClearExcelQuestions}
                onPopulateManualForm={handlePopulateManualForm}
              />
            )}

            {/* Bottom Actions: Cancel & Create Exam */}
            <div className="sticky bottom-0 z-20 -mx-3 flex items-center justify-between border-t border-stroke bg-pure-white/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 dark:border-strokedark">
              <GenericButton
                type="button"
                onClick={() => navigate({ to: backPath })}
                variant="cancel"
                className="px-6 py-2"
              >
                Cancel
              </GenericButton>

              <div className="flex items-center gap-3">
                {creationMode === 'excel' && excelQuestions.length > 0 && (
                  <span className="hidden sm:inline text-xs text-gray-500 font-medium">
                    Ready to submit {excelQuestions.length} question(s)
                  </span>
                )}
                <GenericButton
                  type="submit"
                  variant="navy"
                  className="px-4 md:px-8 py-2.5 text-base font-semibold shadow-md"
                  disabled={
                    createExamMutation.isPending ||
                    (creationMode === 'excel' && excelQuestions.length === 0)
                  }
                >
                  {createExamMutation.isPending
                    ? 'Creating Exam...'
                    : creationMode === 'excel'
                    ? 'Confirm & Create Exam'
                    : 'Create Exam'}
                </GenericButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ExamForm;