import { useAuthContext } from '@/context/AuthContext';
import { useGetLeadById, useUpdateLeadMutation } from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface LeadFollowUpByidProps {
    leadId: string;
}

const schema = z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    source: z.string().optional(),
    course: z.string().optional(),
    qualification: z.string().optional(),
    interested: z.string().optional(),
    teacher: z.string().optional(),
    batchType: z.string().optional(),
    batch: z.string().optional(),
    collegeName: z.string().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const LeadFollowUpByid = ({ leadId }: LeadFollowUpByidProps) => {
    const { user } = useAuthContext();
    const role = user?.role;
    const navigate = useNavigate();

    console.log('=== LEAD FOLLOW UP BY ID ===');
    console.log('Lead ID prop:', leadId);
    console.log('Role:', role);

    const { data: leadData, isLoading, isError, refetch } = useGetLeadById(leadId, role);
    const { mutate: updateLead, isPending } = useUpdateLeadMutation();

    console.log('Lead Data from API:', leadData);

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            phoneNumber: '',
            source: '',
            course: '',
            qualification: '',
            interested: '',
            teacher: '',
            batchType: '',
            batch: '',
            collegeName: '',
            status: '',
            note: '',
        },
    });

    const { handleSubmit, control, reset } = methods;

    useEffect(() => {
        if (leadData && leadData.id) {
            const lead = leadData;
            console.log('Populating form with lead data:', lead);
            reset({
                name: lead.name || '',
                phoneNumber: lead.phoneNumber || '',
                source: lead.source || '',
                course: lead.course?.name || '',
                qualification: lead.qualification || '',
                interested: lead.interested ? 'Yes' : 'No',
                teacher: lead.teacher?.user?.fullname || '',
                batchType: lead.batchType || '',
                batch: lead.batch?.name || '',
                collegeName: lead.collegeName || '',
                status: lead.status || '',
                note: lead.note || '',
            });
        }
    }, [leadData, reset]);

    const onSubmit = (data: FormValues) => {
        console.log('Form Data submitted:', data);

        const updatePayload = {
            name: data.name,
            phoneNumber: data.phoneNumber,
            source: data.source,
            qualification: data.qualification,
            collegeName: data.collegeName,
            interested: data.interested === 'Yes',
            status: data.status,
            note: data.note,
        };

        console.log('Update Payload:', updatePayload);

        updateLead(
            { leadId, data: updatePayload, role },
            {
                onSuccess: () => {
                    console.log('Lead updated successfully');
                    window.history.back();
                },
                onError: (error) => {
                    console.error('Error updating lead:', error);
                }
            }
        );
    };

    const handleBack = () => {
        window.history.back();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg bg-pure-white p-4 shadow">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
                    <p className="text-text-charcoal">Loading lead information...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-lg bg-pure-white p-5 shadow">
                <div className="rounded-lg bg-red-50 p-4 text-center">
                    <p className="text-red-600">Failed to load lead information.</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 rounded-lg bg-primary-blue px-4 py-2 text-white hover:bg-primary-navy"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-pure-white p-5 shadow">
            <div className="mb-4">
                <button
                    type="button"
                    className="flex w-fit items-center gap-2 rounded bg-primary-navy px-4 py-2 text-white hover:bg-primary-navy/80"
                    onClick={handleBack}
                >
                    ← Back to Leads
                </button>
            </div>

            <h1 className="mb-4 text-xl font-bold">Lead Details & Follow-up</h1>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="rounded-lg border border-stroke bg-bg-light-mint p-4">
                        <h2 className="mb-4 text-lg font-semibold">Lead Information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <GenericInputField label="Name" name="name" control={control} />
                            <GenericInputField label="Phone Number" name="phoneNumber" control={control} />
                            <GenericInputField label="Source" name="source" control={control} />
                            <GenericInputField label="Course" name="course" control={control} disabled />
                            <GenericInputField label="Qualification" name="qualification" control={control} />
                            <GenericInputField label="Interested" name="interested" control={control} />
                            <GenericInputField label="Faculty" name="teacher" control={control} disabled />
                            <GenericInputField label="Batch Type" name="batchType" control={control} disabled />
                            <GenericInputField label="Batch" name="batch" control={control} disabled />
                            <GenericInputField label="College Name" name="collegeName" control={control} />
                            <GenericInputField label="Status" name="status" control={control} />
                            <GenericInputField label="Note" name="note" control={control} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <GenericButton
                            type="button"
                            onClick={handleBack}
                            className="rounded-lg bg-gray-300 px-6 py-2 text-gray-800 hover:bg-gray-400"
                        >
                            Cancel
                        </GenericButton>
                        <GenericButton
                            type="submit"
                            disabled={isPending}
                            className="rounded-lg bg-accent-teal px-6 py-2 text-white hover:bg-primary-navy disabled:opacity-60"
                        >
                            {isPending ? 'Updating...' : 'Update Lead'}
                        </GenericButton>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
};

export default LeadFollowUpByid;