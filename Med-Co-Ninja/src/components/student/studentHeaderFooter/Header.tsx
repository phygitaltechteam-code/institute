import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { User, LogOut, ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import NotificationBell from "./NotificationBell";

type StudentHeaderProps = {
  studentName: string;
  placementFormFilled?: boolean;
};

const StudentHeader = ({
  studentName,
  placementFormFilled = true,
}: StudentHeaderProps) => {

  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleSignOut = () => {
    setConfirmLogout(false);
    // Call the logout function from auth context
    logout();

    // Show success message
    toast.success('Signed out successfully!');

    // Navigate to login page
    navigate({ to: '/signin' });
  };

  const name = user?.fullname || studentName;

  return (
    <header className="sticky top-0 z-40 border-t-2 border-[#1e73be] bg-[#0a3c60] shadow-sm">
      {/* Always a single row: brand left, actions right */}
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:px-4">
        <button
          onClick={() => navigate({ to: "/student/studentdahboard" })}
          className="truncate text-base font-bold text-pure-white sm:text-xl"
        >
          MedCode Ninja
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          {placementFormFilled && (
            <button
              onClick={() => navigate({ to: "/student/placement-form" })}
              className="flex items-center gap-1.5 rounded-md bg-accent-green px-2 py-1.5 text-xs font-semibold text-pure-white transition hover:bg-accent-green/80 sm:px-3 sm:text-sm"
              title="Placement Form"
            >
              <ClipboardCheck size={16} />
              <span className="hidden sm:inline">Placement Form</span>
            </button>
          )}

          <NotificationBell />

          {name && (
            <div className="hidden items-center gap-1.5 text-pure-white md:flex">
              <User size={16} />
              <span className="max-w-[180px] truncate text-sm font-medium">Hello, {name}</span>
            </div>
          )}

          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-white/10 hover:text-red-200 sm:text-sm"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="You will need to log in again to continue."
        confirmText="Sign out"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmLogout(false)}
      />
    </header>
  );
};

export default StudentHeader;
