import GenericButton from "@/components/Forms/Buttons/GenericButton"
import GenericDropdown from "@/components/Forms/DropDown/GenericDropDown"
import GenericInputField from "@/components/Forms/Input/GenericInputField"
import { useAuthContext } from "@/context/AuthContext"
import { useGetStudent } from "@/lib/react-query/queriesAndMutations/studentDetails"
import { useGetBatchwiseStudentInterview, useGetCourses } from "@/mutations/courseMutation"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import z from "zod"
import { useEffect, useMemo } from "react"
import { useGetReferrals, useSubmitReferral } from "@/lib/react-query/queriesAndMutations/referralapi"

export const ReferalForm = ({ studentId, batchId, onSuccess, referId }: any) => {
    const scheme = z.object({
        name: z.string().min(1, "Name is required"),
        refralName: z.string().min(1, "Referral name is required"),
        phoneNumber: z.string().min(10, "Please enter a valid phone number"),
        qualification: z.string().min(1, "Qualification is required"),
        intrest: z.string().min(1, "Interest is required"),
        courseId: z.string().min(1, "Course is required"),
    })

    const { user } = useAuthContext()
    const role = user?.role

    // Fetch students for referral dropdown
    const { data: studentsData, isLoading: isLoadingStudents, isError: isErrorStudents } = useGetBatchwiseStudentInterview(batchId, role);
    const { data: coursesData, isLoading: coursesLoading } = useGetCourses(role);

    // Submit referral mutation
    const { mutate: submitReferral, isPending: isSubmitting, isSuccess, error } = useSubmitReferral(role);

    // Get referrals data (optional - for displaying existing referrals)
    const { data: referralsData, refetch: refetchReferrals } = useGetReferrals(role, studentId);

    type Values = z.infer<typeof scheme>

    const method = useForm<Values>({
        resolver: zodResolver(scheme),
        defaultValues: {
            name: "",
            phoneNumber: "",
            refralName: "",
            qualification: "",
            intrest: "",
            courseId: ""
        }
    })

    const { handleSubmit, control, reset, setError, watch, setValue } = method

    // Handle successful submission
    useEffect(() => {
        if (isSuccess) {
            reset(); // Reset form
            refetchReferrals(); // Refresh referrals list
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [isSuccess, reset, refetchReferrals, onSuccess])

    const onSubmit = (data: Values) => {
        // Get the selected student from the dropdown
        const selectedStudent = studentsList.find(
            (student: any) => student.id === data.refralName
        );

        // Get the referral ID from the selected student or use the provided referId
        const referIdValue = selectedStudent?.referId || referId || data.refralName;

        const payload = {
            studentId: studentId || data.refralName,
            batchId: batchId,
            name: data.name,
            refralName: selectedStudent?.name || selectedStudent?.user?.fullname || data.refralName,
            phoneNumber: data.phoneNumber,
            qualification: data.qualification,
            intrest: data.intrest,
            courseId: data.courseId, // Changed from course to courseId
            referId: referIdValue, // Send the referral ID
        };

        console.log("Submitting referral with role:", role);
        console.log("Payload:", payload);

        submitReferral(payload, {
            onSuccess: (response) => {
                console.log("Referral submitted successfully:", response);
                // The useEffect will handle reset and onSuccess
            },
            onError: (error: any) => {
                console.error("Error submitting referral:", error);
                // Handle specific error cases
                if (error?.response?.data?.message) {
                    setError("root", {
                        message: error.response.data.message
                    });
                } else {
                    setError("root", {
                        message: "Failed to submit referral. Please try again."
                    });
                }
            }
        });
    }

    // Get students list with proper mapping
    const studentsList = useMemo(() => {
        const list = studentsData?.data?.data || studentsData?.data || studentsData || [];
        return list.map((student: any) => ({
            label: student.name || student.user?.fullname || student.fullname || 'Unknown',
            value: student.id || student._id,
        }));
    }, [studentsData]);

    // Get courses list with proper mapping
    const coursesList = useMemo(() => {
        const courses = coursesData?.data?.data || coursesData?.data || coursesData || [];
        return courses.map((course: any) => ({
            label: course.name || course.courseName || course.title || 'Unknown Course',
            value: course.id || course._id,
        }));
    }, [coursesData]);

    // Watch for referral name selection to auto-fill phone number
    const selectedReferralName = watch('refralName');

    // Auto-fill phone number when referral is selected
    useEffect(() => {
        if (selectedReferralName) {
            const selectedStudent = studentsData?.data?.data?.find(
                (student: any) => student.id === selectedReferralName
            );
            if (selectedStudent?.user?.phoneNumber || selectedStudent?.phoneNumber) {
                setValue('phoneNumber', selectedStudent.user?.phoneNumber || selectedStudent.phoneNumber || '');
            }
        }
    }, [selectedReferralName, studentsData, setValue]);

    // Loading state
    if (isLoadingStudents || coursesLoading) {
        return (
            <div className="flex justify-center items-center py-5 md:py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
            </div>
        );
    }

    // Error state for students fetch
    if (isErrorStudents) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Failed to load students. Please refresh and try again.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Referral Form</h2>

            <FormProvider {...method}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Student Name */}
                    <GenericInputField
                        name="name"
                        label="Student Name"
                        required
                        placeholder="Enter student name"
                        disabled={!!studentId}
                    />

                    {/* Referral Name Dropdown */}
                    <GenericDropdown
                        control={control as any}
                        name="refralName"
                        label="Referral Name"
                        required
                        options={studentsList.length > 0 ? studentsList : [{ label: "No students available", value: "" }]}
                        placeholder="Select referral name"
                    />

                    {/* Phone Number - Changed from number to phoneNumber */}
                    <GenericInputField
                        name="phoneNumber"
                        label="Phone Number"
                        required
                        placeholder="Enter phone number"
                        type="tel"
                    />

                    {/* Qualification */}
                    <GenericInputField
                        name="qualification"
                        label="Qualification"
                        required
                        placeholder="Enter qualification"
                    />

                    {/* Interest Dropdown */}
                    <GenericDropdown
                        control={control as any}
                        name="intrest"
                        label="Interest Level"
                        required
                        options={[
                            { label: "Hot", value: "hot" },
                            { label: "Warm", value: "warm" },
                            { label: "Cold", value: "cold" }
                        ]}
                        placeholder="Select interest level"
                    />

                    {/* Course Dropdown - Changed from course to courseId */}
                    <GenericDropdown
                        control={control as any}
                        name="courseId"
                        label="Course"
                        required
                        options={coursesList.length > 0 ? coursesList : [
                            { label: "BAMS", value: "bams" },
                            { label: "BHMS", value: "bhms" },
                            { label: "BDS", value: "bds" },
                            { label: "NCISM", value: "ncism" },
                            { label: "Other", value: "other" }
                        ]}
                        placeholder="Select course"
                    />

                    {/* Error message display */}
                    {method.formState.errors.root && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                            {method.formState.errors.root.message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <GenericButton
                            type="submit"
                            disabled={isSubmitting}
                            className={`rounded-lg bg-accent-teal text-lg font-semibold text-pure-white shadow-lg hover:bg-primary-navy transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                'Submit Referral'
                            )}
                        </GenericButton>

                        {onSuccess && (
                            <GenericButton
                                type="button"
                                onClick={() => {
                                    reset();
                                    onSuccess();
                                }}
                                className="rounded-lg bg-gray-300 text-gray-700 text-lg font-semibold hover:bg-gray-400 transition-colors px-6"
                            >
                                Cancel
                            </GenericButton>
                        )}
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}