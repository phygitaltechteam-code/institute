import { Outlet } from '@tanstack/react-router';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/layout/Footer';
import { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import UniversalSearch, { openStudentSearch } from '@/components/Common/UniversalSearch';

/**
 * Shared shell for the Admin, Super Admin and Faculty panels:
 * sidebar on the left, one scroll area on the right, footer pinned to the bottom of that area.
 */
const PanelLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-bg-light-mint font-sans">
      <div className="flex h-full">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Mobile sidebar overlay backdrop */}
        {sidebarOpen && (
          <div
            className="bg-primary-navy/50 fixed inset-0 z-[9998] backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Single scroll container: avoids double scrollbars */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Mobile top bar: hamburger + brand */}
          <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-3 bg-primary-navy px-3 shadow-md lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-pure-white transition-colors hover:bg-accent-teal"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="flex-1 text-sm font-semibold tracking-wide text-pure-white">MedCode Ninja</span>
            <button
              onClick={openStudentSearch}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-pure-white transition-colors hover:bg-accent-teal"
              aria-label="Search students"
            >
              <Search className="h-4 w-4" />
            </button>
          </header>

          <main className="w-full min-w-0 flex-1">
            <Outlet />
          </main>

          <Footer />
        </div>
        <UniversalSearch />
      </div>
    </div>
  );
};

export default PanelLayout;
