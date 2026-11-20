import GenericButton from "@/components/Forms/Buttons/GenericButton";
import GenericTable from "@/components/Forms/Table/GenericTable";
import { useAuthContext } from "@/context/AuthContext";
import { useAddRemarks, useGetExamReview } from "@/lib/react-query/queriesAndMutations/examMutations";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Column } from "@/types";
import { useState } from "react";
import { FiEdit, FiSave } from "react-icons/fi";
import { MdDelete } from "react-icons/md";

type examtype = {
    id: string;
    srNo: number;
    studentId: string;
    examId: string;
    name: string;
    phone: string;
    marks: string;
    remark: string;
    actions: string;
}

export const ExamReviewTable = () => {
    const { id: examID } = useParams({ strict: false }) as { id: string } // exam id
    const navigate = useNavigate()
    const user = useAuthContext()
    const role = user?.role

    const { data: examResultData, isLoading } = useGetExamReview(examID, role)
    const { mutate: useAddRemark } = useAddRemarks()

    const [remarks, setRemarks] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleSave = (rowRemark: string, rowItemId: string) => {
        useAddRemark({ id: rowItemId, remarks: rowRemark, role: role })
    }

    const rawList: any[] = examResultData?.data?.data ?? examResultData?.data ?? examResultData ?? [];

    const mapData = Array.isArray(rawList) ? rawList.map((item: any, index: number) => ({
        id: item?.id,
        srNo: index + 1, // Added serial number
        studentId: item?.studentId,
        examId: item?.examId,
        name: item?.student?.user?.fullname,
        phone: item?.student?.user?.phoneNumber,
        marks: item?.marks,
        remark: item?.remarks,
        wrongAns: item?.wrongAnswer,
        givenAns: item?.givenAns,
        notSubmitted: item?.notSubmitted,
        time: item?.time,
    })) : [];

    console.log("Map Data", mapData)

    const examReviewTable: Column<examtype>[] = [
        {
            header: "Sr No.",
            accessor: "srNo",
            render: (item: examtype) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.srNo}
                </span>
            )
        },
        {
            header: "Name",
            accessor: "name"
        },
        {
            header: "Number",
            accessor: "phone"
        },
        {
            header: "Marks",
            accessor: "marks"
        },
        {
            header:"Given Answer",
            accessor:"givenAns"
        },
        {
            header:"Wrong Answer",
            accessor:"wrongAns"
        },
        {
            header:"Not Submitted",
            accessor:"notSubmitted"
        },
        {
            header:"Time",
            accessor:"time"
        },
        {
            header: "Remark",
            accessor: "remark",
            render: (item: examtype, index?: number) => {
                const rowIndex = index ?? 0;
                const isEditing = editingIndex === rowIndex;

                if (isEditing) {
                    return (
                        <input
                            type="text"
                            value={remarks[rowIndex] ?? item.remark ?? ""}
                            onChange={(e) =>
                                setRemarks((prev) => ({ ...prev, [rowIndex]: e.target.value }))
                            }
                            placeholder="Enter remark"
                            autoFocus
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1 text-sm text-black outline-none transition focus:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    );
                }

                return (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.remark ?? "-"}
                    </span>
                );
            },
        },
        {
            header: "Action",
            accessor: "actions",
            render: (item: examtype, index?: number) => {
                const rowIndex = index ?? 0;
                const isEditing = editingIndex === rowIndex;
                return (
                    <div className="flex items-center justify-center gap-1">
                        <GenericButton
                            variant="save"
                            size="sm"
                            onClick={() => {
                                const rowRemark = remarks[rowIndex] ?? item.remark;
                                handleSave(rowRemark, item.id);
                                setEditingIndex(null);
                            }}
                        >
                            <FiSave className=" h-5 w-5" />
                        </GenericButton>

                        <GenericButton
                            variant="edit"
                            size="sm"
                            onClick={() => setEditingIndex(isEditing ? null : rowIndex)}
                        >
                            <FiEdit className=" h-5 w-5" />
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

            <GenericTable
                title="Review Student Exam"
                data={mapData}
                columns={examReviewTable}
                onRowClick={(rowData) => {
                    console.log("Row Data:", rowData);
                    console.log("Student ID:", rowData.studentId);
                    console.log("Exam ID:", rowData.examId);
                    role === "ADMIN" ? navigate({
                        to: `/admin/student-exam-analysis/${rowData.studentId}/${rowData.examId}`,
                    }) : navigate({
                        to: `/faculty/student-exam-analysis/${rowData.studentId}/${rowData.examId}`,
                    })
                }}
            />
        </div>
    )
}