import { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

type StatCardProps = {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  to?: string;
};

/** Dashboard KPI tile (adapted from the admin-panel StatCard, in this project's theme). */
const StatCard = ({ title, value, hint, icon, to }: StatCardProps) => {
  const body = (
    <div className="flex h-full items-start justify-between gap-3 rounded-xl border border-stroke bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{title}</p>
        <p className="mt-1 truncate text-lg font-bold text-primary-navy sm:text-2xl">{value}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">{hint}</p>}
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-navy/5 text-primary-navy sm:h-10 sm:w-10">
        {icon}
      </span>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal">
      {body}
    </Link>
  ) : (
    body
  );
};

export default StatCard;
