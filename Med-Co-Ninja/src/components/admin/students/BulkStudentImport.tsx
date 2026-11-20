import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import PageHeader from '@/components/Common/PageHeader';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useBulkImportStudents } from '@/lib/react-query/queriesAndMutations/dashboardAdmin';
import { BulkImportResult, BulkStudentRow } from '@/lib/api/admin/dashboardApi';

/** Excel column headers → API field names. "Name", "Mobile No." and "E-Mail ID" match the admin-panel template. */
const COLUMNS: { header: string; key: keyof BulkStudentRow; required?: boolean }[] = [
  { header: 'Name', key: 'fullname', required: true },
  { header: 'Mobile No.', key: 'phoneNumber', required: true },
  { header: 'E-Mail ID', key: 'email', required: true },
  { header: 'Password', key: 'password' },
  { header: 'City', key: 'city' },
  { header: 'State', key: 'state' },
  { header: 'Pincode', key: 'pincode' },
  { header: 'Address', key: 'address' },
  { header: 'Qualification', key: 'qualification' },
  { header: 'College', key: 'collegeName' },
];

const passwordOk = (v: string) => v.length >= 8 && /\d/.test(v) && /[a-zA-Z]/.test(v);

const downloadTemplate = () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    COLUMNS.map((c) => c.header),
    ['Asha Kulkarni', '9876500001', 'asha@example.com', 'Welcome@123', 'Pune', 'Maharashtra', '411001', 'Kothrud', 'B.Sc', 'Fergusson College'],
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Students');
  XLSX.writeFile(book, 'student-import-template.xlsx');
};

const BulkStudentImport = () => {
  const { user } = useAuthContext();
  const { data: batchData, isLoading: batchesLoading } = useGetBatches(user?.role);
  const { mutate: runImport, isPending } = useBulkImportStudents();
  const fileInput = useRef<HTMLInputElement>(null);

  const [batchId, setBatchId] = useState('');
  const [feeOptionId, setFeeOptionId] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BulkStudentRow[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const batches: any[] = batchData?.data ?? [];
  const selectedBatch = batches.find((b) => b.id === batchId);
  const feeOptions: any[] = selectedBatch?.feeOptions ?? [];
  const selectedFee = feeOptions.find((o) => o.id === feeOptionId);
  const feeTotal = (selectedFee?.feeInstallments ?? []).reduce((s: number, i: any) => s + (i.amount || 0), 0);

  const rowsMissingPassword = useMemo(() => rows.filter((r) => !r.password).length, [rows]);
  const defaultPasswordNeeded = rowsMissingPassword > 0;
  const defaultPasswordInvalid = defaultPasswordNeeded && !passwordOk(defaultPassword);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const book = XLSX.read(ev.target?.result, { type: 'array' });
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[book.SheetNames[0]], { defval: '' });
        const parsed = json
          .map((r) => {
            const row: any = {};
            COLUMNS.forEach((c) => {
              const v = r[c.header];
              if (v !== undefined && String(v).trim() !== '') row[c.key] = String(v).trim();
            });
            return row as BulkStudentRow;
          })
          .filter((r) => r.fullname || r.phoneNumber || r.email);
        if (parsed.length === 0) toast.error('No student rows found. Use the template headers.');
        setRows(parsed);
      } catch {
        toast.error('Could not read this file. Please upload an .xlsx or .csv file.');
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const canImport = rows.length > 0 && batchId && feeOptionId && !defaultPasswordInvalid && !isPending;

  const handleImport = () => {
    if (!canImport) return;
    runImport(
      {
        batchId,
        feeOptionId,
        defaultPassword: defaultPasswordNeeded ? defaultPassword : undefined,
        students: rows,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          if (res.failed.length === 0) setRows([]);
        },
      },
    );
  };

  const downloadLogins = () => {
    if (!result) return;
    const sheet = XLSX.utils.json_to_sheet(
      result.created.map((c) => ({ Name: c.name, 'Mobile No.': c.phoneNumber, 'Login User ID': c.username })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Logins');
    XLSX.writeFile(book, 'imported-student-logins.xlsx');
  };

  const selectCls =
    'w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-accent-teal disabled:bg-gray-100';

  return (
    <div className="p-3 md:p-6">
      <PageHeader
        title="Bulk Student Import"
        subtitle="Add many students to a batch from one Excel sheet"
        action={
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-primary-navy px-3 py-2 text-xs font-semibold text-primary-navy transition hover:bg-primary-navy hover:text-white sm:text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Template</span>
          </button>
        }
      />

      <div className="space-y-3 md:space-y-4">
        {/* Step 1: batch & fee plan */}
        <section className="rounded-xl border-l-4 border-primary-navy bg-white p-3 shadow-sm sm:p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary-navy sm:text-base">1. Batch & fee plan</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Batch *</span>
              <select
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setFeeOptionId('');
                }}
                className={selectCls}
                disabled={batchesLoading}
              >
                <option value="">{batchesLoading ? 'Loading…' : 'Select batch'}</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Fee plan *</span>
              <select
                value={feeOptionId}
                onChange={(e) => setFeeOptionId(e.target.value)}
                className={selectCls}
                disabled={!batchId}
              >
                <option value="">{batchId ? 'Select fee plan' : 'Select a batch first'}</option>
                {feeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col justify-end rounded-lg bg-bg-light-mint px-3 py-2 text-sm">
              <span className="text-xs text-slate-500">Fee per student</span>
              <b className="text-primary-navy">{feeOptionId ? `₹${feeTotal.toLocaleString('en-IN')}` : '—'}</b>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Default password {defaultPasswordNeeded && <span className="text-red-500">*</span>}
              </span>
              <input
                type="text"
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
                placeholder="For rows without a password"
                className={`${selectCls} ${defaultPasswordInvalid && defaultPassword ? 'border-red-400' : ''}`}
              />
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {defaultPasswordNeeded
                  ? `${rowsMissingPassword} row(s) have no password. Min 8 chars, a letter and a number.`
                  : 'Used only for rows without a Password column value.'}
              </span>
            </label>
          </div>
        </section>

        {/* Step 2: upload */}
        <section className="rounded-xl border-l-4 border-accent-teal bg-white p-3 shadow-sm sm:p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary-navy sm:text-base">2. Upload sheet</h2>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stroke px-4 py-5 text-center transition hover:border-accent-teal hover:bg-bg-light-mint"
          >
            <FileSpreadsheet className="h-7 w-7 text-accent-teal" />
            <span className="text-sm font-semibold text-text-charcoal">{fileName || 'Choose an Excel file'}</span>
            <span className="text-xs text-slate-500">
              Columns: {COLUMNS.filter((c) => c.required).map((c) => c.header).join(', ')} (required) + optional details
            </span>
          </button>
          <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

          {rows.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-slate-600">
                Preview: <b>{rows.length}</b> student(s)
              </p>
              <div className="max-h-72 overflow-auto rounded-lg border border-stroke">
                <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-primary-navy text-white">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Mobile</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Password</th>
                      <th className="px-3 py-2">City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-stroke even:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-500">{i + 2}</td>
                        <td className="px-3 py-1.5">{r.fullname || <span className="text-red-500">missing</span>}</td>
                        <td className="px-3 py-1.5">{r.phoneNumber || <span className="text-red-500">missing</span>}</td>
                        <td className="px-3 py-1.5">{r.email || <span className="text-red-500">missing</span>}</td>
                        <td className="px-3 py-1.5">{r.password ? '••••••' : <span className="text-slate-400">default</span>}</td>
                        <td className="px-3 py-1.5">{r.city || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Result */}
        {result && (
          <section className="rounded-xl border border-stroke bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-text-charcoal sm:text-base">
                Imported {result.created.length} of {result.total}
              </h2>
              {result.created.length > 0 && (
                <button
                  onClick={downloadLogins}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-teal px-3 py-1.5 text-xs font-semibold text-white sm:text-sm"
                >
                  <Download className="h-4 w-4" /> Download login IDs
                </button>
              )}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Created ({result.created.length})
                </p>
                <ul className="max-h-56 divide-y divide-stroke overflow-y-auto rounded-lg border border-stroke text-xs sm:text-sm">
                  {result.created.map((c) => (
                    <li key={c.row} className="flex justify-between gap-2 px-3 py-1.5">
                      <span className="truncate">{c.name}</span>
                      <span className="shrink-0 font-mono font-semibold text-primary-navy">{c.username}</span>
                    </li>
                  ))}
                  {result.created.length === 0 && <li className="px-3 py-3 text-slate-500">None</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                  <XCircle className="h-4 w-4" /> Not imported ({result.failed.length})
                </p>
                <ul className="max-h-56 divide-y divide-stroke overflow-y-auto rounded-lg border border-stroke text-xs sm:text-sm">
                  {result.failed.map((f) => (
                    <li key={f.row} className="px-3 py-1.5">
                      <span className="font-medium">
                        Row {f.row}: {f.name || '(no name)'}
                      </span>
                      <span className="block text-red-600">{f.reason}</span>
                    </li>
                  ))}
                  {result.failed.length === 0 && <li className="px-3 py-3 text-slate-500">None — all rows imported</li>}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Action bar */}
        <div className="sticky bottom-0 z-10 -mx-3 flex items-center justify-between gap-3 border-t border-stroke bg-white/95 px-3 py-2.5 backdrop-blur md:-mx-6 md:px-6">
          <span className="text-xs text-slate-500 sm:text-sm">
            {rows.length > 0 ? `${rows.length} row(s) ready` : 'Upload a sheet to continue'}
          </span>
          <button
            onClick={handleImport}
            disabled={!canImport}
            className="flex items-center gap-1.5 rounded-lg bg-primary-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-navy/90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isPending ? 'Importing…' : 'Import students'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkStudentImport;
