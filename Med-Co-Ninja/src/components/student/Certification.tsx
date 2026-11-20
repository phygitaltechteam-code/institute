import { useGetStudentDataForPlacementForm } from "@/lib/api/student/placementorm";
import { Download } from "lucide-react";
import { formatDate } from "@/utils/dateTimeUtils";
import GenericTable, { Column } from "@/components/Forms/Table/GenericTable";

type CertRow = {
    name: string;
    email: string;
    phone: string;
    qualification: string;
    duration: string;
    grade: string;
    issueDate: string;
    certificate: string;
};

const Certificate = () => {
    const { data: response, isLoading } = useGetStudentDataForPlacementForm();

    // Handle multiple possible response shapes
    const student = response?.data?.data ?? response?.data ?? response;

    const handleDownload = (url: string, name: string) => {
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = `certificate_${name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-navy border-t-transparent" />
            </div>
        );
    }

    const tableData: CertRow[] = student
        ? [
              {
                  name: student.user?.fullname ?? "-",
                  email: student.user?.email ?? "-",
                  phone: student.user?.phoneNumber ?? "-",
                  qualification: student.qualification ?? "-",
                  duration: student.duration ?? "-",
                  grade: student.grade ?? "-",
                  issueDate: student.issueDate ? formatDate(student.issueDate) : "-",
                  certificate: student.certificate ?? "",
              },
          ]
        : [];

    const columns: Column<CertRow>[] = [
        { accessor: "name",          header: "Name" },
        { accessor: "email",         header: "Email" },
        { accessor: "phone",         header: "Phone" },
        { accessor: "qualification", header: "Qualification" },
        { accessor: "duration",      header: "Duration" },
        { accessor: "grade",         header: "Grade" },
        { accessor: "issueDate",     header: "Issue Date" },
        {
            accessor: "certificate",
            header: "Action",
            render: (row) =>
                row.certificate ? (
                    <button
                        onClick={() => handleDownload(row.certificate, row.name)}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
                        title="Download Certificate"
                    >
                        <Download size={13} />
                        Download
                    </button>
                ) : (
                    <span className="rounded-lg bg-yellow-50 px-2 py-1 text-xs text-yellow-600">
                        Not issued
                    </span>
                ),
        },
    ];

    return (
        <div className="">
            <GenericTable
                data={tableData}
                columns={columns}
                title="My Certificate"
                showSrNo
            />
        </div>
    );
};

export default Certificate;