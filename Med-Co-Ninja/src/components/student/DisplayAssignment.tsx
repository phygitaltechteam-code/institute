import { showPopup } from '@/components/Common/AlertPopup';
import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import { Column } from "@/types";
import { useGetStudentAssignment } from "@/lib/react-query/queriesAndMutations/studentassignment";
import GenericTable from "@/components/Forms/Table/GenericTable";
import { useState } from "react";
import { FiX, FiUpload, FiFile } from "react-icons/fi";
import { useAddAssignmentSumbitMutation } from "@/lib/api/student/assighnment";
import { formatDate } from "@/utils/dateTimeUtils";

type Assignment = {
    id: string;
    name: string;
    description: string;
    remark: string;
    deadline: string;
    createdAt: string;
    updatedAt: string;
    assignmentCompletions?: Array<{
        id: string;
        completed: boolean;
        studentId: string;
        remark?: string;
    }>;
}

const DisplayAssignment = () => {
    const { data: response, isLoading, isError, refetch } = useGetStudentAssignment();

    const {mutate:uploadeAssignment} = useAddAssignmentSumbitMutation()
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadItem, setUploadItem] = useState<Assignment | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [remark, setRemark] = useState("");

    // Format date to readable format


    // Get data array
    const rawData = response?.data || response || [];

    // Handle upload
    const handleUpload = (row: Assignment) => {
        setUploadItem(row);
        setSelectedFile(null);
        setUploadSuccess(false);
        setRemark("");
        setShowUploadModal(true);
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Confirm upload
    const confirmUpload = async () => {
        if (!uploadItem || !selectedFile) {
            showPopup("Please select a file to upload");
            return;
        }

        setIsUploading(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            // formData.append('assignmentId', uploadItem.id);
            formData.append('file', selectedFile);
            // formData.append('remark', remark);
            uploadeAssignment({data:formData,assignmentId:uploadItem.id})
            // Call your upload API here
            // await uploadAssignment(formData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success
            setUploadSuccess(true);

            // Refresh data
            refetch();

            // Close modal after success
            setTimeout(() => {
                setShowUploadModal(false);
                setUploadItem(null);
                setSelectedFile(null);
                setIsUploading(false);
                setUploadSuccess(false);
                setRemark("");
            }, 2000);

        } catch (error) {
            console.error("Upload failed:", error);
            showPopup("Failed to upload. Please try again.");
            setIsUploading(false);
        }
    };

    // Columns with render functions
    const columns: Column<Assignment>[] = [
        {
            header: "Assign Date",
            accessor: "createdAt",
            render: (row) => {
                return <span className="text-gray-700">{formatDateTimeAuto(row?.createdAt)}</span>;
            }
        },
        {
            header: "Assignment Name",
            accessor: "name",
            render: (row) => {
                return <span className="font-medium text-gray-800">{row?.name || '-'}</span>;
            }
        },
        {
            header: "Description",
            accessor: "description",
            render: (row) => {
                return <span className="text-gray-700">{row?.description || '-'}</span>;
            }
        },
        {
            header: "Deadline",
            accessor: "deadline",
            render: (row) => {
                return <span className="text-gray-700">{formatDate(row?.deadline)}</span>;
            }
        },
        {
            header: "Action",
            accessor: "id",
            render: (row) => {
                return (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => handleUpload(row)}
                            className="p-2 rounded-full transition-colors text-primary-navy hover:shadow-md"
                            title="Upload Assignment"
                        >
                            <FiUpload size={18} />
                        </button>
                    </div>
                );
            }
        },
        {
            header: "Remark",
            accessor: "assignmentCompletions",
            render: (row) => {
                const completionRemark = row?.assignmentCompletions?.[0]?.remark || '-';
                return (
                    <div className="max-w-xs">
                        <span className="text-gray-700 text-sm break-words">
                            {completionRemark}
                        </span>
                    </div>
                );
            }
        }
    ];

    // Handle loading state
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">Assignments</h3>
                <hr className="mb-3 border-gray-200" />
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading assignments...</span>
                </div>
            </div>
        );
    }

    // Handle error state
    if (isError) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">Assignments</h3>
                <hr className="mb-3 border-gray-200" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                    Failed to load assignments. Please try again.
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">Assignments</h3>
                <hr className="mb-3 border-gray-200" />

                {!rawData || rawData.length === 0 ? (
                    <div className="text-center py-5 md:py-8 text-gray-500">
                        <p className="text-lg">No assignments available</p>
                    </div>
                ) : (
                    <GenericTable
                        columns={columns}
                        data={rawData}
                        itemsPerPage={5}
                        searchAble={true}
                        showSrNo={true}
                    />
                )}
            </div>

            {/* Upload Confirmation Modal */}
            {showUploadModal && uploadItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-lg bg-white max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                if (!isUploading) {
                                    setShowUploadModal(false);
                                    setUploadItem(null);
                                    setSelectedFile(null);
                                    setUploadSuccess(false);
                                    setRemark("");
                                }
                            }}
                            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            disabled={isUploading}
                        >
                            <FiX size={20} />
                        </button>

                        {/* Modal content */}
                        <div className="mt-2">
                            {uploadSuccess ? (
                                // Success state
                                <div className="text-center py-4">
                                    <div className="flex justify-center mb-4">
                                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Upload Successful!</h3>
                                    <p className="mt-2 text-gray-600">
                                        Your assignment has been uploaded successfully.
                                    </p>
                                </div>
                            ) : (
                                // Upload form
                                <>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                                            <FiUpload className="h-7 w-7 text-blue-600" />
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Upload Assignment</h3>

                                    <p className="mt-2 text-gray-600 text-center">
                                        Upload your assignment for{' '}
                                        <span className="font-semibold text-gray-900">"{uploadItem.name}"</span>
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500 text-center">
                                        Deadline: {formatDate(uploadItem.deadline)}
                                    </p>

                                    {/* Previous uploaded file */}
                                    {uploadItem.assignmentCompletions && uploadItem.assignmentCompletions.length > 0 && uploadItem.assignmentCompletions[0].documentUrl && (
                                        <div className="mt-4 flex items-center justify-center">
                                            <a
                                                href={uploadItem.assignmentCompletions[0].documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                                            >
                                                <FiFile size={16} />
                                                View previously uploaded file
                                            </a>
                                        </div>
                                    )}

                                    {/* File upload area */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select File
                                        </label>
                                        <label htmlFor="file-upload" className="mt-1 flex w-full cursor-pointer justify-center px-6 pt-5 pb-6 border border-primary-navy border-dashed   focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2">
                                            <div className="space-y-1 text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="flex justify-center text-sm text-gray-600">
                                                    <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                        Upload a file
                                                        <input
                                                            id="file-upload"
                                                            name="file-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={handleFileChange}
                                                            disabled={isUploading}
                                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                        />
                                                    </span>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB
                                                </p>
                                            </div>
                                        </label>
                                        {selectedFile && (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                                <span className="font-medium">Selected:</span>
                                                <span>{selectedFile.name}</span>
                                                <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Remark field */}
                                    {/* <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Remark (Optional)
                                        </label>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            placeholder="Add any remarks about your assignment submission..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                            disabled={isUploading}
                                        />
                                    </div> */}

                                    {/* Buttons */}
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setShowUploadModal(false);
                                                setUploadItem(null);
                                                setSelectedFile(null);
                                                setRemark("");
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded"
                                            disabled={isUploading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmUpload}
                                            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isUploading || !selectedFile}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <FiUpload size={16} />
                                                    Upload
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DisplayAssignment;