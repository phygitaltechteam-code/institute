import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  useAddBatch,
  useGetBatchById,
  useUpdateBatch,
} from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useGetFaculties } from '@/lib/react-query/queriesAndMutations/queryMutation';
import { useGetCourses } from '@/mutations/courseMutation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import {
  Control,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { z } from 'zod';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { IoClose } from 'react-icons/io5';
import DatePicker from '@/components/Forms/Input/DatePicker';

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/* =========================
   ZOD SCHEMA
========================= */

// input schemas (form shape)
const installmentInputSchema = z.object({
  name: z.string().optional(),
  amount: z.string().optional(),
});

const feeOptionInputSchema = z.object({
  name: z.string().optional(),
  installments: z
    .array(installmentInputSchema)
    .min(1, 'At least one installment is required'),
});

// output schemas (backend payload shape)
const installmentOutputSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

const feeOptionOutputSchema = z.object({
  name: z.string(),
  feeInstallments: z.array(installmentOutputSchema),
});

const batchCreationInputSchema = z.object({
  batchName: z.string().min(1, 'Batch name is required'),
  course: z.string().min(1, 'Course is required'),
  faculty: z.string().min(1, 'Faculty is required'),

  days: z.array(z.string()).min(1, 'Select at least one day'),

  batchType: z.string().min(1, 'Batch type is required'),

  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalDays: z.string(),
  totalEducationDays: z.string(),
   referalBonus: z.union([z.string(), z.number()]).optional(),

  feeOptions: z
    .array(feeOptionInputSchema)
    .min(1, 'At least one fee option is required'),
});


const batchCreationOutputSchema = batchCreationInputSchema.transform((data) => {
  const teachingDays = {
    monday: data.days.includes('Monday'),
    tuesday: data.days.includes('Tuesday'),
    wednesday: data.days.includes('Wednesday'),
    thursday: data.days.includes('Thursday'),
    friday: data.days.includes('Friday'),
    saturday: data.days.includes('Saturday'),
    sunday: data.days.includes('Sunday'),
  };

  const feeOptions = (data.feeOptions || []).map((opt, oi) => ({
    name: opt.name || `Option ${oi + 1}`,
    feeInstallments: (opt.installments || []).map((inst, ii) => ({
      name: inst.name || `Installment ${ii + 1}`,
      amount: Number(inst.amount) || 0,
    })),
  }));

  return {
    name: data.batchName,
    courseId: data.course,
    batchType: data.batchType,
    teacherId: data.faculty,
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.batchType,
    totalDays: Number(data.totalDays) || 0,
    educationalDays: Number(data.totalEducationDays) || 0,
    teachingDays,
    feeOptions,
    startTime: data.startTime,
    endTime: data.endTime,
    referalBonus: data.referalBonus ? Number(data.referalBonus) : 0, // ✅ Include referalBonus with default 0
  } as const;
});

type BatchFormValues = z.infer<typeof batchCreationInputSchema>;

type BatchCreationProps = {
  batchId?: string;
};

const normalizeTimeValue = (value?: string) => {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toISOString().substring(11, 16);
};

const mapTeachingDaysToArray = (teachingDays?: Record<string, boolean>) => {
  if (!teachingDays || typeof teachingDays !== 'object') return [];
  return weekDays.filter((day) =>
    Boolean(teachingDays[day.toLowerCase() as keyof typeof teachingDays]),
  );
};

const BatchCreation = ({ batchId }: BatchCreationProps) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();

  const { data: courses } = useGetCourses(role);
  const { mutate: addBatch } = useAddBatch();
  const { mutate: updateBatch } = useUpdateBatch();
  const { data: facultyData } = useGetFaculties(role);

  const { data: batchDataById, isLoading: isBatchLoading } =
    useGetBatchById(batchId, role);
  console.log('Batch by ID:', batchId);

  const courseOptions = (courses?.data?.data || []).map((course: any) => ({
    value: course.id,
    label: course.name,
  }));

  // Faculty options - only for ADMIN role
  const facultyOptions = (facultyData?.data || []).map((faculty: any) => ({
    value: faculty.id,
    label: faculty.fullname || faculty.username || faculty.email || 'Unknown',
  }));

  const methods = useForm<BatchFormValues>({
    resolver: zodResolver(batchCreationOutputSchema as any),
    defaultValues: {
      batchName: '',
      course: '',
      faculty: '',
      days: [],
      batchType: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      totalDays: '',
      totalEducationDays: '',
      referalBonus: '',
      feeOptions: [
        {
          name: 'One Time Payment',
          installments: [{ name: 'Full Payment', amount: '' }],
        },
      ],
    },
  });

  const { handleSubmit, control, watch, setValue, reset } = methods;

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const selectedDays = watch('days');

  const onSubmit = (payload: any) => {
    console.log('Payload to backend (from zod):', payload);
    if (batchId) {
      updateBatch({ id: batchId, payload, role }, {
        onSuccess: () => {
          if (role === 'ADMIN') {
            navigate({ to: '/admin/batchtable' });
          } else {
            navigate({ to: '/faculty/batchtable' });
          }
        }
      });
    } else {
      addBatch({ payload, role }, {
        onSuccess: () => {
          if (role === 'ADMIN') {
            navigate({ to: '/admin/batchtable' });
          } else {
            navigate({ to: '/faculty/batchtable' });
          }
        }
      });
    }
  };

  useEffect(() => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return;

    const diff =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setValue('totalDays', String(diff));

    let educationDays = 0;

    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const selectedIndexes = selectedDays.map((d) => dayMap[d]);

    const current = new Date(start);

    while (current <= end) {
      if (selectedIndexes.includes(current.getDay())) {
        educationDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    setValue('totalEducationDays', String(educationDays));
  }, [startDate, endDate, selectedDays, setValue]);

  useEffect(() => {
    const batchPayload =
      batchDataById?.data?.data ?? batchDataById?.data ?? batchDataById;

    if (!batchId || !batchPayload) return;

    reset({
      batchName: batchPayload.name ?? '',
      course: batchPayload.course?.id ?? batchPayload.courseId ?? '',
      faculty:
        batchPayload.teacher?.id ??
        batchPayload.teacherId ??
        batchPayload.teacherId ??
        '',
      days: mapTeachingDaysToArray(batchPayload.teachingDays),
      batchType: batchPayload.batchType ?? batchPayload.type ?? '',
      startDate:
        batchPayload.startDate?.split?.('T')?.[0] ??
        batchPayload.startDate ??
        '',
      endDate:
        batchPayload.endDate?.split?.('T')?.[0] ?? batchPayload.endDate ?? '',
      startTime: normalizeTimeValue(batchPayload.startTime),
      endTime: normalizeTimeValue(batchPayload.endTime),
      referalBonus: batchPayload.referalBonus != null ? String(batchPayload.referalBonus) : '', // ✅ Include referalBonus
      totalDays:
        batchPayload.totalDays != null ? String(batchPayload.totalDays) : '',
      totalEducationDays:
        batchPayload.educationalDays != null
          ? String(batchPayload.educationalDays)
          : '',
      feeOptions: (batchPayload.feeOptions || []).map((option: any) => ({
        name: option.name || '',
        installments: (option.feeInstallments || []).map(
          (installment: any) => ({
            name: installment.name || '',
            amount:
              installment.amount != null ? String(installment.amount) : '',
          }),
        ),
      })) || [
          {
            name: 'One Time Payment',
            installments: [{ name: 'Full Payment', amount: '' }],
          },
        ],
    });
  }, [batchDataById, batchId, reset]);

  // Auto-set faculty for TEACHER role
  useEffect(() => {
    if (role === 'TEACHER' || role === 'FACULTY') {
      const teacherId = user?.id || user?.teacherId || '';
      if (teacherId) {
        setValue('faculty', teacherId);
      }
    }
  }, [role, user, setValue]);

  if (batchId && isBatchLoading) {
    return <div>Loading batch details...</div>;
  }

  const isEditMode = Boolean(batchId);
  const submitLabel = isEditMode ? 'Update Batch' : 'Create Batch';

  const isTeacher = role === 'TEACHER' || role === 'FACULTY';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto space-y-4 md:space-y-8 p-2">
        {/* Back Button */}
        <div className="mb-4">
          <GenericButton
            type="button"
            className="flex w-fit items-center gap-2 rounded bg-primary-navy px-4 py-2 text-white hover:bg-primary-navy/80"
            onClick={() => {
              if (role === 'ADMIN') {
                navigate({ to: '/admin/batchtable' });
              } else {
                navigate({ to: '/faculty/batchtable' });
              }
            }}
          >
            ← Back
          </GenericButton>
        </div>

        {/* Batch Details */}
        <div className="rounded-xl border-l-4 border-primary-navy bg-white p-4 md:p-8 shadow-md transition-shadow hover:shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-primary-navy">
            {isEditMode ? 'Edit Batch' : 'Create Batch'}
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <GenericInputField name="batchName" label="Batch Name" />

            <GenericDropdown
              name="course"
              label="Course"
              control={control as any}
              options={courseOptions}
            />

            {isTeacher ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Faculty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={user?.fullname || 'Your Name'}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically assigned to you
                </p>
              </div>
            ) : (
              <GenericDropdown
                name="faculty"
                label="Faculty"
                control={control as any}
                options={facultyOptions}
                placeholder="Select Faculty"
                required
              />
            )}

            <DatePicker
              name="startDate"
              label="Start Date"
            />

            <DatePicker
              name="endDate"
              label="End Date"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <GenericInputField
                name="startTime"
                label="Daily Start Time"
                type="time"
              />

              <GenericInputField name="endTime" label="Daily End Time" type="time" />
            </div>

            <GenericDropdown
              name="batchType"
              control={control as any}
              label="Batch Type"
              options={[
                { value: '', label: 'Select Batch Type' },
                { value: 'ONLINE', label: 'Online' },
                { value: 'OFFLINE', label: 'Offline' },
              ]}
            />

            <GenericInputField
              name="referalBonus"
              label="Referal Bonus"
              type="number"
            />

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="text-gray-700 mb-3 block text-sm font-medium">
                Select Teaching Days
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                {weekDays.map((day) => (
                  <label
                    key={day}
                    className="border-gray-200 hover:bg-gray-50 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={day}
                      {...methods.register('days')}
                      className="border-gray-300 h-4 w-4 rounded text-primary-navy focus:ring-primary-navy"
                    />
                    <span className="text-gray-700 text-sm font-medium">
                      {day}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <GenericInputField
                name="totalDays"
                label="Total Days"
                disabled
                className="border-none"
              />

              <GenericInputField
                name="totalEducationDays"
                label="Education Days"
                disabled
                className="border-none"
              />
            </div>

          </div>
        </div>

        {/* Fee Options Unified Table */}
        <FeeOptionsTable control={control} />

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <GenericButton
            type="submit"
            className="hover:bg-primary-navy/90 bg-primary-navy px-4 md:px-8 py-1 text-lg font-semibold text-white transition-all hover:shadow-lg"
          >
            {submitLabel}
          </GenericButton>
        </div>
      </form>
    </FormProvider>
  );
};

export default BatchCreation;

/* =========================
   FEE OPTIONS TABLE
========================= */

type FeeOptionsTableProps = {
  control: Control<BatchFormValues>;
};

function FeeOptionsTable({ control }: FeeOptionsTableProps) {
  const { register, watch, setValue } = useFormContext<BatchFormValues>();

  const {
    fields: feeOptionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: 'feeOptions',
  });

  const feeOptions = watch('feeOptions') || [];

  const installmentCount = Math.max(
    ...feeOptions.map((o) => o.installments?.length || 0),
    1,
  );

  useEffect(() => {
    feeOptions.forEach((option, optIdx) => {
      const rowCount = option.installments?.length ?? 1;
      const optionName =
        rowCount === 1
          ? 'One Time Payment'
          : rowCount === 2
            ? 'Two Installments'
            : `${rowCount} Installments`;
      setValue(`feeOptions.${optIdx}.name`, optionName);

      Array.from({ length: rowCount }, (__, instIdx) => {
        const instName =
          rowCount === 1
            ? 'Full Payment'
            : rowCount === 2
              ? instIdx === 0
                ? 'First Installment'
                : 'Second Installment'
              : `Installment ${instIdx + 1}`;
        setValue(`feeOptions.${optIdx}.installments.${instIdx}.name`, instName);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(feeOptions.map((o) => o.installments?.length))]);

  const addInstallmentColumn = (optionIndex: number) => {
    const option = feeOptions[optionIndex];
    const currentInstallments = option?.installments || [];
    const newCount = currentInstallments.length + 1;
    setValue(
      `feeOptions.${optionIndex}.installments` as any,
      [...currentInstallments, { name: `Installment ${newCount}`, amount: '' }],
      { shouldDirty: true },
    );
  };

  const addInstallmentColumnToAll = () => {
    feeOptions.forEach((option, idx) => {
      const currentInstallments = option?.installments || [];
      const newCount = currentInstallments.length + 1;
      setValue(
        `feeOptions.${idx}.installments` as any,
        [...currentInstallments, { name: `Installment ${newCount}`, amount: '' }],
        { shouldDirty: true },
      );
    });
  };

  const removeLastInstallmentColumn = (optionIndex: number) => {
    const option = feeOptions[optionIndex];
    const currentInstallments = option?.installments || [];
    if (currentInstallments.length <= 1) return;
    setValue(
      `feeOptions.${optionIndex}.installments` as any,
      currentInstallments.slice(0, -1),
      { shouldDirty: true },
    );
  };

  const addFeeOptionRow = () => {
    appendOption({
      name:
        installmentCount === 1
          ? 'One Time Payment'
          : installmentCount === 2
            ? 'Two Installments'
            : `${installmentCount} Installments`,
      installments: Array.from({ length: installmentCount }, (_, i) => ({
        name:
          installmentCount === 1
            ? 'Full Payment'
            : installmentCount === 2
              ? i === 0
                ? 'First Installment'
                : 'Second Installment'
              : `Installment ${i + 1}`,
        amount: '',
      })),
    });
  };

  return (
    <div className="rounded-xl bg-white p-1 shadow-md">

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-navy text-white">
              <th className="px-4 py-3 text-left font-semibold min-w-[130px] whitespace-nowrap">
                Fee Option
              </th>
              {Array.from({ length: installmentCount }, (_, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-semibold min-w-[160px] whitespace-nowrap"
                >
                  Installment {i + 1}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold min-w-[110px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={addInstallmentColumnToAll}
                  className="rounded-lg p-1.5 text-white transition hover:bg-white/20 hover:scale-110"
                  title="Add installment column to all rows"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {feeOptionFields.map((field, optionIndex) => (
              <tr
                key={field.id}
                className={`border-t border-gray-100 transition-colors ${optionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } hover:bg-blue-50/20`}
              >
                <td className="px-4 py-3 font-semibold text-primary-navy whitespace-nowrap">
                  Option {optionIndex + 1}
                </td>

                {Array.from({ length: installmentCount }, (_, instIndex) => {
                  const rowInstCount = feeOptions[optionIndex]?.installments?.length || 0;
                  const hasColumn = instIndex < rowInstCount;
                  return (
                    <td key={instIndex} className="px-3 py-2">
                      {hasColumn ? (
                        <input
                          type="number"
                          placeholder="Amount"
                          {...register(
                            `feeOptions.${optionIndex}.installments.${instIndex}.amount`,
                          )}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/20 focus:outline-none"
                        />
                      ) : (
                        <span />
                      )}
                    </td>
                  );
                })}

                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {optionIndex === feeOptionFields.length - 1 ? (
                      <button
                        type="button"
                        onClick={addFeeOptionRow}
                        className="rounded-lg p-1.5 text-accent-teal transition hover:bg-accent-teal/10 hover:scale-110"
                        title="Add new fee option row"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="h-7 w-7" aria-hidden="true" />
                    )}

                    <button
                      type="button"
                      onClick={() => removeOption(optionIndex)}
                      disabled={feeOptionFields.length <= 1}
                      className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove fee option row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}