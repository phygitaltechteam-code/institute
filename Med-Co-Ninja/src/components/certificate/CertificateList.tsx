import React, { useState, useEffect } from 'react';
import { Column } from '@/types/index';
import GenericTable from '../Forms/Table/GenericTable';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatchById } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useGetBatchwiseStudentInterview } from '@/mutations/courseMutation';
import { useGenerateCertificate } from '@/lib/react-query/queriesAndMutations/certificateMutation';
import { CertificatePreviewModal, CertificateDetails } from './CertificatePreviewModal';
import { Eye, Send } from 'lucide-react';
import Certificate from './cirtificatetest/TestCirtificate';

interface CertificateListProps {
  batchId?: string;
}

export interface StudentCertificateRow {
  id: string;
  name: string;
  phoneNumber: string;
  courseName: string;
  duration: string;
  grade: string;
  attendance?: string;
  exams?: string;
  
}

const DURATION_OPTIONS = ['1 Month', '2 Month', '6 Month', '1 Year'];
const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B'];

const CertificateList: React.FC<CertificateListProps> = ({ batchId }) => {
  const { user } = useAuthContext();
  const role = user?.role;

  // Fetch batch details to get course name
  const { data: batchDetail } = useGetBatchById(batchId, role);

  // Extract course name from batch data
  const defaultCourseName = React.useMemo(() => {
    const rawBatch = batchDetail?.data || batchDetail;
    if (typeof rawBatch?.course === 'string') return rawBatch.course;
    if (rawBatch?.course?.courseName) return rawBatch.course.courseName;
    if (rawBatch?.course?.name) return rawBatch.course.name;
    if (rawBatch?.courseName) return rawBatch.courseName;
    if (rawBatch?.batchName) return `Medical Coding - ${rawBatch.batchName}`;
    return 'Medical Coding (CPC)';
  }, [batchDetail]);

  // Calculate default duration from batch start and end dates
  const defaultDuration = React.useMemo(() => {
    const rawBatch = batchDetail?.data || batchDetail;
    if (rawBatch?.startDate && rawBatch?.endDate) {
      const start = new Date(rawBatch.startDate);
      const end = new Date(rawBatch.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedMonths = Math.max(1, Math.round(diffDays / 30));
      
      if (calculatedMonths === 12) return '1 Year';
      return `${calculatedMonths} Month`;
    }
    return '2 Month';
  }, [batchDetail]);

  // Fetch batch-wise students directly using batchId
  const { data: rawStudentData, isLoading: isLoadingStudents } = useGetBatchwiseStudentInterview(batchId, role);

  // Extract student array safely
  const rawStudents = React.useMemo(() => {
    if (Array.isArray(rawStudentData)) return rawStudentData;
    if (rawStudentData?.data?.data && Array.isArray(rawStudentData.data.data)) return rawStudentData.data.data;
    if (rawStudentData?.data && Array.isArray(rawStudentData.data)) return rawStudentData.data;
    if (rawStudentData?.students && Array.isArray(rawStudentData.students)) return rawStudentData.students;
    if (rawStudentData?.items && Array.isArray(rawStudentData.items)) return rawStudentData.items;
    return [];
  }, [rawStudentData]);

  // Local editable state for each student row (duration, grade, courseName)
  const [rowStates, setRowStates] = useState<Record<string, { duration: string; grade: string; courseName: string }>>({});

  // Synchronize local state when students or default course name change
  useEffect(() => {
    if (rawStudents.length > 0) {
      setRowStates((prev) => {
        const newState = { ...prev };
        rawStudents.forEach((st: any) => {
          const id = st.id || st._id || st.user?.id;
          if (id && !newState[id]) {
            newState[id] = {
              duration: defaultDuration,
              grade: 'A',
              courseName: defaultCourseName,
            };
          } else if (id && newState[id] && (!newState[id].courseName || newState[id].courseName === 'Medical Coding (CPC)')) {
            newState[id].courseName = defaultCourseName;
          }
        });
        return newState;
      });
    }
  }, [rawStudents, defaultCourseName, defaultDuration]);

  // Handler for updating duration, grade, or course name per row
  const handleRowStateChange = (studentId: string, field: 'duration' | 'grade' | 'courseName', value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  // Preview Modal state
  const [previewCert, setPreviewCert] = useState<CertificateDetails | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Certificate generation mutation
  const { mutate: generateCertificate, isPending: isSubmitting } = useGenerateCertificate();

  // Open Preview Modal
  const handleOpenPreview = (item: StudentCertificateRow) => {
    const rowState = rowStates[item.id] || { duration: defaultDuration, grade: 'A', courseName: defaultCourseName };
    setPreviewCert({
      studentId: item.id,
      studentName: item.name,
      phoneNumber: item.phoneNumber,
      courseName: rowState.courseName || defaultCourseName,
      duration: rowState.duration || defaultDuration,
      grade: rowState.grade || 'A',
      batchId: batchId,
      username:item.username,
    });
    setIsPreviewOpen(true);
  };

  // Submit Certificate to Backend
  const handleSubmitCertificate = (cert: CertificateDetails, fileBlob?: Blob) => {
    const formData = new FormData() as any;
    
    formData.append("duration", cert.duration);
    formData.append("grade", cert.grade);
    formData.append("issueDate", new Date().toISOString());
    formData.append("studentId", cert.studentId);
    formData.append("studentName", cert.studentName);
    formData.append("courseName", cert.courseName);
    
    if (cert.batchId) formData.append("batchId", cert.batchId);
    if (cert.phoneNumber) formData.append("phoneNumber", cert.phoneNumber);

    if (fileBlob) {
      formData.append("file", fileBlob, `${cert.studentName}_Certificate.pdf`);
    }

    generateCertificate(
      {
        payload: formData,
        studentId: cert.studentId,
        role,
      },
      {
        onSuccess: () => {
          setIsPreviewOpen(false);
        },
      }
    );
  };

  // Table rows formatting
  const tableData: StudentCertificateRow[] = React.useMemo(() => {
    return rawStudents.map((student: any) => {
      const id = student.id || student._id || student.user?.id || 'N/A';
      const name = student.user?.fullname || student.name || student.fullname || 'N/A';
      const phoneNumber = student.phoneNumber || student.mobile || student.phone || 'N/A';
      const rowState = rowStates[id] || { duration: defaultDuration, grade: 'A', courseName: defaultCourseName };

      return {
        id,
        name,
        phoneNumber,
        courseName: rowState.courseName || defaultCourseName,
        duration: rowState.duration || '2 Month',
        grade: rowState.grade || 'A',
        attendance: student.totalAttendance || student.attendance || '100%',
        exams: student.totalExam || student.exams || '100%',
        username:student.username,
        totaldailyTask:student.totaldailyTask,
        completedDailyTask:student.completedDailyTask,
        totalExam:student.totalExam,
        completeExam:student.completeExam,
        finalExam:student.finalExam,
        totalAssignment:student.totalAssignment,
        completedAssignment:student.completedAssignment,
        referals:student.referals|| 0,
        
     };
    });
  }, [rawStudents, rowStates, defaultCourseName]);

  // Columns specification
  const columns: Column<StudentCertificateRow>[] = [
    {
      header: 'Student Name',
      accessor: 'name',
      render: (item) => (
        <span className="">{item.name}</span>
      ),
    },
    {
      header: 'Phone Number',
      accessor: 'phoneNumber',
      render: (item) => (
        <span className="">{item.phoneNumber}</span>
      ),
    },
     {
      header:"Daily Tasks",
      accessor:"dailyTask",
      render:(item)=>{
        return (
          <span className="">{item.completedDailyTask ||0}/{item.totaldailyTask ||0}</span>
        )
      }
    },


    {
      header:"Attendance",
      accessor:"attendance",
      render:(item)=>{
        return (
          <span className="">{item.attendance ||0}%</span>
        )
      }
    },
   
    {
      header:"Exam",
      accessor:"exams",
      render:(item)=>{
        return (
          <span className="">{item.completeExam ||0}/{item.totalExam ||0}</span>
        )
      }
    },
        {
      header:"Final Exam",
      accessor:"finalExam",
      render:(item)=>{
        return (
          <span className="">{item.finalExam ||0}%</span>
        )
      }
    },
    {
      header:"Total Referals",
      accessor:"referals",
      render:(item)=>{
        return (
          <span className="">{item.referals ||0}</span>
        )
      }
    },  

    {
      header:"Assignment",
      accessor:"assignment",
      render:(item)=>{
        return (
          <span className="">{item.completedAssignment ||0}/{item.totalAssignment ||0}</span>
        )
      }
    },

    // {
    //   header: 'Course Name',
    //   accessor: 'courseName',
    //   render: (item) => {
    //     const currentCourse = rowStates[item.id]?.courseName || defaultCourseName;
    //     return (
    //       <input
    //         type="text"
    //         disabled
    //         value={currentCourse}
    //         onChange={(e) => handleRowStateChange(item.id, 'courseName', e.target.value)}
    //         className="w-full min-w-[160px] px-2.5 py-1.5 text-sm bg-primary-navy/10 text-primary-navy dark:text-slate-300  rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
    //         placeholder="Course Name"
    //       />
    //     );
    //   },
    // },
    // {
    //   header: 'Duration',
    //   accessor: 'duration',
    //   render: (item) => {
    //     const currentDuration = rowStates[item.id]?.duration || defaultDuration;
    //     return (
    //       <input
    //         type="text"
    //         disabled
    //         value={currentDuration}
    //         onChange={(e) => handleRowStateChange(item.id, 'duration', e.target.value)}
    //         className="w-full min-w-[100px] px-2.5 py-1.5 text-sm bg-primary-navy/10 text-primary-navy dark:text-slate-300 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
    //         placeholder="Duration"
    //       />
    //     );
    //   },
    // },
    {
      header: 'Grade',
      accessor: 'grade',
      render: (item) => {
        const currentGrade = rowStates[item.id]?.grade || 'A';
        return (
          <select
            value={currentGrade}
            onChange={(e) => handleRowStateChange(item.id, 'grade', e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {GRADE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (item) => {
        const currentCourse = rowStates[item.id]?.courseName || defaultCourseName;
        const currentDuration = rowStates[item.id]?.duration || '2 Month';
        const currentGrade = rowStates[item.id]?.grade || 'A';

        const certDetails: CertificateDetails = {
          studentId: item.id,
          studentName: item.name,
          phoneNumber: item.phoneNumber,
          courseName: currentCourse,
          duration: currentDuration,
          grade: currentGrade,
          batchId: batchId,
          username:item.username
        };

        return (
          <div className="flex items-center gap-2">
            <GenericButton
              type="button"
              onClick={() => handleOpenPreview(item)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-navy transition shadow-sm"
            >
              <Eye className="h-3.5 w-3.5 text-teal-400" />
              Preview
            </GenericButton>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Student Certificate Table */}
      <div>
        <GenericTable<StudentCertificateRow>
          title="Certificate List"
          columns={columns}
          data={tableData}
          showSrNo={true}
          searchAble={true}
        />

      </div>

      {/* Certificate Preview Modal */}
      <CertificatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        certificate={previewCert}
        onGenerateSubmit={handleSubmitCertificate}
        isSubmitting={isSubmitting}
      />

     
    </div>
  );
};

export default CertificateList;
