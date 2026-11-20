import { useAuthContext } from '@/context/AuthContext';
import { NetworkIcon, ProfileIcon, ReportIcon } from '@/icons';
import { SidebarProps } from '@/types';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import {
  BiListUl,
  BiRupee,
  BiBuildings,
  BiUser,
  BiBook,
  BiUserPlus,
  BiCertification,
  BiMoney,
} from 'react-icons/bi';
import {
  FaNetworkWired,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUsers,
} from 'react-icons/fa';
import {
  FaArrowLeftLong,
  FaMoneyBillTransfer,
  FaPerson,
  FaUpRightAndDownLeftFromCenter,
} from 'react-icons/fa6';
import { IoIosArrowDown } from 'react-icons/io';
import { MdApproval, MdAssignment, MdDashboard, MdLibraryBooks } from 'react-icons/md';
import { ChevronLeft, ChevronRight, FileText, KeyRound, LogOut, LayoutDashboard, Receipt, FileUp, Search } from 'lucide-react';
import { openStudentSearch } from '@/components/Common/UniversalSearch';
import {
  PiNavigationArrowFill,
  PiShareLight,
  PiSquaresFourLight,
  PiStudent,
  PiChalkboardTeacher,
} from 'react-icons/pi';
import SidebarLinkGroup from './SidebarLinkGroup';
import { ADMIN_ROUTES, isSubActive, SidebarRoute } from './adminRoutes';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import ChangePasswordDialog from '@/components/Common/ChangePasswordDialog';
import path from 'path';
import { IoClipboard } from 'react-icons/io5';

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const role = user?.role;

  const sidebarRoutes: SidebarRoute[] =
    role === 'TEACHER'
      ? [
        {
          label: 'Batch',
          icon: <PiSquaresFourLight size={18} />,
          path: '/faculty/batchtable',
        },
        {
          label: 'Course',
          icon: <MdLibraryBooks size={18} />,
          path: '/faculty/add-course',
        },
        {
          label: 'Subject',
          icon: <MdLibraryBooks size={18} />,
          path: '/faculty/add-subject',
        },
        {
          label: 'Add Student',
          icon: <FaPerson size={18} />,
          path: '/faculty/student-details',
        },
        // {
        //   label: 'Account',
        //   icon: <FaPerson size={18} />,
        //   path: '/faculty/account/addaccount',
        // },
        {
          label: "Exam",
          icon: <MdAssignment size={18} />,
          path: '/faculty/exam-table',
        },
        {
          label: 'All Lead Students',
          path: '/faculty/lead/all-lead-table',
          icon: <FaUsers size={18} />,
        },
        {
          label: 'Expenditure',
          path: '/faculty/expenditure/expenditure-list',
          icon: <BiRupee size={18} />,
        },
        {
          label: 'Placement',
          path: '/faculty/placement/placement-list',
          icon: <FaNetworkWired size={18} />,
        },
        {
          label: 'Attendance',
          path: '/faculty/attendencelist',
          icon: <IoClipboard size={18} />,
        },
        {
          label: 'Fee Receipts',
          path: '/faculty/fee-receipts',
          icon: <Receipt size={18} />,
        },
        // {
        //   label: 'Certification',
        //   path: '/faculty/certification',
        //   icon: <MdApproval size={18} />,
        // },

        // {
        //   label: 'Interview',
        //   path: '/faculty/interview/assigninterview',
        //   icon: <BiBuildings size={18} />,
        // },

      ]
      : role === 'ADMIN'
        ? ADMIN_ROUTES
        : role === 'SUPERADMIN'
          ? [
            {
              label: 'Admins',
              icon: <FaUsers size={18} />,
              path: '/superadmin/admins',
            },
            {
              label: 'Add Admin',
              icon: <BiUserPlus size={18} />,
              path: '/superadmin/add-admin',
            },
          ]
          : [];

  const location = useLocation();
  const { pathname } = location;
  const groupActive = (r: SidebarRoute) => !!r.subRoutes?.some((s) => isSubActive(s, pathname));

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === 'true',
  );

  const handleLinkClick = () => setSidebarOpen(false);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const displayName = user?.fullname || user?.username || 'User';

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    setSidebarOpen(false);
    navigate({ to: '/signin' });
  };

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !sidebar.current ||
        !trigger.current ||
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target) ||
        target.closest('button')?.querySelector('.lucide-menu') ||
        target.closest('.lucide-menu')
      )
        return;

      setSidebarOpen(false);
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [sidebarOpen]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (!sidebarOpen || event.key !== 'Escape') return;
      setSidebarOpen(false);
    };

    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', String(sidebarExpanded));
  }, [sidebarExpanded]);

  return (
    // <aside
    //   ref={sidebar}
    //   className={`absolute left-0 top-0 z-[9999] flex h-screen flex-col bg-primary-navy shadow-2xl duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarExpanded ? 'w-64' : 'w-64 lg:w-20'
    //     } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    // >
    <aside
      ref={sidebar}
      className={`fixed inset-y-0 left-0 z-[9999] flex h-screen flex-col bg-primary-navy shadow-2xl duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarExpanded ? 'w-64' : 'w-64 lg:w-20'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* ── Header ── */}
      <div
        className={`border-pure-white/10 flex items-center justify-between border-b px-4 py-4 sm:px-5 ${sidebarExpanded ? '' : 'lg:justify-center lg:px-2'
          }`}
      >
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal shadow-md transition-transform group-hover:scale-105">
            <span className="text-base font-bold leading-none text-pure-white">
              M
            </span>
          </div>
          {sidebarExpanded && (
            <div>
              <p className="text-sm font-bold leading-tight text-white">
                MedCode Ninja
              </p>
              <p className="text-[10px] font-medium leading-tight text-accent-teal">
                {role === 'SUPERADMIN' ? 'Super Admin Portal' : role === 'ADMIN' ? 'Admin Portal' : 'Faculty Portal'}
              </p>
            </div>
          )}
        </Link>

        {/* Close button — mobile only */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-pure-white/10 flex h-8 w-8 items-center justify-center rounded-lg text-pure-white transition-colors hover:bg-accent-teal lg:hidden"
          aria-label="Close Sidebar"
        >
          <FaArrowLeftLong className="h-3.5 w-3.5" />
        </button>

        {/* Collapse/Expand button — desktop only */}
        {sidebarExpanded ? (
          <button
            onClick={() => setSidebarExpanded(false)}
            className="bg-pure-white/10 hidden h-7 w-7 items-center justify-center rounded-lg text-pure-white transition-colors hover:bg-accent-teal lg:flex"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setSidebarExpanded(true)}
            className="bg-pure-white/10 hidden h-7 w-7 items-center justify-center rounded-lg text-pure-white transition-colors hover:bg-accent-teal lg:flex"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Universal student search (Ctrl+K) ── */}
      {(role === 'ADMIN' || role === 'TEACHER') && (
        <div className={`px-3 pt-3 ${sidebarExpanded ? '' : 'lg:px-2'}`}>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              openStudentSearch();
            }}
            title="Search students (Ctrl+K)"
            className={`flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/20 hover:text-white ${sidebarExpanded ? '' : 'lg:justify-center lg:px-0'}`}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className={`flex-1 text-left ${sidebarExpanded ? '' : 'lg:hidden'}`}>Search student…</span>
            <kbd className={`rounded bg-white/10 px-1.5 text-[10px] ${sidebarExpanded ? '' : 'lg:hidden'}`}>Ctrl K</kbd>
          </button>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3 py-2">
        {sidebarExpanded && (
          <p className="mb-3 px-2 text-[12px] font-bold uppercase tracking-widest text-accent-teal">
            Menu
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {sidebarRoutes.map((route, index) =>
            route.subRoutes ? (
              <SidebarLinkGroup
                key={index}
                activeCondition={groupActive(route)}
              >
                {(handleClick, open) => (
                  <>
                    {/* Parent link with dropdown */}
                    <button
                      type="button"
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${groupActive(route)
                        ? 'bg-pure-white/10 border-l-2 border-accent-teal pl-2.5 text-pure-white'
                        : 'hover:bg-pure-white/8 text-pure-white hover:pl-3.5'
                        } ${sidebarExpanded ? '' : 'lg:justify-center'}`}
                      aria-expanded={open}
                      onClick={(e) => {
                        e.preventDefault();
                        // In the collapsed (icon-only) sidebar, opening a group expands the sidebar first
                        if (!sidebarExpanded) {
                          setSidebarExpanded(true);
                          if (!open) handleClick();
                          return;
                        }
                        handleClick();
                      }}
                      title={!sidebarExpanded ? route.label : undefined}
                    >
                      <span className="shrink-0">{route.icon}</span>
                      <span
                        className={`${sidebarExpanded ? 'block' : 'block lg:hidden'}`}
                      >
                        {route.label}
                      </span>
                      {sidebarExpanded && (
                        <IoIosArrowDown
                          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${open ? 'rotate-180' : ''
                            }`}
                        />
                      )}
                    </button>

                    {/* Sub-links */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ${!open || !sidebarExpanded ? 'hidden' : ''
                        }`}
                    >
                      <ul className="border-pure-white/15 mb-2 ml-4 mt-1 flex flex-col gap-0.5 border-l pl-4">
                        {(route.subRoutes ?? []).map((sub, i) => (
                          <li key={i}>
                            <Link
                              to={sub.path}
                              onClick={handleLinkClick}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ${isSubActive(sub, pathname)
                                ? 'font-semibold text-accent-teal'
                                : 'text-pure-white hover:text-accent-teal'
                                }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isSubActive(sub, pathname)
                                  ? 'bg-accent-teal'
                                  : 'bg-pure-white/40'
                                  } transition-colors`}
                              />
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </SidebarLinkGroup>
            ) : (
              <li key={index}>
                <Link
                  to={route.path}
                  onClick={handleLinkClick}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === route.path
                    ? 'bg-pure-white/10 border-l-2 border-accent-teal pl-2.5 text-pure-white'
                    : 'hover:bg-pure-white/8 text-pure-white hover:pl-3.5'
                    } ${sidebarExpanded ? '' : 'lg:justify-center'}`}
                  title={!sidebarExpanded ? route.label : undefined}
                >
                  <span className="shrink-0">{route.icon}</span>
                  <span
                    className={`${sidebarExpanded ? 'block' : 'block lg:hidden'}`}
                  >
                    {route.label}
                  </span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="border-pure-white/10 border-t px-3 py-3">
        {/* User Info */}
        <div
          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${sidebarExpanded ? '' : 'lg:justify-center'}`}
          title={displayName}
        >
          <div className="bg-accent-teal/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-accent-teal">
            {displayName.slice(0, 1)}
          </div>
          {sidebarExpanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-pure-white">{displayName}</p>
              <p className="truncate text-xs text-white/70">
                {role === 'SUPERADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Faculty'}
              </p>
            </div>
          )}
        </div>

        {/* Change password + Sign out */}
        <div className={`mt-2 flex gap-2 ${sidebarExpanded ? '' : 'lg:flex-col lg:items-center'}`}>
          <button
            onClick={() => setChangePw(true)}
            title="Change password"
            className="hover:bg-pure-white/10 flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 px-2 py-2 text-xs font-medium text-pure-white transition-colors"
          >
            <KeyRound size={15} className="shrink-0" />
            {sidebarExpanded && <span className="truncate">Password</span>}
          </button>
          <button
            onClick={() => setConfirmLogout(true)}
            title="Sign out"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-2 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 hover:text-red-200"
          >
            <LogOut size={15} className="shrink-0" />
            {sidebarExpanded && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>
      <ChangePasswordDialog open={changePw} onClose={() => setChangePw(false)} />
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="You will need to log in again to continue."
        confirmText="Sign out"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </aside>
  );
};

export default Sidebar;
