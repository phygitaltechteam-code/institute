import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import { BiListUl, BiBuildings, BiClipboard } from 'react-icons/bi';
import { PiArrowArcLeftDuotone, PiSquaresFourLight } from 'react-icons/pi';
import { FaNetworkWired, FaArrowLeft, FaCertificate, FaMedal } from 'react-icons/fa';
import LeadTable from '../lead/LeadTable';
import { useAuthContext } from '@/context/AuthContext';

import ExamTable from '../exam/ExamTable';
import StudentTableForInterview from '../interview/StudentTableForInterview';
import AssignmentTable from './AssignmentTable';
import DisplayDailyTask from './DisplayDailyTask';
import StudentDetailsTableReferal from '../Referal/StudentDetailsTableAndReferal';
import CertificareList from '@/components/certificate/CertificateList';
import { MdOutlineCurrencyRupee, MdOutlineWorkspacePremium } from 'react-icons/md';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import Fees from './Fees';
import AttendanceList from '../Attendance/AttendenceList';

const BatchDashBoard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();


  const params = useParams({ strict: false });

  const batchId = (params.id || params.batchId || params['$id']) as string;


  const [activeGroup, setActiveGroup] = useState<number>(() => {

    const storedGroup = sessionStorage.getItem('batch-activeGroup');
    const storedSub = sessionStorage.getItem('batch-activeSub');

    if (storedGroup && storedSub) {

      return parseInt(storedGroup, 10);
    }


    return 0;
  });

  const [activeSub, setActiveSub] = useState<number>(() => {
    const storedSub = sessionStorage.getItem('batch-activeSub');
    if (storedSub) {
      return parseInt(storedSub, 10);
    }
    return 0;
  });


  useEffect(() => {
    const state = location.state as { activeTab?: 'student' | 'lead' };
    if (state?.activeTab === 'lead') {
      setActiveGroup(1);
    } else if (state?.activeTab === 'student') {
      setActiveGroup(0);
    }


    const storedGroup = sessionStorage.getItem('batch-activeGroup');
    const storedSub = sessionStorage.getItem('batch-activeSub');

    if (storedGroup && storedSub) {
      setActiveGroup(parseInt(storedGroup, 10));
      setActiveSub(parseInt(storedSub, 10));

    }
  }, [location.state]);

  useEffect(() => {
    sessionStorage.setItem('batch-activeGroup', activeGroup.toString());
    sessionStorage.setItem('batch-activeSub', activeSub.toString());
  }, [activeGroup, activeSub]);

  const groups = [
    {
      name: 'Lead',
      directComponent: <LeadTable batchId={batchId} />,
    },
    {
      name: 'Student',
      steps: [
        {
          label: 'Fees',
          icon: <MdOutlineCurrencyRupee size={18} />,
          comp: <Fees batchId={batchId} />,
        },
        {
          label: 'Daily Task',
          icon: <BiListUl size={18} />,
          comp: <DisplayDailyTask batchId={batchId} />,
        },
         {
          label: 'Attendance',
          icon: <BiClipboard size={18} />,
          comp: <AttendanceList batchId={batchId} />,
        },
        {
          label: 'Exams',
          icon: <PiSquaresFourLight size={18} />,
          comp: <ExamTable batchId={batchId} />,
        },
        {
          label: 'Interview',
          icon: <BiBuildings size={18} />,
          comp: <StudentTableForInterview batchId={batchId} />,
        },
        {
          label: 'Referals',
          icon: <FaNetworkWired size={18} />,
          comp: <StudentDetailsTableReferal batchId={batchId} />,
        },
        {
          label: 'Assignments',
          icon: <FaNetworkWired size={18} />,
          comp: <AssignmentTable batchId={batchId} />,
        },
        {
          label: 'Certificate',
          icon: <MdOutlineWorkspacePremium size={18} />,
          comp: <CertificareList batchId={batchId} />,
        },
      ],
    },
  ];

  const currentGroup = groups[activeGroup] || groups[0];
  const isDirectComponent = 'directComponent' in currentGroup;
  const currentStep = isDirectComponent ? null : currentGroup.steps?.[activeSub] || currentGroup.steps?.[0];

  const handleMainClick = (idx: number) => {
    if (activeGroup !== idx) {
      setActiveGroup(idx);
      setActiveSub(0);
    }
  };

  const handleSubClick = (idx: number) => {
    setActiveSub(idx);
  };

  const handleAddLead = () => {
    if (user?.role === 'ADMIN') {
      navigate({
        to: '/admin/lead/lead-form',
        state: { batchId: batchId },
      });
    } else {
      navigate({
        to: '/faculty/lead/lead-form',
        state: { batchId: batchId },
      });
    }
  };

  const handleBack = () => {
    if (user?.role === 'ADMIN') {
      navigate({ to: '/admin/batchtable' });
    } else if (user?.role === 'TEACHER') {
      navigate({ to: '/faculty/batchtable' });
    } else {
      navigate({ to: '/admin/batchtable' });
    }
  };

  const getMainTabClasses = (isActive: boolean) => {
    const base = 'transition-all duration-300 ease-in-out whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium cursor-pointer select-none';
    if (isActive) {
      return `${base} border-primary-navy bg-primary-navy/10 text-primary-navy font-semibold shadow-sm dark:border-accent-teal dark:bg-accent-teal/10 dark:text-accent-teal`;
    }
    return `${base} border-transparent text-gray-500 hover:border-primary-navy/40 hover:text-primary-navy dark:text-gray-400 dark:hover:text-pure-white`;
  };

  const getSubTabClasses = (isActive: boolean) => {
    const base = 'transition-all duration-300 ease-in-out whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium cursor-pointer select-none';
    if (isActive) {
      return `${base} border-primary-navy bg-primary-navy/10 text-primary-navy font-semibold shadow-sm dark:border-accent-teal dark:bg-accent-teal/10 dark:text-accent-teal`;
    }
    return `${base} border-transparent text-gray-500 hover:border-primary-navy/40 hover:text-primary-navy dark:text-gray-400 dark:hover:text-pure-white`;
  };

  return (
    <div className="w-full p-2 md:p-2 2xl:p-2">
      {/* Back Button */}
      <GenericButton onClick={handleBack}
        aria-label="Go back"
      >
        {/* <FaArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> */}
        <span>Back</span>
      </GenericButton>

      {/* MAIN TABS HEADER */}
      <div className="flex w-full items-center justify-between border-b border-stroke dark:border-strokedark">
        <div id="main" className="scrollbar-hide flex-1 overflow-x-auto">
          <div className="flex w-full gap-1">
            {groups.map((g, i) => (
              <button
                key={i}
                onClick={() => handleMainClick(i)}
                className={getMainTabClasses(activeGroup === i)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Add Lead Button - Only visible when Lead tab is active */}
        {activeGroup === 0 && (
          <GenericButton
            onClick={handleAddLead}
          >
            + Add Lead
          </GenericButton>
        )}
      </div>

      {/* SUB TABS — Only show if NOT direct component */}
      {!isDirectComponent && currentGroup.steps && (
        <div className="bg-gray-50 flex items-center dark:border-strokedark dark:bg-boxdark-2 mt-1">
          <div id="sub" className="scrollbar-hide flex-1 overflow-x-auto">
            <div className="flex min-w-max gap-1">
              {currentGroup.steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSubClick(i)}
                  className={getSubTabClasses(activeSub === i)}
                >
                  <span className="flex items-center gap-1.5">
                    {s.icon}
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="mt-4">
        <React.Suspense fallback={<div className="p-4 md:p-8 text-center">Loading...</div>}>
          {isDirectComponent ? (
            currentGroup.directComponent
          ) : (
            currentStep?.comp
          )}
        </React.Suspense>
      </div>
    </div>
  );
};

export default BatchDashBoard;