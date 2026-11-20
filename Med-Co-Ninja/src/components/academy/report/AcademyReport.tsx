import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import ChartCard from '@/components/admin/dashboard/ChartCard';
import { baseOptions, CHART_COLORS, inrCompact } from '@/components/admin/dashboard/charts';
import { useReport } from '@/lib/react-query/queriesAndMutations/academy';
import { Btn, DataTable, Empty, ErrorState, Input, inr, Loading, Page, Panel, PanelHeader, paymentLabel, Stat, toDateInput, srNoCol } from '../ui';

const monthName = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const today = new Date();
const PRESETS: { label: string; short: string; from: () => Date }[] = [
  { label: 'This month', short: 'Month', from: () => new Date(today.getFullYear(), today.getMonth(), 1) },
  { label: '3 months', short: '3 Mo', from: () => new Date(today.getFullYear(), today.getMonth() - 2, 1) },
  { label: '12 months', short: '12 Mo', from: () => new Date(today.getFullYear(), today.getMonth() - 11, 1) },
  { label: 'This FY', short: 'FY', from: () => new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 3, 1) },
];

const AcademyReport = () => {
  const [from, setFrom] = useState(toDateInput(PRESETS[2].from()));
  const [to, setTo] = useState(toDateInput(today));
  const { data, isLoading, error, isFetching, refetch } = useReport({ from: from || undefined, to: to || undefined });

  const exportExcel = () => {
    if (!data) return;
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet([
        { Metric: 'Period', Value: `${from} to ${to}` },
        { Metric: 'Revenue', Value: data.totals.revenue },
        { Metric: 'GST', Value: data.totals.tax },
        { Metric: 'Discounts', Value: data.totals.discount },
        { Metric: 'Partner commission', Value: data.totals.commission },
        { Metric: 'Net (after GST & commission)', Value: data.totals.revenue - data.totals.tax - data.totals.commission },
        { Metric: 'Enrollments', Value: data.totals.enrollments },
        { Metric: 'Paying students', Value: data.totals.buyers },
      ]),
      'Summary',
    );
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data.monthly.map((m) => ({ Month: monthName(m.month), Revenue: m.revenue, Enrollments: m.enrollments }))), 'Monthly');
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data.items.map((i) => ({ Type: i.type, Name: i.name, Enrollments: i.enrollments, Revenue: i.revenue }))), 'By course');
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data.byPaymentMode.map((p) => ({ Mode: paymentLabel(p.mode), Count: p.count, Revenue: p.revenue }))), 'By payment mode');
    XLSX.writeFile(book, `academy-report-${from}-to-${to}.xlsx`);
  };

  const labels = data?.monthly.map((m) => monthName(m.month)) ?? [];
  const net = data ? data.totals.revenue - data.totals.tax - data.totals.commission : 0;

  return (
    <Page
      title="Report"
      subtitle="Online academy sales and enrollment performance"
      action={
        <Btn variant="outline" icon={<Download className="h-4 w-4" />} disabled={!data} onClick={exportExcel}>
          Export Excel
        </Btn>
      }
    >
      <Panel>
        {/* Mobile: presets on one line, dates on one line. Desktop: everything on one row */}
        <div className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-4 rounded-lg border border-stroke p-0.5 lg:inline-flex">
            {PRESETS.map((p) => {
              const active = from === toDateInput(p.from()) && to === toDateInput(today);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setFrom(toDateInput(p.from()));
                    setTo(toDateInput(today));
                  }}
                  className={`whitespace-nowrap rounded-md px-1 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${active ? 'bg-primary-navy text-white' : 'text-slate-600 hover:text-primary-navy'}`}
                >
                  <span className="sm:hidden">{p.short}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 text-xs text-slate-500 lg:flex">
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="min-w-0 !px-1.5 !text-xs sm:!px-3 sm:!text-sm lg:w-36" aria-label="From" />
            to
            <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="min-w-0 !px-1.5 !text-xs sm:!px-3 sm:!text-sm lg:w-36" aria-label="To" />
          </div>
        </div>
      </Panel>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data ? (
        <div className={`space-y-4 ${isFetching ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Revenue" value={inr(data.totals.revenue)} hint={`${data.totals.enrollments} enrollments`} tone="teal" />
            <Stat label="Net income" value={inr(net)} hint="after GST & partner commission" />
            <Stat label="GST collected" value={inr(data.totals.tax)} hint={`Discounts ${inr(data.totals.discount)}`} />
            <Stat label="Paying students" value={data.totals.buyers} hint={`${data.totals.totalStudents} students · ${data.totals.totalCourses} courses`} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue by month" subtitle="Amount received (GST inclusive)" valueHeader="Revenue" table={data.monthly.map((m) => ({ label: monthName(m.month), value: inr(m.revenue) }))}>
              <Bar
                data={{ labels, datasets: [{ data: data.monthly.map((m) => m.revenue), backgroundColor: CHART_COLORS.teal, borderRadius: 4, maxBarThickness: 32 }] }}
                options={baseOptions(inr, inrCompact) as ChartOptions<'bar'>}
              />
            </ChartCard>
            <ChartCard title="Enrollments by month" subtitle="New course & bundle enrollments" valueHeader="Enrollments" table={data.monthly.map((m) => ({ label: monthName(m.month), value: String(m.enrollments) }))}>
              <Line
                data={{
                  labels,
                  datasets: [{ data: data.monthly.map((m) => m.enrollments), borderColor: CHART_COLORS.navy, backgroundColor: CHART_COLORS.tealFill, fill: true, tension: 0.3, pointRadius: 3 }],
                }}
                options={baseOptions((n) => `${n} enrollment${n === 1 ? '' : 's'}`, (n) => String(n)) as ChartOptions<'line'>}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader title="Top courses & bundles" subtitle="By revenue in this period" />
              <DataTable
                minWidth={480}
                rows={data.items}
                rowKey={(r) => r.type + r.id}
                empty={<Empty title="No sales in this period" />}
                columns={[
                  srNoCol(),
                  {
                    header: 'Name',
                    cell: (r) => (
                      <div>
                        <p className="font-medium text-text-charcoal">{r.name}</p>
                        <p className="text-[11px] text-slate-500">{r.type}</p>
                      </div>
                    ),
                  },
                  { header: 'Enrollments', align: 'center', cell: (r) => r.enrollments },
                  {
                    header: 'Revenue',
                    align: 'right',
                    cell: (r) => (
                      <div className="flex items-center justify-end gap-2">
                        <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <span className="block h-full bg-accent-teal" style={{ width: `${data.totals.revenue ? (r.revenue / data.totals.revenue) * 100 : 0}%` }} />
                        </span>
                        <span className="font-semibold tabular-nums">{inr(r.revenue)}</span>
                      </div>
                    ),
                  },
                ]}
              />
            </Panel>
            <Panel>
              <PanelHeader title="By payment mode" />
              <DataTable
                minWidth={260}
                rows={data.byPaymentMode}
                rowKey={(r) => r.mode}
                empty={<Empty title="No payments" />}
                columns={[
                  { header: 'Mode', cell: (r) => paymentLabel(r.mode) },
                  { header: 'Count', align: 'center', cell: (r) => r.count },
                  { header: 'Amount', align: 'right', cell: (r) => <span className="tabular-nums">{inr(r.revenue)}</span> },
                ]}
              />
            </Panel>
          </div>
        </div>
      ) : null}
    </Page>
  );
};

export default AcademyReport;
