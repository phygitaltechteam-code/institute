import z from 'zod';

export const assignmentSchema = z.object({
  courseId: z.string().min(1, 'Please select a course'),
  batchId: z.string().min(1, 'Please select a batch'),
  studentIds: z.array(z.string()).min(1, 'Please select at least one student'),
  interviewLocation: z.string().optional(),
  interviewTime: z.string().min(1, 'Please enter interview time'),
  interviewDate: z.string().min(1, 'Please enter interview date'),
  interviewMode: z.string().min(1, 'Please enter interview mode'),
}).superRefine((data, ctx) => {
  if (data.interviewMode === 'OFFLINE' && !data.interviewLocation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please enter interview location',
      path: ['interviewLocation'],
    });
  }
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export type PlacementRow = {
  id: string;
  PN: number;
  companyName: string;
  jobRole: string;
  qualification: string;
  experience: string;
  deadline: string;
  interviewMode: string;
  workSchedule: string;
  salary: string;
};

export type StudentOption = {
  value: string;
  label: string;
};

export type StudentMultiSelectProps = {
  options: StudentOption[];
  isLoading: boolean;
  selectedBatchId: string;
  setValue: any;
};

export type InterestedStudent = {
  id: string;
  name: string;
};
