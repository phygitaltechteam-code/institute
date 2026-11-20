import z from "zod";
import { feesTableType } from "../Fees";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DatePicker from "@/components/Forms/Input/DatePicker";
import GenericInputField from "@/components/Forms/Input/GenericInputField";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import { X } from "lucide-react";
import { useAddFeesFollowUp } from "@/lib/react-query/queriesAndMutations/feesmutation";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate } from "@/utils/dateTimeUtils";

interface FollowUpPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudent?: feesTableType | null;
    refetch: () => void;
}

interface FollowUpFormContentProps {
    onClose: () => void;
    selectedStudent?: feesTableType | null;
    refetch: () => void;
}

export const FollowUpFormContent: React.FC<FollowUpFormContentProps> = ({ onClose, refetch, selectedStudent }) => {

    const { mutate: addFollowUp, isPending } = useAddFeesFollowUp();
    const user = useAuthContext();
    const role = user?.role;

    const schema = z.object({
        date: z.string().min(1, "Date is required"),
        amount: z.coerce.number().min(1, "Amount is required"),
        notes: z.string().min(1, "Note is required"),
    });

    type feesFormValues = z.infer<typeof schema>;

    const followUpMethods = useForm<feesFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            date: "",
            amount: 0,
            notes: "",
        },
    });

    const { handleSubmit, reset } = followUpMethods;

    const handleClose = () => {
        reset();
        onClose();
    };

    const onSubmit = (data: feesFormValues) => {
        console.log("Submitted follow up:", data, selectedStudent);
        const payload = {
            followUpDate: data.date,
            amount: data.amount,
            notes: data.notes,
            studentId: selectedStudent?.id,
        }
        addFollowUp(
            { payload, role },
            {
                onSuccess: () => {
                    refetch();
                    handleClose();
                },
            }
        );
    };

    return (
        <>
            <FormProvider {...followUpMethods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DatePicker name="date" label="Follow Up Date" required />
                        <GenericInputField name="amount" label="Amount" type="number" required validation={{ required: true }} />
                    </div>
                    <div>
                        <GenericInputField name="notes" label="Note" type="text" required />
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                        <GenericButton
                            type="button"
                            variant="cancel"
                            className="border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            onClick={handleClose}
                        >
                            Cancel
                        </GenericButton>
                        <GenericButton
                            type="submit"
                            variant="navy"
                            className="px-6 py-2 text-sm"
                            disabled={isPending}
                        >
                            {isPending ? 'Saving...' : 'Save Follow Up'}
                        </GenericButton>
                    </div>
                </form>
            </FormProvider>
        </>
    );
};

export const FollowUpPopUp: React.FC<FollowUpPopUpProps> = ({ isOpen, onClose, selectedStudent, refetch }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl dark:border-strokedark dark:bg-boxdark">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                    <h2 className="text-xl font-bold text-primary-navy dark:text-white">
                        Add Follow Up {selectedStudent?.name ? `- ${selectedStudent.name}` : ''}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <FollowUpFormContent onClose={onClose} selectedStudent={selectedStudent} refetch={refetch} />
            </div>
        </div>
    );
};