import { Link } from '@tanstack/react-router';
import { Bar, Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import {
  BookOpen,
  CalendarClock,
  GraduationCap,
  IndianRupee,
  Layers,
  RefreshCw,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { CHART_COLORS, baseOptions, inr, inrCompact } from './charts';
import { useAuthContext } from '@/context/AuthContext';
import { useAdminDashboard } from '@/lib/react-query/queriesAndMutations/dashboardAdmin';
import { formatDateTimeAuto } from '@/utils/dateTimeUtils';

const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  IN_PROGRESS: 'In progress',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

const count = (n: number) => (n || 0).toLocaleString('en-IN');

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const { data, isLoading, isError, refetch, isFetching } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="p-3 md:p-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white sm:h-24" />
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-white" />
          <div className="h-72 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-red-600">Could not load the dashboard.</p>
        <button onClick={() => refetch()} className="rounded-lg bg-primary-navy px-4 py-2 text-sm text-white">
          Try again
        </button>
      </div>
    );
  }

  const { totals, fees, monthly, leadsByStatus, followUpsDueThisWeek, recentCollections } = data;
  const months = monthly.map((m) => m.month);
  const maxLeadCount = Math.max(1, ...leadsByStatus.map((l) => l.count));

  const feeOptions = baseOptions(inr, inrCompact) as ChartOptions<'bar'>;
  const admissionOptions = baseOptions((n) => `${count(n)} admission${n === 1 ? '' : 's'}`, (n) => count(n)) as ChartOptions<'line'>;

  return (
    <div className="space-y-3 p-3 md:space-y-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
            Welcome back{user?.fullname ? `, ${user.fullname}` : ''}
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">Here is how your institute is doing today.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-primary-navy disabled:opacity-50 sm:text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard title="Students" value={count(totals.students)} icon={<GraduationCap className="h-5 w-5" />} to="/admin/student-details" />
        <StatCard
          title="Active Batches"
          value={count(totals.activeBatches)}
          hint={`${count(totals.batches)} total`}
          icon={<Layers className="h-5 w-5" />}
          to="/admin/batchtable"
        />
        <StatCard title="Faculty" value={count(totals.teachers)} icon={<Users className="h-5 w-5" />} to="/admin/faculty-table" />
        <StatCard
          title="Leads"
          value={count(totals.leads)}
          hint={`${count(totals.newLeadsThisMonth)} new this month`}
          icon={<UserPlus className="h-5 w-5" />}
          to="/admin/lead/all-lead-table"
        />
        <StatCard
          title="Fees Collected"
          value={inr(fees.collected)}
          hint={`${inr(fees.collectedThisMonth)} this month`}
          icon={<IndianRupee className="h-5 w-5" />}
          to="/admin/reports/fee-collections"
        />
        <StatCard title="Fees Pending" value={inr(fees.pending)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Courses" value={count(totals.courses)} icon={<BookOpen className="h-5 w-5" />} to="/admin/add-course" />
        <StatCard
          title="Follow-ups (7 days)"
          value={count(followUpsDueThisWeek.leads + followUpsDueThisWeek.fees)}
          hint={`${count(followUpsDueThisWeek.leads)} lead · ${count(followUpsDueThisWeek.fees)} fee`}
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>

      {/* Trends: two single-series charts (different units never share an axis) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard
          title="Fee collection"
          subtitle="Last 12 months"
          valueHeader="Collected"
          table={monthly.map((m) => ({ label: m.month, value: inr(m.feeCollected) }))}
        >
          <Bar
            aria-label="Fee collection per month, last 12 months"
            options={feeOptions}
            data={{
              labels: months,
              datasets: [
                {
                  data: monthly.map((m) => m.feeCollected),
                  backgroundColor: CHART_COLORS.teal,
                  hoverBackgroundColor: CHART_COLORS.navy,
                  borderRadius: { topLeft: 4, topRight: 4 },
                  borderSkipped: 'bottom',
                  maxBarThickness: 28,
                },
              ],
            }}
          />
        </ChartCard>

        <ChartCard
          title="New admissions"
          subtitle="Students added per month"
          valueHeader="Admissions"
          table={monthly.map((m) => ({ label: m.month, value: count(m.admissions) }))}
        >
          <Line
            aria-label="New student admissions per month, last 12 months"
            options={admissionOptions}
            data={{
              labels: months,
              datasets: [
                {
                  data: monthly.map((m) => m.admissions),
                  borderColor: CHART_COLORS.navy,
                  backgroundColor: CHART_COLORS.tealFill,
                  fill: true,
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  pointBackgroundColor: CHART_COLORS.navy,
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                },
              ],
            }}
          />
        </ChartCard>
      </div>

      {/* Lead pipeline + recent payments */}
      <div className="grid gap-3 lg:grid-cols-5">
        <section className="rounded-xl border border-stroke bg-white p-3 shadow-sm sm:p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-charcoal sm:text-base">Lead pipeline</h2>
            <Link to="/admin/lead/all-lead-table" className="text-xs font-medium text-accent-teal hover:underline">
              View leads
            </Link>
          </div>
          <ul className="space-y-2.5">
            {leadsByStatus.map((l) => (
              <li key={l.status} className="grid grid-cols-[88px_1fr_32px] items-center gap-2 text-xs sm:text-sm">
                <span className="truncate text-slate-600">{LEAD_STATUS_LABEL[l.status] ?? l.status}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-100" title={`${l.count} leads`}>
                  <span
                    className="block h-full rounded-full bg-primary-navy"
                    style={{ width: `${(l.count / maxLeadCount) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums text-text-charcoal">{l.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-stroke bg-white p-3 shadow-sm sm:p-4 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-charcoal sm:text-base">Recent fee payments</h2>
            <Link to="/admin/reports/fee-collections" className="text-xs font-medium text-accent-teal hover:underline">
              Full report
            </Link>
          </div>
          {recentCollections.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-stroke">
              {recentCollections.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-charcoal">{c.studentName}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatDateTimeAuto(c.createdAt)}
                      {c.account ? ` · ${c.account}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-accent-teal">{inr(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
