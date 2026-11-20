import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

import GenericInputField from '../Forms/Input/GenericInputField';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericTable, { Column } from '../Forms/Table/GenericTable';
import { useAuthContext } from '@/context/AuthContext';
import { FaPlus } from 'react-icons/fa';
import { useAddSubject, useGetSubject } from '@/mutations/subjectMutation';

const subjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface Subject {
    id: string;
    name: string;
}

const AddSubject = () => {
    const { user } = useAuthContext();
    const role = user?.role;
    const [isAdding, setIsAdding] = useState(false);

    const { mutateAsync: addSubject } = useAddSubject();
    const { data: subjectsData, isLoading, refetch } = useGetSubject(role);

    console.log(subjectsData)


    const methods = useForm<SubjectFormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: {
            name: '',
        },
    });

    const { handleSubmit, reset } = methods;

    const onSubmit = async (data: SubjectFormValues) => {
        await addSubject({ data, role });
        reset();
        setIsAdding(false);
        refetch();
    };

    const handleBack = () => {
        setIsAdding(false);
        reset();
    };

    const handleCancel = () => {
        setIsAdding(false);
        reset();
    };

    // Stub — edit API to be added later
    const handleEdit = (_item: Subject) => {
        // TODO: wire up edit subject API
    };

    // Stub — delete API to be added later
    const handleDelete = (_item: Subject) => {
        // TODO: wire up delete subject API
    };

    const columns: Column<Subject>[] = [
        {
            header: 'Subject Name',
            accessor: 'name',
            render: (item: Subject) => (
                <span className="font-medium text-gray-800">{item.name || '-'}</span>
            ),
        },
    ];

    return (
        <div className="mx-auto p-3 sm:p-4 md:p-6">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    {isAdding && (
                        <GenericButton onClick={handleBack} variant="navy" aria-label="Go back">
                            <span>← Back</span>
                        </GenericButton>
                    )}
                    <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
                        {isAdding ? 'Add New Subject' : 'Subject Management'}
                    </h1>
                </div>

                {!isAdding && (
                    <GenericButton
                        onClick={() => setIsAdding(true)}
                        variant="navy"
                        className="flex items-center gap-2"
                    >
                        <FaPlus className="h-4 w-4" />
                        Add Subject
                    </GenericButton>
                )}
            </div>

            {/* Add Subject Form */}
            {isAdding && (
                <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <GenericInputField
                                        label="Subject Name"
                                        name="name"
                                        placeholder="Enter subject name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <GenericButton
                                    type="button"
                                    onClick={handleCancel}
                                    variant="cancel"
                                    className="px-6 py-2"
                                >
                                    Cancel
                                </GenericButton>
                                <GenericButton
                                    type="submit"
                                    variant="navy"
                                    className="px-4 md:px-8 py-2 text-base font-semibold"
                                >
                                    Save Subject
                                </GenericButton>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            )}

            {/* Subject Table */}
            {!isAdding && (
                <GenericTable<Subject>
                    data={subjectsData?.data || []}
                    columns={columns}
                    itemsPerPage={10}
                    searchAble={true}
                    action={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    paginationOff={false}
                    showSrNo={true}
                />
            )}
        </div>
    );
};

export default AddSubject;