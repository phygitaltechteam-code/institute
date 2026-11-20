// components/faculty/Referal/ReferalIncome.tsx
import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import GenericButton from '@/components/Forms/Buttons/GenericButton'
import GenericTable from '@/components/Forms/Table/GenericTable'
import { Column } from '@/types/index'
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { useAuthContext } from '@/context/AuthContext';
import { FiUser } from 'react-icons/fi';

interface ReferalIncomeProps {
    leadId?: string;
    batchId?: string;
    studentId?: string;
    studentName?: string;
    leads?: any[];
}

const ReferalIncome = ({
    leadId,
    batchId: propBatchId,
    studentId: propStudentId,
    studentName: propStudentName,
    leads: propLeads
}: ReferalIncomeProps) => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const role = user?.role;
    const location = useLocation();

    // Get data from props or location state
    const stateData = location.state as any;
    const finalLeadId = leadId || stateData?.leadId || '';
    const finalBatchId = propBatchId || stateData?.batchId || '';
    const finalStudentId = propStudentId || stateData?.studentId || '';
    const finalStudentName = propStudentName || stateData?.studentName || '';
    const finalLeads = propLeads || stateData?.leads || [];

    // Get referId from URL params
    const params = useParams({ strict: false });
    const referId = (params.id || params.referId) as string;

    console.log('ReferalIncome - leadId:', finalLeadId);
    console.log('ReferalIncome - studentName:', finalStudentName);
    console.log('ReferalIncome - leads:', finalLeads);

    // State for table data
    const [tableData, setTableData] = useState<any[]>([]);

    // Transform leads data to table format
    useEffect(() => {
        if (finalLeads && finalLeads.length > 0) {
            const transformedData = finalLeads.map((lead: any, index: number) => ({
                id: lead.id || index,
                studentName: finalStudentName || 'N/A',
                leadName: lead.name || 'N/A',
                phoneNumber: lead.phoneNumber || 'N/A',
                source: lead.source || 'N/A',
                course: lead.course?.name || 'N/A',
                qualification: lead.qualification || 'N/A',
                interested: lead.interested || 'N/A',
                status: lead.status || 'N/A',
                batchName: lead.batch?.name || lead.batchName || 'N/A',
                createdAt: lead.createdAt ? formatDateTimeAuto(lead.createdAt) : 'N/A',
            }));
            setTableData(transformedData);
        } else {
            setTableData([]);
        }
    }, [finalLeads, finalStudentName]);

    type TableRow = {
        id: string;
        studentName: string;
        leadName: string;
        phoneNumber: string;
        source: string;
        course: string;
        qualification: string;
        interested: string;
        status: string;
        batchName: string;
        createdAt: string;
    };

    const handleBack = () => {
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
            // navigate({
            //     to: '/admin/batch/batch-dashboard/$id',
            //     state: { batchId: finalBatchId }
            // });
            window.history.back();
        } else {
            // navigate({
            //     to: '/faculty/batch/batch-dashboard/$id',
            //     state: { batchId: finalBatchId }
            // });
            window.history.back();
        }
    };

    // Handle row click - Navigate to student leads page
    const handleRowClick = (row: TableRow) => {
        const idToPass = row.id || finalLeadId || finalStudentId;

        if (!idToPass || idToPass === 'N/A') {
            console.error('No valid ID to navigate');
            return;
        }

        if (role === 'ADMIN' || role === 'SUPERADMIN') {
            navigate({
                to: '/admin/referal/studentreferleads/$id',
                params: { id: idToPass },
                state: {
                    studentId: finalStudentId || idToPass,
                    studentName: row.studentName,
                    batchId: finalBatchId
                }
            });
        } else if (role === 'TEACHER' || role === 'FACULTY') {
            navigate({
                to: '/faculty/referal/studentreferleads/$id',
                params: { id: idToPass },
                state: {
                    studentId: finalStudentId || idToPass,
                    studentName: row.studentName,
                    batchId: finalBatchId
                }
            });
        } else {
            navigate({
                to: '/admin/referal/studentreferleads/$id',
                params: { id: idToPass },
                state: {
                    studentId: finalStudentId || idToPass,
                    studentName: row.studentName,
                    batchId: finalBatchId
                }
            });
        }
    };

    const columns: Column<TableRow>[] = [
        {
            header: "Sr.No",
            accessor: "id",
            render: (item: TableRow, index: number) => {
                return index + 1;
            }
        },
          {
            accessor: "createdAt",
            header: "Created At",
        },
        {
            accessor: "leadName",
            header: "Lead Name",
            render: (item: TableRow) => (
                <span>
                    {item.leadName}
                </span>
            ),
        },
        {
            accessor: "phoneNumber",
            header: "Phone",
        },
      
        
        {
            accessor: "source",
            header: "Source",
        },
        {
            accessor: "course",
            header: "Course",
        },
         {
            accessor: "batchName",
            header: "Batch",
        },
        {
            accessor: "qualification",
            header: "Qualification",
        },
        {
            accessor: "interested",
            header: "Interested",
        },
       

    ];

    return (
        <div className="p-2">
            <GenericButton
                onClick={handleBack}
                variant="navy"
                className="mb-3"
                aria-label="Go back"
            >
                <FaArrowLeft className="" />
                <span>Back</span>
            </GenericButton>

            <GenericTable
                columns={columns}
                data={tableData}
                title={finalStudentName ? `Leads - ${finalStudentName}` : "Referral Leads"}
                showSrNo={false}
                searchAble={true}
                itemsPerPage={10}
                onRowClick={handleRowClick}
            />
        </div>
    );
};

export default ReferalIncome;