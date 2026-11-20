import { ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';

export type SidebarSubRoute = { label: string; path: string; isActive?: (pathname: string) => boolean };
export type SidebarRoute = {
  label: string;
  icon: ReactNode;
  path: string;
  subRoutes?: SidebarSubRoute[];
};

/** Admin menu: Dashboard, existing institute tools, then the online academy groups (order set below). */
export const ADMIN_ROUTES: SidebarRoute[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin/dashboard' },
  {
    label: 'Courses',
    icon: <BookOpen size={18} />,
    path: '/admin/courses',
    subRoutes: [
      {
        label: 'Manage Courses',
        path: '/admin/courses/manage',
        // course edit / curriculum pages live under /admin/courses/<id>/…
        isActive: (p) => p === '/admin/courses/manage' || /^\/admin\/courses\/[^/]+\/(edit|curriculum)$/.test(p),
      },
      { label: 'Add New Courses', path: '/admin/courses/new' },
      { label: 'Courses Category', path: '/admin/courses/categories' },
      { label: 'Student Q&A', path: '/admin/courses/qna' },
      { label: 'Bundles', path: '/admin/courses/bundles' },
      { label: 'Live Classes', path: '/admin/courses/live-classes' },
    ],
  },
  {
    label: 'Enrollment',
    icon: <GraduationCap size={18} />,
    path: '/admin/enrollment',
    subRoutes: [
      { label: 'Course Enrollment', path: '/admin/enrollment/course' },
      { label: 'Enroll History', path: '/admin/enrollment/history' },
    ],
  },
  {
    label: 'Payments',
    icon: <Wallet size={18} />,
    path: '/admin/payments',
    subRoutes: [
      { label: 'Sales & Invoices', path: '/admin/payments/invoices' },
      { label: 'Coupons', path: '/admin/payments/coupons' },
      { label: 'Partners', path: '/admin/payments/partners' },
      { label: 'Payouts', path: '/admin/payments/payouts' },
    ],
  },
  {
    label: 'Users',
    icon: <Users size={18} />,
    path: '/admin/users',
    subRoutes: [{ label: 'Manage students', path: '/admin/users/students' }],
  },
  { label: 'Educational Files', icon: <FileText size={18} />, path: '/admin/educational-files' },
  { label: 'Report', icon: <BarChart3 size={18} />, path: '/admin/report' },
  {
    label: 'Settings',
    icon: <Settings size={18} />,
    path: '/admin/settings',
    subRoutes: [
      { label: 'Website Settings', path: '/admin/settings/website' },
      { label: 'Bulk Student Add', path: '/admin/settings/bulk-students' },
      { label: 'Popular Courses', path: '/admin/settings/popular-courses' },
      { label: 'Business & GST', path: '/admin/settings/business' },
      { label: 'Reset Password', path: '/admin/settings/reset-password' },
      { label: 'Add Blogs', path: '/admin/settings/blogs' },
      { label: 'Website Enquiries', path: '/admin/settings/enquiries' },
    ],
  },
];

const INSTITUTE_ROUTE: SidebarRoute = {
    label: 'Institute',
    icon: <Building2 size={18} />,
    path: '/admin/__institute',
    subRoutes: [
      { label: 'Batch', path: '/admin/batchtable', isActive: (p) => p.startsWith('/admin/batch') || p === '/admin/create-batch' },
      { label: 'Institute Courses', path: '/admin/add-course', isActive: (p) => p === '/admin/add-course' || p.startsWith('/admin/edit-course') },
      { label: 'Subject', path: '/admin/add-subject' },
      { label: 'Faculty', path: '/admin/faculty-table', isActive: (p) => p.includes('faculty') },
      { label: 'Add Student', path: '/admin/student-details', isActive: (p) => p === '/admin/student-details' || p.startsWith('/admin/student/') },
      { label: 'Accounts', path: '/admin/account/addaccount', isActive: (p) => p.startsWith('/admin/account') },
      { label: 'Exam', path: '/admin/exams-table', isActive: (p) => p.startsWith('/admin/exam') || p.startsWith('/admin/updateexam') },
      { label: 'All Lead Students', path: '/admin/lead/all-lead-table', isActive: (p) => p.startsWith('/admin/lead') },
      { label: 'Expenditure', path: '/admin/expenditure/expenditure-list', isActive: (p) => p.includes('expenditure') },
      { label: 'Placement', path: '/admin/placement/placement-list', isActive: (p) => p.startsWith('/admin/placement') },
      { label: 'Attendance', path: '/admin/attendencelist', isActive: (p) => p.startsWith('/admin/attend') },
      { label: 'Fee Report', path: '/admin/reports/fee-collections' },
      { label: 'Fee Receipts', path: '/admin/fee-receipts' },
    ],
};

// Dashboard first, then the existing institute tools, then the online academy groups.
ADMIN_ROUTES.splice(1, 0, INSTITUTE_ROUTE);

export const isSubActive = (sub: SidebarSubRoute, pathname: string) =>
  sub.isActive ? sub.isActive(pathname) : pathname === sub.path || pathname.startsWith(`${sub.path}/`);
