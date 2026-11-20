import AttendanceList from '@/components/faculty/Attendance/AttendenceList';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_faculty/faculty/attendencelist')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-3 md:p-4">
      <h1 className="mb-3 text-lg font-semibold text-primary-navy dark:text-white sm:text-xl">Attendance</h1>
      <AttendanceList />
    </div>
  );
}
