import { z } from 'zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import GenericInputField from '../../Forms/Input/GenericInputField';
import GenericButton from '../../Forms/Buttons/GenericButton';
import GenericDropdown from '../../Forms/DropDown/GenericDropDown';
import {
  useUpdateExamMutation,
  useGetExamById,
} from '@/lib/react-query/queriesAndMutations/examMutations';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { X } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useGetCourses } from '@/mutations/courseMutation';
import { useGetSubject } from '@/mutations/subjectMutation';

interface UpdateExamFormProps {
  batchId?: string;
}

const UpdateExamForm = ({ batchId }: UpdateExamFormProps) => {
  const { id } = useParams({ strict: false }) as any;
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;
  const updateExamMutation = useUpdateExamMutation();

  // Fetch exam data by ID
  const {
    data: examData,
    isLoading: examLoading,
    isError: examError,
  } = useGetExamById(id, role);

  // Fetch subjects for dropdown
  const { data: subjectsData, isLoading: subjectsLoading } = useGetSubject(role);

  const subjectOptions =
    subjectsData?.data?.map((subject: any) => ({
      label: subject.name,
      value: subject.id,
    })) || [];

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCourses(role);

  // Transform courses data for dropdown
  const courseOptions =
    coursesData?.data?.data?.map((course: any) => ({
      label: course.name,
      value: course.id,
    })) || [];

  // Exam Type options
  const typeOptions = [
    { label: 'Regular', value: 'REGULAR' },
    { label: 'Final Exam', value: 'FINAL' },
  ];

  const QuestionSchema = z.object({
    question: z.string().min(5, 'Question is required'),
    optionA: z.string().min(1, 'Option A is required'),
    optionB: z.string().min(1, 'Option B is required'),
    optionC: z.string().min(1, 'Option C is required'),
    optionD: z.string().min(1, 'Option D is required'),
    marks: z.coerce.number().min(1, 'Marks per question is required'),
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
    questions: z
      .array(QuestionSchema)
      .min(1, 'At least one question is required'),
  });

  type ExamFormValues = z.infer<typeof ExamFormSchema>;

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
      questions: [
        {
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          answer: '',
          marks: 0,
          explanation: '',
        },
      ],
    },
  });

  const { handleSubmit, control, reset } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  // Populate form with exam data when fetched
  useEffect(() => {
    if (examData) {
      const exam = examData?.data?.exam || examData?.data || examData;
      console.log('Populating form with exam data:', exam);

      const formattedQuestions =
        exam.examQuestions?.map((q: any) => ({
          question: q.question || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          answer: q.answer || '',
          marks: q.marks || 0,
          explanation: q.explanation || '',
        })) || [];

      if (formattedQuestions.length === 0) {
        formattedQuestions.push({
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          answer: '',
          marks: 0,
          explanation: '',
        });
      }

      // Resolve subject ID (could be ID, subject object, or subject name)
      const rawSubject =
        exam.subjectId ||
        exam.subjectt?.id ||
        exam.subject?.id ||
        (typeof exam.subject === 'string' ? exam.subject : '');

      let matchedSubject = rawSubject;
      if (subjectsData?.data && rawSubject) {
        const found = subjectsData.data.find(
          (s: any) =>
            s.id === rawSubject ||
            s.name?.trim().toLowerCase() === String(rawSubject).trim().toLowerCase()
        );
        if (found) {
          matchedSubject = found.id;
        }
      }

      reset({
        name: exam.name || '',
        title: exam.title || '',
        type: exam.type || '',
        subject: matchedSubject || '',
        courseId: exam.courseId || '',
        marks: exam.marks || 0,
        minutes: exam.minutes || 0,
        questions: formattedQuestions,
      });
    }
  }, [examData, subjectsData, reset]);

  const backPath = role === 'ADMIN' ? '/admin/exams-table' : '/faculty/exam-table';

  const onSubmit = (data: ExamFormValues) => {
    const examData = {
      name: data.name,
      title: data.title,
      type: data.type,
      subject: data.subject,
      ...(data.courseId ? { courseId: data.courseId } : {}),
      marks: Number(data.marks),
      minutes: Number(data.minutes),
      questions: data.questions.map((q) => ({
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        answer: q.answer,
        marks: Number(q.marks),
        ...(q.explanation && { explanation: q.explanation }),
      })),
    };

    console.log('Updating exam data:', examData);

    updateExamMutation.mutate(
      {
        examId: id,
        data: examData,
        role: role || '',
      },
      {
        onSuccess: () => {
          navigate({ to: backPath });
        },
      }
    );
  };

  // Options for answer dropdown
  const answerOptions = [
    { label: 'Option A', value: 'optionA' },
    { label: 'Option B', value: 'optionB' },
    { label: 'Option C', value: 'optionC' },
    { label: 'Option D', value: 'optionD' },
  ];

  // Show loading state
  if (examLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
          <p className="text-text-charcoal">Loading exam details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (examError) {
    return (
      <div className="flex justify-center py-5 md:py-8">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-red-600">Error loading exam details. Please try again.</p>
          <button
            onClick={() => navigate({ to: backPath })}
            className="mt-2 rounded-lg bg-primary-blue px-4 py-2 text-white hover:bg-primary-navy"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-3 sm:p-4 md:p-6">
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
            Update Exam
          </h1>
        </div>
      </div>

      {/* Main Card */}
      <div>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
            {/* Exam Details */}
            <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-3 shadow-md sm:p-4 md:p-5">
              <h2 className="mb-3 text-base font-semibold text-primary-navy md:text-lg">
                Exam Details
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <GenericInputField name="name" label="Exam Name" placeholder="Enter exam name" />
                <GenericInputField name="title" label="Title" placeholder="Enter exam title" />
                <GenericDropdown
                  name="type"
                  label="Exam Type"
                  control={control}
                  options={typeOptions}
                  placeholder="Select Exam Type"
                  required
                />

                {/* Subject Dropdown */}
                <GenericDropdown
                  name="subject"
                  label="Subject"
                  control={control}
                  options={subjectOptions}
                  isLoading={subjectsLoading}
                  placeholder={subjectsLoading ? 'Loading subjects...' : 'Select Subject'}
                  required
                />

                {/* Course Dropdown */}
                <GenericDropdown
                  name="courseId"
                  label="Course (Optional)"
                  control={control}
                  options={courseOptions}
                  isLoading={coursesLoading}
                  placeholder={coursesLoading ? 'Loading courses...' : 'Select Course'}
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
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            {/* Questions */}
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

            {/* Add Question - Centered */}
            <div className="flex justify-center">
              <GenericButton
                type="button"
                onClick={() =>
                  append({
                    question: '',
                    optionA: '',
                    optionB: '',
                    optionC: '',
                    optionD: '',
                    marks: 0,
                    answer: '',
                    explanation: '',
                  })
                }
                variant="navy"
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-pure-white"
              >
                <FaPlus className="h-5 w-5" />
                Add Question
              </GenericButton>
            </div>

            {/* Submit - Right Aligned */}
            <div className="sticky bottom-0 z-20 -mx-3 flex justify-end gap-3 border-t border-stroke bg-pure-white/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 dark:border-strokedark">
              <GenericButton
                type="button"
                onClick={() => navigate({ to: backPath })}
                variant="cancel"
                className="px-6 py-2"
              >
                Cancel
              </GenericButton>
              <GenericButton
                type="submit"
                variant="navy"
                className="px-4 md:px-8 py-2 text-base font-semibold"
                disabled={updateExamMutation.isPending}
              >
                {updateExamMutation.isPending ? 'Updating...' : 'Update Exam'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default UpdateExamForm;