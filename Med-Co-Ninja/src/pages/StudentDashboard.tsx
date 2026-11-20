import { useState, useEffect, useRef, ReactNode } from "react";
import DailyTask from "@/components/student/DailyTask";
import Exam from "@/components/student/Exam";
import Interview from "@/components/student/Interview";
import Placement from "@/components/student/placement/Placment";
import Certificate from "@/components/student/Certification";
import { Link } from "@tanstack/react-router";
import DisplayAssignment from "@/components/student/DisplayAssignment";
import {
    FiBriefcase,
    FiCheckCircle,
    FiClipboard,
    FiUserCheck,
    FiFileText,
    FiUser,
    FiCalendar,
    FiAward,
    FiCreditCard,
    FiAlertCircle,
} from "react-icons/fi";
import { useDashboardStats } from "@/lib/react-query/queriesAndMutations/dashboardMutation";
import { useGetStudentPlacements } from "@/lib/react-query/queriesAndMutations/studentplacement";
import StudentReferalForm from "@/components/student/StudentReferalForm";

const tabs = [
    {
        label: "Daily Tasks",
        component: <DailyTask />,
        icon: <FiCheckCircle size={16} />,
    },
    {
        label: "Exams",
        component: <Exam />,
        icon: <FiClipboard size={16} />,
    },
    {
        label: "Assignments",
        component: <DisplayAssignment />,
        icon: <FiFileText size={16} />,
    },
    {
        label: "Interviews",
        component: <Interview />,
        icon: <FiUserCheck size={16} />,
    },
    {
        label: "Placement",
        component: <Placement />,
        icon: <FiBriefcase size={16} />,
    },
    {
        label: "Certificate",
        component: <Certificate />,
        icon: <FiAward size={16} />,
    },
    {
        label: "Referral",
        component: <StudentReferalForm />,
        icon: <FiUser size={16} />,
    }
];

type StatCardProps = {
    title: string;
    shortTitle: string;
    value: ReactNode;
    details?: ReactNode;
    icon: ReactNode;
    accent: string;
    valueClass?: string;
};

/**
 * Compact stat card. All five cards share one row at every screen size:
 * on phones only the icon, value and a short label show; details appear from md up.
 */
const StatCard = ({ title, shortTitle, value, details, icon, accent, valueClass = "text-slate-900" }: StatCardProps) => (
    <div className={`min-w-0 rounded-lg border-t-2 sm:border-t-0 sm:border-l-4 ${accent} bg-white p-2 shadow-sm transition-shadow hover:shadow-md sm:p-3 lg:p-4`}>
        <div className="flex flex-col items-center gap-0.5 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-2 sm:text-left">
            <span className="text-primary-navy sm:order-2 sm:rounded-md sm:bg-bg-light-mint sm:p-1.5">{icon}</span>
            <div className="min-w-0 sm:order-1 sm:flex-1">
                <p className="hidden truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 lg:block">{title}</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:hidden">{shortTitle}</p>
                <h3 className={`truncate text-sm font-bold leading-tight sm:text-lg lg:text-2xl ${valueClass}`}>{value}</h3>
                {details && (
                    <p className="mt-0.5 hidden text-[11px] leading-snug text-slate-500 md:block">{details}</p>
                )}
            </div>
        </div>
    </div>
);

const StudentDashboard = () => {
    const { data: statsData } = useDashboardStats()
    const { data: PlacementResponse } = useGetStudentPlacements();
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // ✅ Get saved tab from localStorage or default to 0
    const getSavedTab = () => {
        const savedTab = localStorage.getItem('activeDashboardTab');
        if (savedTab !== null) {
            const tabIndex = parseInt(savedTab, 10);
            // Validate that the tab index exists
            if (tabIndex >= 0 && tabIndex < tabs.length) {
                return tabIndex;
            }
        }
        return 0;
    };

    const [activeTab, setActiveTab] = useState(getSavedTab);
    const [hideAlert, setHideAlert] = useState(false);

    // ✅ Save tab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeDashboardTab', activeTab.toString());
    }, [activeTab]);

    // Notification clicks (header bell) switch the tab while already on the dashboard
    useEffect(() => {
        const onTab = (e: Event) => {
            const idx = Number((e as CustomEvent).detail);
            if (idx >= 0 && idx < tabs.length) setActiveTab(idx);
        };
        window.addEventListener('student-dashboard-tab', onTab);
        return () => window.removeEventListener('student-dashboard-tab', onTab);
    }, []);

    // Scroll active tab into view horizontally on mobile
    useEffect(() => {
        if (tabsContainerRef.current) {
            const activeButton = tabsContainerRef.current.children[activeTab] as HTMLElement;
            if (activeButton) {
                const container = tabsContainerRef.current;
                container.scrollTo({
                    left: activeButton.offsetLeft - container.offsetWidth / 2 + activeButton.offsetWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeTab]);

    return (
        <div className="mx-auto max-w-7xl px-2.5 py-3 sm:px-4 md:py-5">
            {/* Alert Box - Placement Form (compact, can be hidden for this visit) */}
            {!hideAlert && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#f5c2c7] bg-[#FAD7DA] px-3 py-2 text-[#842029] md:mb-4">
                    <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
                    <p className="flex-1 text-xs leading-snug sm:text-sm">
                        <span className="font-bold">Your Placement Form is incomplete. </span>
                        <span className="hidden sm:inline">
                            Some mandatory details (like 10th marks, name, gender, etc.) are missing.{" "}
                        </span>
                        <Link to={'/student/placement-form'} className="font-bold underline">
                            Update your Placement Form
                        </Link>
                        <span className="hidden sm:inline"> to be eligible for placement and certificate generation.</span>
                    </p>
                    <button
                        onClick={() => setHideAlert(true)}
                        className="shrink-0 rounded px-1 text-base leading-none hover:bg-black/5"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Statistics Cards - one line on every screen */}
            <div className="mb-3 grid grid-cols-5 gap-1.5 sm:gap-2 md:mb-4 lg:gap-3">
                <StatCard
                    title="Pending Fees"
                    shortTitle="Fees Due"
                    value={statsData?.student?.pendingFees ?? "0%"}
                    valueClass="text-red-600"
                    details={<>Paid: {statsData?.student?.paidFees ?? 0} · Total: {statsData?.student?.totalFees ?? 0}</>}
                    icon={<FiCreditCard size={18} />}
                    accent="border-red-400"
                />
                <StatCard
                    title="Total Attendance"
                    shortTitle="Attend."
                    value={statsData?.attendance?.overallAttendancePercentage ?? "0%"}
                    details={<>Days: {statsData?.attendance?.totalBatchAttendance ?? 0} · Present: {statsData?.attendance?.studentPresentDays ?? 0}</>}
                    icon={<FiCalendar size={18} />}
                    accent="border-blue-400"
                />
                <StatCard
                    title="Average Exam Score"
                    shortTitle="Exam Avg"
                    value={statsData?.exam?.averageExamScorePercentage ?? "0%"}
                    details={<>Attended: {statsData?.exam?.totalExamsAttended ?? 0} · Total: {statsData?.exam?.totalExams ?? 0}</>}
                    icon={<FiFileText size={18} />}
                    accent="border-green-400"
                />
                <StatCard
                    title="Total Interview"
                    shortTitle="Interviews"
                    value={statsData?.placement?.totalInterviews ?? 0}
                    icon={<FiUserCheck size={18} />}
                    accent="border-purple-400"
                />
                <StatCard
                    title="Total Placement"
                    shortTitle="Placements"
                    value={PlacementResponse?.data?.length || 0}
                    details={<>Applied: {statsData?.placement?.totalPlacementApplied ?? 0}</>}
                    icon={<FiBriefcase size={18} />}
                    accent="border-orange-400"
                />
            </div>

            {/* Tabs (tablet / desktop): sticky bar under the header */}
            <div className="sticky top-14 z-30 hidden w-full overflow-hidden rounded-lg bg-pure-white shadow-sm md:block">
                <div className="grid w-full grid-cols-7">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(index)}
                            className={`flex items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-2.5 text-sm font-semibold transition-colors duration-200
                                ${activeTab === index
                                    ? "border-accent-teal text-accent-teal"
                                    : "border-transparent text-gray-500 hover:bg-bg-light-mint hover:text-accent-teal"
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs (phone): app-style bottom navigation bar */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stroke bg-pure-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
                <div ref={tabsContainerRef} className="no-scrollbar flex w-full overflow-x-auto pb-[env(safe-area-inset-bottom)]">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(index)}
                            className={`relative flex min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition-colors
                                ${activeTab === index ? "text-accent-teal" : "text-gray-500"}`}
                        >
                            {activeTab === index && (
                                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent-teal" />
                            )}
                            <span className="text-lg">{tab.icon}</span>
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Tab Content */}
            <div className="mt-3 md:mt-4">
                {tabs[activeTab].component}
            </div>
        </div>
    );
};

export default StudentDashboard;
