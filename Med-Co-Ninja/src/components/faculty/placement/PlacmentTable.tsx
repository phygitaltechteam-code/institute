import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { FiEdit } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { RiFileExcel2Line } from 'react-icons/ri';
import * as XLSX from 'xlsx';

import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

import {
  useAssignStudentsToPlacement,
  useDeletePlacement,
  useGetAssignedStudents,
  useGetPlacement,
} from '@/lib/react-query/queriesAndMutations/placementMutation';
import { useGetCourses } from '@/mutations/courseMutation';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useGetStudent } from '@/lib/react-query/queriesAndMutations/studentDetails';
import { assignInterviewToStudent } from '@/lib/react-query/queriesAndMutations/studentplacement';
import { useAuthContext } from '@/context/AuthContext';

// Local pieces
import { assignmentSchema, AssignmentFormValues, PlacementRow } from './types';
import { getResponseArray, formatDeadline, getStudentName } from './utils';
import AssignedStudentsCount from './AssignedStudentsCount';
// InterestedStudentsCount removed — count derived from placementsData.placementStudents
import AssignStudentModal from './AssignStudentModal';
import ViewStudentsModal from './ViewStudentsModal';
import InterviewScheduleModal from './InterviewScheduleModal';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateTimeUtils';

const PlacementTable = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role || 'ADMIN';

  // ── Queries & Mutations ────────────────────────────────────────────────────
  const { data: placementsData, refetch: refetchPlacements } = useGetPlacement(role);
  const { mutate: deletePlacement } = useDeletePlacement(role);
  const { mutate: assignStudents, isPending: isAssigning } = useAssignStudentsToPlacement();
  const { data: coursesData, isLoading: isCoursesLoading } = useGetCourses(role);
  const { data: batchData, isLoading: isBatchLoading } = useGetBatches(role);
  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudent(role);
  console.log("student data....",studentsData)
  const { mutate: assignInterview } = assignInterviewToStudent();
  const queryClient = useQueryClient();


  // ── Modal state ────────────────────────────────────────────────────────────
  const [openAddStudentModal, setOpenAddStudentModal] = useState(false);
  const [openViewStudentsModal, setOpenViewStudentsModal] = useState(false);
  const [openInterestedModal, setOpenInterestedModal] = useState(false);

  // ── Selection state ────────────────────────────────────────────────────────
  const [selectedPlacementId, setSelectedPlacementId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [viewingPlacementId, setViewingPlacementId] = useState('');
  const [interestedPlacementId, setInterestedPlacementId] = useState('');

  // ── Interview modal state ──────────────────────────────────────────────────
  const [interestedStudents, setInterestedStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [interviewMode, setInterviewMode] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ── Assigned students for view modal ──────────────────────────────────────
  const {
    data: assignedStudentsResponse,
    isLoading: isAssignedStudentsLoading,
    isError: isAssignedStudentsError,
  } = useGetAssignedStudents(viewingPlacementId, role);

  const methods = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { courseId: '', batchId: '', studentIds: [] },
  });
  const { handleSubmit, reset, watch, setValue, control } = methods;
  const watchCourseId = watch('courseId');
  const watchBatchId = watch('batchId');

  useEffect(() => {
    setSelectedCourseId(watchCourseId || '');
    setValue('batchId', '');
    setValue('studentIds', []);
    setSelectedBatchId('');
  }, [watchCourseId, setValue]);

  useEffect(() => {
    setSelectedBatchId(watchBatchId || '');
    setValue('studentIds', []);
  }, [watchBatchId, setValue]);

  // ── Derived options ────────────────────────────────────────────────────────
  const courseOptions = useMemo(() => {
    return getResponseArray(coursesData).map((course: any) => ({
      value: String(course.id || course._id),
      label: course.name || course.courseName || 'Unnamed Course',
    }));
  }, [coursesData]);

  const batchOptions = useMemo(() => {
    const batches = getResponseArray(batchData);
    const filtered = selectedCourseId
      ? batches.filter(
          (batch: any) =>
            String(batch.courseId || batch.course?.id || batch.course?._id) ===
            String(selectedCourseId),
        )
      : [];
    return filtered.map((batch: any) => ({
      value: String(batch.id || batch._id),
      label: batch.name || batch.batchName || 'Unnamed Batch',
    }));
  }, [batchData, selectedCourseId]);

  const studentOptions = useMemo(() => {
    if (!selectedBatchId) return [];
    const students = getResponseArray(studentsData);
    const filtered = students.filter((student: any) => {
      const batchStudents = student.batchStudents;
      if (!Array.isArray(batchStudents)) return false;
      return batchStudents.some(
        (bs: any) =>
          String(bs.batchId || bs.batch?.id || bs.batch?._id) === String(selectedBatchId),
      );
    });

    const seen = new Set<string>();
    return filtered
      .filter((student: any) => {
        const id = String(student.id || student._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((student: any, index: number) => ({
        value: String(student.id || student._id),
        label: getStudentName(student, index),
      }));
  }, [studentsData, selectedBatchId]);

  // Student details table data for the modal
  const studentTableData = useMemo(() => {
    if (!selectedBatchId) return [];
    const students = getResponseArray(studentsData);
    const filtered = students.filter((student: any) => {
      const batchStudents = student.batchStudents;
      if (!Array.isArray(batchStudents)) return false;
      return batchStudents.some(
        (bs: any) =>
          String(bs.batchId || bs.batch?.id || bs.batch?._id) === String(selectedBatchId),
      );
    });
    return filtered.map((item: any) => ({
      id: item.userId || item.id || item._id,
      name: item.user?.fullname || item.name || 'N/A',
      attendance: item._count?.attendanceEntries ?? item.attendance ?? '-',
      totalExams: item.totalExams ?? '-',
      finalExam: item.finalExam ?? '-',
      placementForm: item.placementForm ? item.placementForm === "true" ? "yes" : "no" : "no",
      internship: item.internship ?? '-',
      pendingFees: item.pendingFees ?? '-',
      followUpDate:formatDate( Array.isArray(item.feeFollowups) && item.feeFollowups.length > 0
        ? item.feeFollowups[item.feeFollowups.length - 1]?.followUpDate ?? '-'
        : item.followUpDate )?? '-',
      interviewsGiven: item.interviewsGiven ?? '-',
      placementReceived: item.placementReceived ?? '-',
      referrals: item.referrals ?? '-',
    }));
  }, [studentsData, selectedBatchId]);

  console.log("studenttablle",studentTableData)

  const placementData = useMemo(() => {
    return getResponseArray(placementsData).map((placement: any) => ({
      id: String(placement.id || placement._id),
      PN: placement.PN || placement.pn || 0,
      companyName: placement.companyName || '',
      jobRole: placement.jobRole || '',
      qualification: placement.qualification || '',
      experience: placement.experience || '',
      deadline: placement.deadLine ? formatDate(placement.deadLine) : '-',
      time:placement.deadLine? formatTime(placement.deadLine):'-',
      interviewMode: placement.interviewMode || '',
      workSchedule: placement.workSchedule || '',
      salary: placement.salary || '',
    }));
  }, [placementsData]);

  console.log(placementData)

  const assignedStudentsForView = useMemo(() => {
    return getResponseArray(assignedStudentsResponse).map((assignment: any, index: number) => {
      const student = assignment?.student || assignment?.studentDetails || assignment;
      return {
        id: String(student?.id || student?._id || assignment?.studentId || assignment?.id || index),
        name: getStudentName(assignment, index),
      };
    });
  }, [assignedStudentsResponse]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const closeAssignModal = () => {
    setOpenAddStudentModal(false);
    reset();
    setSelectedPlacementId('');
    setSelectedCourseId('');
    setSelectedBatchId('');
  };

  const handleAssignStudent = (item: PlacementRow) => {
    if (!item.id) { toast.error('Placement ID is missing'); return; }
    setSelectedPlacementId(item.id);
    reset({ 
      courseId: '', 
      batchId: '', 
      studentIds: [],
      interviewLocation: '',
      interviewTime: '',
      interviewDate: '',
      interviewMode: ''
    });
    setSelectedCourseId('');
    setSelectedBatchId('');
    setOpenAddStudentModal(true);
  };

  const onAssignSubmit = (data: AssignmentFormValues) => {
    if (!selectedPlacementId) { toast.error('No placement selected'); return; }
    console.log("data",data);
    // Merge date + time into a single ISO string
    let interviewDateISO = '';
    if (data.interviewDate && data.interviewTime) {
      const dateObj = new Date(`${data.interviewDate}T${data.interviewTime}:00`);
      if (!isNaN(dateObj.getTime())) {
        interviewDateISO = dateObj.toISOString();
      }
    } else if (data.interviewDate) {
      const dateObj = new Date(data.interviewDate);
      if (!isNaN(dateObj.getTime())) {
        interviewDateISO = dateObj.toISOString();
      }
    }

    assignStudents(
      {
        placementId: selectedPlacementId,
        interviewDetails: {
          student: data.studentIds.map(id => ({ studentId: id })),
          interviewMode: data.interviewMode,
          interviewDate: interviewDateISO,   // merged date+time as ISO
          location: data.interviewLocation,
        },
        role,
      },
      {
        onSuccess: () => {
          // useAssignStudentsToPlacement already invalidates ['placements'] internally
          closeAssignModal();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to assign students');
        },
      },
    );
  };

  const handleViewStudents = (item: PlacementRow) => {
    if (!item.id) { toast.error('Placement ID is missing'); return; }
    setViewingPlacementId(item.id);
    setOpenViewStudentsModal(true);
  };

  const handleInterestedStudents = (item: PlacementRow) => {
    if (!item.id) { toast.error('Placement ID is missing'); return; }
    setInterestedPlacementId(item.id);

    // Read placementStudents directly from the placements list API response
    // (the API already returns placementStudents embedded in each placement)
    const rawPlacement = getResponseArray(placementsData).find((p: any) => String(p.id) === String(item.id));
    console.log("intrested student",rawPlacement)


  const placementFormData =(rawPlacement?.placementStudents ?? [])
  .map((ps: any) => {
    const form = ps.student?.placementForms;

    return {
      id: ps.student?.id ?? ps.studentId ?? null,

      name: form?.name ?? '',
      email: form?.email ?? '',
      phoneNumber: form?.phone1 ?? '',

      degrees: (form?.degrees ?? []).map((degree: any) => ({
        id: degree.id,
        score: degree.score,
        course: degree.course,
        passingYear: degree.passingyear,
        graduationType: degree.graduation_type,
      })),

      experience: form?.exprience ?? '',
      experienceYears: form?.experience_years ?? 0,
      workProfile: form?.workProfile ?? '',
      companies: form?.companies ?? '',

      isCurrentlyWorking: form?.isCurrentlyWorking ?? false,
      currentWorking: form?.current_working ?? '',
      currentProfile: form?.currentProfile ?? '',
      currentCompany: form?.currentCompany ?? '',
    };
  })
  .filter((student: any) => student.id != null);

console.log("pf data",placementFormData)


    const students = (rawPlacement?.placementStudents ?? []).map((ps: any) => ({
      id: ps.student?.id ?? ps.studentId ?? null,
      name: ps.student?.user?.fullname || ps.student?.user?.name || 'Unknown Student',
    })).filter((s: any) => s.id != null);

    setInterestedStudents(students);
    setSelectedStudentIds(students.map((s: any) => s.id));
    setInterviewMode('');
    setInterviewDate('');
    setInterviewTime('');
    setInterviewLocation('');
    setIsDropdownOpen(false);
    setOpenInterestedModal(true);
  };

  const handleSaveInterviewDetails = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    const validIds = selectedStudentIds.filter((id) => id != null && id !== '');
    if (validIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    // Merge date + time into a single ISO string
    let interviewDateISO = '';
    if (interviewDate && interviewTime) {
      const dateObj = new Date(`${interviewDate}T${interviewTime}:00`);
      if (!isNaN(dateObj.getTime())) {
        interviewDateISO = dateObj.toISOString();
      }
    } else if (interviewDate) {
      const dateObj = new Date(interviewDate);
      if (!isNaN(dateObj.getTime())) {
        interviewDateISO = dateObj.toISOString();
      }
    }

    const payLoad = {
      student: validIds.map((id) => ({ studentId: id })),
      interviewMode: interviewMode,
      interviewDate: interviewDateISO,   // merged date+time as ISO
      location: interviewLocation,
    };
    console.log('[DEBUG] sending payload:', payLoad);
    assignInterview(
      { placementId: interestedPlacementId, data: payLoad, role },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['placements'] });
          queryClient.invalidateQueries({ queryKey: ['assigned-students'] });
          setOpenInterestedModal(false);
        },
      },
    );
  };

  const handleEdit = (id: string) => {
    role === 'ADMIN' ? navigate({
      to: '/admin/placement/edit-placement/$placementId',
      params: { placementId: id },
    }) : navigate({
      to: '/faculty/placement/edit-placement/$placementId',
      params: { placementId: id },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this placement?')) {
      deletePlacement(id);
    }
  };

  const handleExcelDownload = (item: PlacementRow) => {
    const rawPlacement = getResponseArray(placementsData).find(
      (p: any) => String(p.id) === String(item.id),
    );

    const placementFormData = (rawPlacement?.placementStudents ?? [])
      .map((ps: any) => {
        const form = ps.student?.placementForms;

        // Get the degrees array and pick the last two
        const degrees: any[] = form?.degrees ?? [];
        const lastTwo = degrees.slice(-2);
        const degree1 = lastTwo.length >= 1 ? lastTwo[0] : null;
        const degree2 = lastTwo.length >= 2 ? lastTwo[1] : null;

        return {
          ID: ps.student?.id ?? ps.studentId ?? '',
          Name: form?.name ?? '',
          Email: form?.email ?? '',
          'Phone Number': form?.phone1 ?? '',

          // Degree 1 (second-to-last)
          'Degree 1 Type': degree1?.graduation_type ?? '',
          'Degree 1 Course': degree1?.course ?? '',
          'Degree 1 Score': degree1?.score ?? '',
          'Degree 1 Passing Year': degree1?.passingyear ?? '',

          // Degree 2 (last)
          'Degree 2 Type': degree2?.graduation_type ?? '',
          'Degree 2 Course': degree2?.course ?? '',
          'Degree 2 Score': degree2?.score ?? '',
          'Degree 2 Passing Year': degree2?.passingyear ?? '',

          Experience: form?.exprience ?? '',
          'Experience Years': form?.experience_years ?? 0,
          'Work Profile': form?.workProfile ?? '',
          Companies: form?.companies ?? '',
          'Currently Working': form?.isCurrentlyWorking ? 'Yes' : 'No',
          'Current Working': form?.current_working ?? '',
          'Current Profile': form?.currentProfile ?? '',
          'Current Company': form?.currentCompany ?? '',
          Resume: form?.resume || '',
        };
      })
      .filter((row: any) => row.ID != null && row.ID !== '');

    if (placementFormData.length === 0) {
      toast.error('No student placement form data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(placementFormData);

    // Make the Resume column a clickable hyperlink in Excel
    const headers = Object.keys(placementFormData[0] ?? {});
    const resumeColIdx = headers.indexOf('Resume');
    if (resumeColIdx >= 0) {
      const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');
      for (let rowIdx = 1; rowIdx <= range.e.r; rowIdx++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: resumeColIdx });
        const cell = worksheet[cellAddr];
        if (cell && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          cell.l = { Target: cell.v, Tooltip: 'Click to open resume' };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Placement Students');
    XLSX.writeFile(workbook, `placement_${item.companyName || item.id}_students.xlsx`);
    toast.success('Excel file downloaded!');
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const placementColumn: Column<PlacementRow>[] = [
    { accessor: 'PN', header: 'PN.No' },
    { accessor: 'companyName', header: 'Company Name' },
    { accessor: 'jobRole', header: 'Job Role' },
    { accessor: 'qualification', header: 'Qualification' },
    { accessor: 'experience', header: 'Experience' },
    {
      accessor: 'deadline',
      header: 'Deadline',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{item.deadline}</span>
          <span className="text-sm font-medium text-gray-700">{item.time}</span>
        </div>
      ),
    },
    { accessor: 'salary', header: 'Salary' },
    {
      accessor: 'studentAssign' as keyof PlacementRow,
      header: 'Assign Student',
      render: (item) => (
        <GenericButton
          type="button"
          variant="navy"
          className="whitespace-nowrap"
          onClick={() => handleAssignStudent(item)}
        >
          Assign Student
        </GenericButton>
      ),
    },
    {
      accessor: 'viewAssigned' as keyof PlacementRow,
      header: 'Assigned Students',
      render: (item) => (
        <div className="flex w-full items-center justify-center">
          <GenericButton
            type="button"
            variant="navy"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => handleViewStudents(item)}
          >
            <FaUsers className="h-4 w-4 shrink-0" />
            <AssignedStudentsCount placementId={item.id} role={role} />
          </GenericButton>
        </div>
      ),
    },
    {
      accessor: 'interestedStudents' as keyof PlacementRow,
      header: 'Interested Students',
      render: (item) => {
        // Count comes directly from placementsData — no extra API call needed
        const rawPlacement = getResponseArray(placementsData).find(
          (p: any) => String(p.id) === String(item.id),
        );
        const count = rawPlacement?.placementStudents?.length ?? 0;
        return (
          <div className="flex w-full items-center justify-center">
            <GenericButton
              type="button"
              variant="navy"
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={() => handleInterestedStudents(item)}
            >
              <FaUsers className="h-4 w-4 shrink-0" />
              <span className="text-xs">{count}</span>
            </GenericButton>
          </div>
        );
      },
    },
    {
      accessor: 'action' as keyof PlacementRow,
      header: 'Action',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleEdit(item.id)}
            className="hover:bg-primary-navy/10 rounded p-1.5 text-text-charcoal transition-colors hover:text-primary-navy"
            title="Edit"
          >
            <FiEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            className="rounded p-1.5 text-text-charcoal transition-colors hover:bg-danger/10 hover:text-danger"
            title="Delete"
          >
            <MdDelete size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleExcelDownload(item)}
            className="rounded p-1.5 text-text-charcoal transition-colors hover:bg-green-100 hover:text-green-600"
            title="Download Excel"
          >
            <RiFileExcel2Line size={18} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <GenericTable columns={placementColumn} showSrNo data={placementData}
       itemsPerPage={10} searchAble />

      <AssignStudentModal
        open={openAddStudentModal}
        onClose={closeAssignModal}
        methods={methods}
        onSubmit={onAssignSubmit}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
        studentOptions={studentOptions}
        studentTableData={studentTableData}
        isCoursesLoading={isCoursesLoading}
        isBatchLoading={isBatchLoading}
        isStudentsLoading={isStudentsLoading}
        selectedCourseId={selectedCourseId}
        selectedBatchId={selectedBatchId}
        isAssigning={isAssigning}
      />

      <ViewStudentsModal
        open={openViewStudentsModal}
        onClose={() => {
          setOpenViewStudentsModal(false);
          setViewingPlacementId('');
        }}
        students={assignedStudentsForView}
        isLoading={isAssignedStudentsLoading}
        isError={isAssignedStudentsError}
      />

      <InterviewScheduleModal
        open={openInterestedModal}
        onClose={() => {
          setOpenInterestedModal(false);
          setInterestedPlacementId('');
        }}
        interestedStudents={interestedStudents}
        selectedStudentIds={selectedStudentIds}
        interviewMode={interviewMode}
        interviewDate={interviewDate}
        interviewTime={interviewTime}
        interviewLocation={interviewLocation}
        isDropdownOpen={isDropdownOpen}
        onToggleDropdown={() => setIsDropdownOpen((prev) => !prev)}
        onToggleStudent={(id) =>
          setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
          )
        }
        onSelectAll={() => {
          if (selectedStudentIds.length === interestedStudents.length) {
            setSelectedStudentIds([]);
          } else {
            setSelectedStudentIds(interestedStudents.map((s) => s.id));
          }
        }}
        onRemoveStudent={(id) =>
          setSelectedStudentIds((prev) => prev.filter((s) => s !== id))
        }
        onModeChange={setInterviewMode}
        onDateChange={setInterviewDate}
        onTimeChange={setInterviewTime}
        onLocationChange={setInterviewLocation}
        onSave={handleSaveInterviewDetails}
      />
    </div>
  );
};

export default PlacementTable;