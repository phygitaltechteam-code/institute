import { Outlet, useLocation } from '@tanstack/react-router';
import Footer from '@/components/layout/Footer';
import StudentHeader from '@/components/student/studentHeaderFooter/Header';

const StudentLayout = () => {
  const { pathname } = useLocation();
  // The dashboard shows a fixed bottom tab bar on phones; reserve room so the footer stays visible above it
  const hasBottomNav = pathname.startsWith('/student/studentdahboard');

  return (
    <div className={`flex min-h-dvh flex-col bg-bg-light-mint font-sans ${hasBottomNav ? 'pb-16 md:pb-0' : ''}`}>
      <StudentHeader studentName="" />
      <main className="w-full min-w-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StudentLayout;
