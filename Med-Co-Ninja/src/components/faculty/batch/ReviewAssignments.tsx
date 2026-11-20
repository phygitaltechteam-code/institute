import GenericButton from "@/components/Forms/Buttons/GenericButton";
import GenericTable from "@/components/Forms/Table/GenericTable";
import { useAuthContext } from "@/context/AuthContext";
import { useAddAssignmentRemarks, useGetAssignmentReview } from "@/lib/api/admin/assignmentReview";
import { useAddDailyTaskRemarks, useGetDailyReview } from "@/lib/react-query/queriesAndMutations/dailytaskmutation";
import { useAddRemarks, useGetExamReview } from "@/lib/react-query/queriesAndMutations/examMutations";
import { Column } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { FiSave, FiEye } from "react-icons/fi";
import { MdDelete } from "react-icons/md";

type examtype = {
    id: string;
    name: string;
    phone: string;
    status: string;
    remark: string;
    actions: string;
    submittedtask?: string;
}

export const ReviewAssignments = () => {
    // strict: false allows this component to be reused across different routes (admin/faculty)
    const { id } = useParams({ strict: false }) as { id: string };
    const navigate = useNavigate()
    const user = useAuthContext()
    const role = user?.role

    const { data: assignmentReview, isLoading , refetch } = useGetAssignmentReview(id, role)
    console.log("daily task review",assignmentReview)
    const { mutate: useAddRemark } = useAddAssignmentRemarks()

    const [remarks, setRemarks] = useState<Record<number, string>>({});
    const [savedRows, setSavedRows] = useState<Record<number, boolean>>({});


    const handleSave = (rowRemark: string, rowItemId: string) => {

        useAddRemark({ id: rowItemId, remarks: rowRemark, role: role })
        refetch()
    }

const task = assignmentReview;

const mapData =
  task?.assignmentCompletions
?.map((completion: any) => ({

    id: completion?.id,
    name: completion?.student?.user?.fullname ?? "N/A",
    phone: completion?.student?.user?.phoneNumber ?? "N/A",
    status: completion?.completed ? "Completed" : "Pending",
    remark: completion?.remark ?? "",
    submittedtask:completion?.documentUrl
  })) ?? [];

console.log(mapData);



console.log("map data", mapData);

    const examReviewTable: Column<examtype>[] = [
        {
            header: "Name",
            accessor: "name"
        },
        {
            header: "Number",
            accessor: "phone"
        },
        {
            header: "Status",
            accessor: "status"
        },
        {
            header: "Submitted Task",
            accessor: "submittedtask",
            render: (item: examtype) => (
                item.submittedtask ? (
                    <a
                        href={item.submittedtask}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-navy hover:text-opacity-80 transition flex items-center justify-center"
                    >
                        <FiEye className="h-5 w-5" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
        {
            header: "Remark",
            accessor: "remark",
            render: (item: examtype, index?: number) => {
                const rowIndex = index ?? 0;
                return (
                    <input
                        type="text"
                        value={remarks[rowIndex] ?? item.remark ?? ""}
                        onChange={(e) => {
                            setSavedRows((prev) => ({ ...prev, [rowIndex]: false }));
                            setRemarks((prev) => ({ ...prev, [rowIndex]: e.target.value }));
                        }}
                        placeholder="Enter remark"
                        className="w-full rounded border border-stroke bg-transparent px-2 py-1 text-sm text-black outline-none transition focus:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                );
            },
        },
        {
            header: "Action",
            accessor: "actions",
            render: (item: examtype, index?: number) => {
                const rowIndex = index ?? 0;
                const isDirty = remarks[rowIndex] !== undefined && !savedRows[rowIndex];
                return (
                    <div className="flex items-center justify-center ">
                     
                            <GenericButton
                                variant=""
                                size="sm"
                                onClick={() => {
                                    const rowRemark = remarks[rowIndex] ?? item.remark;
                                    handleSave(rowRemark, item.id);
                                    setSavedRows((prev) => ({ ...prev, [rowIndex]: true }));
                                }}
                            >
                                <FiSave className="h-5 w-5" />
                            </GenericButton>
                      
                    </div>
                );
            },
        },
    ]


    return (
        <div>
            <div className="p-3">
                <GenericButton
                    label="Back"
                    children="Back"
                    onClick={() => window.history.back()}
                    variant="navy"
                />
            </div>

            <GenericTable title="Student Assignments" showSrNo={true} data={mapData} columns={examReviewTable}

                // onRowClick={({ id }) => navigate({
                //     to: "/student/resultanalysis/$id", params: { id: String(id) },
                // })}
            />
        </div>
    )
}