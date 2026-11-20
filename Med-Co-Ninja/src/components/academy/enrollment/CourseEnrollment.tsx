import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, FileText, Search, TicketPercent, UserPlus, X } from 'lucide-react';
import { academyApi, apiError, EnrollInput, EnrollResult, LearnerOption, PaymentMode } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useBundleOptions, useCourseOptions, useLearnerOptions, usePartners } from '@/lib/react-query/queriesAndMutations/academy';
import { Btn, Field, fmtDate, Input, inr, numOrNull, Page, Panel, PanelHeader, PAYMENT_MODES, Select, Textarea, useDebounced } from '../ui';
import InvoiceModal from './InvoiceModal';

const CourseEnrollment = () => {
  const [kind, setKind] = useState<'course' | 'bundle'>('course');
  const [itemId, setItemId] = useState('');
  const [picked, setPicked] = useState<LearnerOption[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [partnerId, setPartnerId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EnrollResult | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const { data: courses } = useCourseOptions();
  const { data: bundles } = useBundleOptions();
  const { data: partners } = usePartners();
  const { data: learners, isFetching: searching } = useLearnerOptions(useDebounced(search));

  const item = useMemo(() => {
    const list = kind === 'course' ? courses : bundles;
    return (list ?? []).find((x) => x.id === itemId);
  }, [kind, itemId, courses, bundles]);
  const price = item ? (item.discountPrice ?? item.price) : 0;
  const discount = coupon?.discount ?? 0;
  const payable = Math.max(0, price - discount);
  const paid = paymentMode === 'FREE' ? 0 : amount === '' ? payable : Number(amount) || 0;
  const validity = kind === 'course' && item && 'validityDays' in item ? item.validityDays : null;

  const resetCoupon = () => {
    setCoupon(null);
    setCouponErr('');
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !itemId) return setCouponErr(itemId ? 'Enter a code' : 'Select a course first');
    try {
      const r = await academyApi.validateCoupon({ code: couponCode.trim(), courseId: kind === 'course' ? itemId : null, bundleId: kind === 'bundle' ? itemId : null });
      setCoupon({ code: r.code, discount: r.discount });
      setCouponErr('');
      setAmount('');
    } catch (e) {
      setCoupon(null);
      setCouponErr(apiError(e).message);
    }
  };

  const enroll = useAcademyMutation((d: EnrollInput) => academyApi.enroll(d), {
    invalidate: [AK.enrollments, AK.report, AK.partners, AK.coupons, AK.learners, AK.courses],
    success: false,
  });

  const submit = () => {
    const e: Record<string, string> = {};
    if (!itemId) e.courseId = `Select a ${kind}`;
    if (!picked.length) e.studentIds = 'Add at least one student';
    if (couponCode.trim() && !coupon) e.coupon = 'Apply the coupon or clear the code';
    setErrors(e);
    if (Object.keys(e).length) return;
    enroll.mutate(
      {
        studentIds: picked.map((p) => p.id),
        courseId: kind === 'course' ? itemId : null,
        bundleId: kind === 'bundle' ? itemId : null,
        paymentMode,
        amountPaid: paymentMode === 'FREE' ? 0 : numOrNull(amount),
        couponCode: coupon?.code ?? null,
        partnerId: partnerId || null,
        paymentRef: paymentRef || null,
        note: note || null,
        expiresAt: expiresAt || null,
      },
      {
        onSuccess: (r) => {
          setResult(r);
          setPicked([]);
          setCouponCode('');
          resetCoupon();
          setAmount('');
          setPaymentRef('');
          setNote('');
        },
        onError: (err) => setErrors(apiError(err).fields),
      },
    );
  };

  return (
    <Page
      title="Course Enrollment"
      subtitle="Give students access to a course or bundle and record the payment"
      action={
        <Link to="/admin/enrollment/history">
          <Btn variant="outline">Enroll History</Btn>
        </Link>
      }
    >
      {result && (
        <Panel className="border-accent-teal/40 bg-accent-teal/5">
          <div className="flex flex-wrap items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-teal" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-text-charcoal">
                {result.created.length} student(s) enrolled
                {result.skipped.length > 0 && <span className="font-normal text-amber-700"> · {result.skipped.length} skipped</span>}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                {result.created.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    {c.student.user.fullname} — {c.invoiceNo} — {inr(c.amountPaid)}
                    <button type="button" className="inline-flex items-center gap-1 font-medium text-accent-teal hover:underline" onClick={() => setInvoiceId(c.id)}>
                      <FileText className="h-3.5 w-3.5" /> Invoice
                    </button>
                  </li>
                ))}
                {result.skipped.map((s) => (
                  <li key={s.studentId} className="text-amber-700">
                    {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader title="1. What to enroll in" />
            <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
              <div className="flex h-fit rounded-lg border border-stroke p-0.5 text-sm font-medium">
                {(['course', 'bundle'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setItemId('');
                      resetCoupon();
                    }}
                    className={`rounded-md px-3 py-1.5 capitalize ${kind === k ? 'bg-primary-navy text-white' : 'text-slate-600'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <Field error={errors.courseId || errors.bundleId}>
                <Select
                  value={itemId}
                  onChange={(e) => {
                    setItemId(e.target.value);
                    resetCoupon();
                    setAmount('');
                  }}
                >
                  <option value="">— Select {kind} —</option>
                  {(kind === 'course' ? courses : bundles)?.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} · {inr(x.discountPrice ?? x.price)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="2. Students"
              subtitle="Search by name, phone or email"
              action={
                <Link to="/admin/users/students" className="inline-flex items-center gap-1 text-xs font-medium text-accent-teal hover:underline">
                  <UserPlus className="h-3.5 w-3.5" /> New student
                </Link>
              }
            />
            <div className="space-y-3 p-4">
              {picked.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {picked.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary-navy/5 py-1 pl-3 pr-1 text-xs font-medium text-primary-navy">
                      {p.user.fullname}
                      <button type="button" aria-label={`Remove ${p.user.fullname}`} onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} className="rounded-full p-0.5 hover:bg-primary-navy/10">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search students…" className="pl-9" />
              </div>
              <div className={`max-h-56 divide-y divide-stroke overflow-y-auto rounded-lg border border-stroke ${searching ? 'opacity-60' : ''}`}>
                {(learners ?? []).map((l) => {
                  const on = picked.some((p) => p.id === l.id);
                  return (
                    <label key={l.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={on} onChange={() => setPicked(on ? picked.filter((p) => p.id !== l.id) : [...picked, l])} className="h-4 w-4 accent-[#139a8c]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text-charcoal">{l.user.fullname}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {l.user.phoneNumber} · {l.user.email}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {learners?.length === 0 && <p className="p-3 text-sm text-slate-500">No students found.</p>}
              </div>
              {errors.studentIds && <p className="text-xs text-red-600">{errors.studentIds}</p>}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="3. Payment" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Payment mode" required>
                <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount received (₹)" hint={paymentMode === 'FREE' ? 'Free enrollment' : `Defaults to ${inr(payable)} per student`} error={errors.amountPaid}>
                <Input type="number" min={0} disabled={paymentMode === 'FREE'} value={paymentMode === 'FREE' ? 0 : amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(payable)} />
              </Field>
              <Field label="Coupon code" error={couponErr || errors.coupon} hint={coupon ? `Applied: −${inr(coupon.discount)}` : undefined}>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      resetCoupon();
                    }}
                    placeholder="e.g. WELCOME10"
                  />
                  <Btn variant="outline" icon={<TicketPercent className="h-4 w-4" />} onClick={applyCoupon}>
                    Apply
                  </Btn>
                </div>
              </Field>
              <Field label="Partner / referrer" hint="Commission is calculated on the amount received">
                <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                  <option value="">None {coupon ? '(or the coupon’s partner)' : ''}</option>
                  {partners?.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.commissionPercent}%)
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Transaction / reference no.">
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="UPI ref, receipt no…" />
              </Field>
              <Field label="Access until" hint={validity ? `Default: ${validity} days from today` : 'Default: lifetime'}>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Note" className="sm:col-span-2">
                <Textarea className="min-h-[60px]" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
          </Panel>
        </div>

        <div>
          <Panel className="lg:sticky lg:top-20">
            <PanelHeader title="Summary" />
            <div className="space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{kind === 'course' ? 'Course' : 'Bundle'}</span>
                <span className="text-right font-medium">{item?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <span>{inr(price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coupon discount</span>
                <span>{discount ? `− ${inr(discount)}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Received per student</span>
                <span className="font-semibold">{inr(paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Students</span>
                <span>{picked.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access</span>
                <span>{expiresAt ? `till ${fmtDate(expiresAt)}` : validity ? `${validity} days` : 'Lifetime'}</span>
              </div>
              <div className="flex justify-between border-t border-stroke pt-2 text-base font-bold text-primary-navy">
                <span>Total</span>
                <span>{inr(paid * picked.length)}</span>
              </div>
              <Btn className="mt-2 w-full" loading={enroll.isPending} onClick={submit}>
                Enroll {picked.length > 1 ? `${picked.length} students` : 'student'}
              </Btn>
            </div>
          </Panel>
        </div>
      </div>
      <InvoiceModal enrollmentId={invoiceId} onClose={() => setInvoiceId(null)} />
    </Page>
  );
};

export default CourseEnrollment;
