import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';

/**
 * Auth gate for everything under /_app. The visual shell (sidebar, header, footer)
 * lives in PanelLayout so there is only one scroll container per page.
 */
const AppLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token && !isAuthenticated) {
      navigate({ to: '/signin' });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B8860B] border-t-transparent"></div>
      </div>
    );
  }

  return <Outlet />;
};

export default AppLayout;
