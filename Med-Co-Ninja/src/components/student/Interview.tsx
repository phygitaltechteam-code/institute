import { useStudentGetInterview, useStudentUpdateInterview } from "@/lib/react-query/queriesAndMutations/studentInteviewMutation";
import { Column } from "@/types";
import GenericTable from "../Forms/Table/GenericTable";
// import { formatDate } from "@/utils/utilities";
import { formatDate, formatTime } from "@/utils/dateTimeUtils";
import StatusDropdownCell from "../Forms/DropDown/StatusDropdownCell";
import { Eye, X, Building2, Briefcase, DollarSign, Calendar, Clock, Video, MapPin } from "lucide-react";
import { useState } from "react";
import GenericButton from "../Forms/Buttons/GenericButton";

type interviewSchema = {
    id: string;
    companyName: string,
    jobRole: string,
    requireSkill: string,
    salary: string,
    interviewDate: string,
    interviewTime: string,
    mode: string,
    location: string,
    status: string,
    jobDescription?: string,
    otherDetails?: string,
}

const Interview = () => {

    const [selectedInterview, setSelectedInterview] = useState<interviewSchema | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewMore = (item: interviewSchema) => {
        setSelectedInterview(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInterview(null);
    };

    const intervieTable: Column<interviewSchema>[] =
        [
            {
                header: "Company Name",
                accessor: "companyName",
            },
            {
                header: "Job Role",
                accessor: "jobRole",
            },
            // {
            //     header: "Require Skill",
            //     accessor: "requireSkill",
            // },
            {
                header: "Salary",
                accessor: "salary",
            },
            {
                header: "Interview Date",
                accessor: "interviewDate",
            },
            {
                header: "Interview Time",
                accessor: "interviewTime",
            },
            {
                header: "Mode",
                accessor: "mode",
            },
            {
                header: "Location",
                accessor: "location",
            },
            {
                header: "Status",
                accessor: "status",
                render: (item: interviewSchema) => (

                    <div>
                        {item.status ==="SCHEDULED" ?(<StatusDropdownCell
                        value={item.status ?? ''}
                        placeholder="Select Status"
                        options={[
                            { label: "Scheduled",           value: "SCHEDULED" },
                            { label: "Interview Completed", value: "COMPLETED" },
                            { label: "Placed",              value: "PLACED" },
                            { label: "Rejected",            value: "REJECTED" },
                            { label: "Not Attended",        value: "NOT_ATTENDED" },
                        ]}
                        onChange={(newStatus) => {
                            updateInterviewStatus({ id: item.id, status: newStatus });
                        }}
                    />): (<p>{item.status}</p>)}
                    </div>
                    
                ),
            },
            {
                header: "View More Details",
                accessor: (item: any) => item,
                render: (item: any) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewMore(item);
                        }}
                        className="inline-flex items-center justify-center rounded p-1.5 text-slate-600 hover:bg-accent-teal/10 hover:text-accent-teal transition-colors dark:text-bodydark"
                        title="View More Details"
                    >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                ),
            }
        ]




    const { data: interviewData, isLoading, isError } = useStudentGetInterview()
    const { mutate: updateInterviewStatus } = useStudentUpdateInterview()


    // API returns { statusCode, status, data: [...] } — drill into .data (or .data.data)
    const rawList: any[] = interviewData?.data?.data ?? interviewData?.data ?? interviewData ?? [];

    console.log("interviewData raw:", interviewData, "list:", rawList);

    const interviewTableData = rawList.map((i: any) => ({
        id: i?.id,
        companyName: i?.placement?.companyName,
        jobRole: i?.placement?.jobRole,
        requireSkill: i?.placement?.requiredSkills,
        salary: i?.placement?.salary,
        interviewDate: formatDate(i?.interviewDate),
        interviewTime: formatTime(i?.interviewDate),
        mode: i?.interviewMode,
        location: i?.location,
        status: i?.status,
        jobDescription: i?.placement?.jobDescription,
        otherDetails: i?.placement?.otherDetails,
    }));


    return (
        <div>
            <GenericTable
                title="Interview"
                columns={intervieTable}
                data={interviewTableData ?? []}
                showSrNo={true}
            />

            {/* View More Details Modal */}
            {isModalOpen && selectedInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-primary-navy rounded-xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-4 shadow-2xl sm:p-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-primary-navy dark:text-pure-white sm:text-xl">
                                Interview Details
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Compact Details Grid */}
                        <div className="grid grid-cols-4 md:grid-cols-4 gap-y-4 gap-x-2 mb-4 text-sm">
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Company</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.companyName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Role</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.jobRole || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Salary</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.salary || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Date</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.interviewDate || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Time</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.interviewTime || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-black dark:text-gray-200">Mode</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.mode || 'N/A'}</p>
                            </div>
                            <div className="">
                                <p className="font-semibold text-black dark:text-gray-200">Location</p>
                                <p className="text-gray-600 dark:text-gray-400">{selectedInterview.location || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
                            {/* Job Description */}
                            {selectedInterview.jobDescription && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                                        Job Description
                                    </h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedInterview.jobDescription}
                                    </p>
                                </div>
                            )}

                            {/* Required Skills */}
                            {selectedInterview.requireSkill && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                                        Required Skills
                                    </h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedInterview.requireSkill}
                                    </p>
                                </div>
                            )}

                            {/* Other Details */}
                            {selectedInterview.otherDetails && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                                        Other Details
                                    </h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedInterview.otherDetails}
                                    </p>
                                </div>
                            )}


                        </div>

                        {/* Close Button */}
                        {/* <div className="mt-2 pt-2 border-t border-stroke dark:border-gray-700 flex justify-end">
                            <GenericButton
                                onClick={handleCloseModal}
                                label="close"
                                children="Close"
                                variant="navy"
                            />
                                
                           
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interview;