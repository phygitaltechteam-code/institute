import { useAuthContext } from "@/context/AuthContext";
import { feesTableType } from "../Fees";
import * as z from 'zod';
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import DatePicker from "@/components/Forms/Input/DatePicker";
import GenericInputField from "@/components/Forms/Input/GenericInputField";
import GenericDropdown from "@/components/Forms/DropDown/GenericDropDown";
import { FollowUpFormContent } from "./FollowUpPopUp";
import { useGetAccounts } from "@/lib/react-query/queriesAndMutations/account";
import { useAddFees } from "@/lib/react-query/queriesAndMutations/feesmutation";
import { formatDate } from "@/utils/dateTimeUtils";

// Schema defined OUTSIDE component so it is stable across re-renders
const feesCollectionSchema = z.object({
    amount: z.coerce.number().min(1, "Amount is required"),
    accountId: z.string().min(1, "Account is required"),
    remainingAmount: z.coerce.number(),
    studentId: z.string(),
});

type feesCollectionFormValues = z.infer<typeof feesCollectionSchema>;

interface FeesCollectionPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudent?: feesTableType | null;
    refetch?: () => void;
}

export const FeesCollection: React.FC<FeesCollectionPopUpProps> = ({ isOpen, onClose, selectedStudent, refetch }) => {
    const [activeTab, setActiveTab] = useState<'feesCollection' | 'followUp'>('feesCollection');
    const { user }: any = useAuthContext();

    const { data: accountData, isLoading: isAccountLoading, isError: isAccountError } = useGetAccounts(user?.role)
    const { mutateAsync: addfees, isPending } = useAddFees()

    const accountOptions =
        accountData?.data?.map((account: any) => ({
            label: account.name,
            value: account.id,
        })) ?? [];

    const feesCollectionMethods = useForm<feesCollectionFormValues>({
        resolver: zodResolver(feesCollectionSchema),
        defaultValues: {
            amount: 0,
            accountId: "",
            remainingAmount: Number(selectedStudent?.pendingFees ?? 0),
            studentId: selectedStudent?.id ?? "",
        },
    });

    // Sync fields whenever selectedStudent changes
    useEffect(() => {
        feesCollectionMethods.setValue("studentId", selectedStudent?.id ?? "");
        feesCollectionMethods.setValue("remainingAmount", Number(selectedStudent?.pendingFees ?? 0));
    }, [selectedStudent]);

    const { handleSubmit, reset, watch, setValue } = feesCollectionMethods;

    const enteredAmount = watch("amount");
    const remainingAmount = watch("remainingAmount");
    const pendingFees = Number(selectedStudent?.pendingFees ?? 0);

    // Auto-calculate remainingAmount = pendingFees - entered amount
    useEffect(() => {
        const remaining = Math.max(pendingFees - (Number(enteredAmount) || 0), 0);
        setValue("remainingAmount", remaining);
    }, [enteredAmount, pendingFees, setValue]);

    const handleClose = () => {
        reset();
        setActiveTab('feesCollection');
        onClose();
    };

    const onSubmit = async (data: feesCollectionFormValues) => {
        console.log("Submitted fees collection:", data, selectedStudent);
        const feesPayLoad: any = {
            amount: data?.amount,
            accountId: data?.accountId,
            pendingAmount: data?.remainingAmount,
            studentId: data?.studentId
        };
        await addfees({ data: feesPayLoad, role: user?.role });
        refetch?.();
        handleClose();
    };

    // Student Info Card Component
    const StudentInfoCard = () => (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Student Name</span>
                    <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent?.name || 'N/A'}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Phone</span>
                    <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent?.phone || 'N/A'}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Fees</span>
                    <p className="font-semibold text-slate-800 dark:text-white">₹{selectedStudent?.totalFees || 0}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Due Fees</span>
                    <p className="font-semibold text-red-600">₹{selectedStudent?.pendingFees || 0}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Last Payment Date</span>
                    <p className="font-semibold text-slate-800 dark:text-white">
                        {selectedStudent?.paidDate ? formatDate(selectedStudent.paidDate) : 'N/A'}
                    </p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Last Payment Amount</span>
                    <p className="font-semibold text-slate-800 dark:text-white">
                        {selectedStudent?.paidFees ? `₹${selectedStudent.paidFees}` : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl dark:border-strokedark dark:bg-boxdark">
                {/* Header with Tabs */}
                <div className="mb-4 flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('feesCollection')}
                            className={`pb-1 text-base font-bold transition-all sm:text-md ${activeTab === 'feesCollection'
                                    ? 'border-b-2 border-primary-navy text-primary-navy dark:border-white dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Fees Collection
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('followUp')}
                            className={`pb-1 text-base font-bold transition-all sm:text-md ${activeTab === 'followUp'
                                    ? 'border-b-2 border-primary-navy text-primary-navy dark:border-white dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Add Follow Up
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Student Information Card */}
                <StudentInfoCard />

                {/* Tab Content */}
                {activeTab === 'feesCollection' ? (
                    <FormProvider {...feesCollectionMethods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <GenericInputField name="amount" label="Amount" type="number" required validation={{ required: true }} />
                                <GenericDropdown name="accountId" label="Account" options={accountOptions} required />
                                <label className="block text-sm font-medium text-slate-700">Remaining Amount:</label>
                                <input 
                                    type="text"
                                    readOnly
                                    value={`₹${remainingAmount}`}
                                />
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
                                    {isPending ? 'Saving...' : 'Save Collection'}
                                </GenericButton>
                            </div>
                        </form>
                    </FormProvider>
                ) : (
                    <FollowUpFormContent onClose={handleClose} selectedStudent={selectedStudent} refetch={refetch} />
                )}
            </div>
        </div>
    );
};