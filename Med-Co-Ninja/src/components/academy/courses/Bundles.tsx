import { useState } from 'react';
import { Boxes, Check, Copy, ExternalLink, ImageOff, Plus, Trash2 } from 'lucide-react';
import { academyApi, apiError, Bundle, BundleInput, bundleLandingUrl, fileUrl } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useBundles, useCourseOptions } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, Empty, ErrorState, Field, FileUpload, IconBtn, Input, inr, Loading, Modal, numOrNull, Page, Panel, Textarea, Toggle, useConfirm, RowActions } from '../ui';

const EMPTY: BundleInput = { name: '', description: '', thumbnail: null, price: 0, discountPrice: null, isActive: true, courseIds: [], faqs: [] };

const Bundles = () => {
  const { data, isLoading, error, refetch } = useBundles();
  const { data: courses } = useCourseOptions();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<BundleInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const { confirm, dialog } = useConfirm();
  // After creating a bundle, show its landing-page link so it can be shared straight away
  const [created, setCreated] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(bundleLandingUrl(id));
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      window.prompt('Copy this link', bundleLandingUrl(id));
    }
  };

  const save = useAcademyMutation(
    (d: BundleInput) => (editing && editing !== 'new' ? academyApi.updateBundle(editing, d) : academyApi.createBundle(d)),
    { invalidate: [AK.bundles], success: 'Bundle saved' },
  );
  const remove = useAcademyMutation(academyApi.deleteBundle, { invalidate: [AK.bundles], success: 'Bundle deleted' });

  const open = (b?: Bundle) => {
    setErrors({});
    setFilter('');
    setEditing(b ? b.id : 'new');
    setF(
      b
        ? { name: b.name, description: b.description ?? '', thumbnail: b.thumbnail, price: b.price, discountPrice: b.discountPrice, isActive: b.isActive, courseIds: b.courses.map((c) => c.id), faqs: Array.isArray(b.faqs) ? b.faqs : [] }
        : EMPTY,
    );
  };
  const set = <K extends keyof BundleInput>(k: K, v: BundleInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleCourse = (id: string) => set('courseIds', f.courseIds.includes(id) ? f.courseIds.filter((x) => x !== id) : [...f.courseIds, id]);

  const sumOfCourses = (courses ?? []).filter((c) => f.courseIds.includes(c.id)).reduce((s, c) => s + (c.discountPrice ?? c.price), 0);
  const selling = f.discountPrice ?? f.price;

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter a bundle name';
    if (f.courseIds.length === 0) e.courseIds = 'Pick at least one course';
    if (f.discountPrice != null && f.discountPrice > f.price) e.discountPrice = 'Offer price cannot be more than the price';
    // Drop fully empty rows; a half-filled Q&A is an error
    const faqs = f.faqs.map((x) => ({ question: x.question.trim(), answer: x.answer.trim() })).filter((x) => x.question || x.answer);
    if (faqs.some((x) => !x.question || !x.answer)) e.faqs = 'Each Q&A needs both a question and an answer';
    setErrors(e);
    if (Object.keys(e).length) return;
    const isNew = editing === 'new';
    save.mutate({ ...f, faqs }, {
      onSuccess: (res) => {
        setEditing(null);
        const id = (res as { id?: string } | undefined)?.id;
        if (isNew && id) setCreated({ id, name: f.name, isActive: f.isActive });
      },
      onError: (err) => setErrors(apiError(err).fields) });
  };

  return (
    <Page
      title="Bundles"
      subtitle="Sell several courses together at one price"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Create Bundle
        </Btn>
      }
    >
      <Panel>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data?.length ? (
          <Empty icon={<Boxes className="h-5 w-5" />} title="No bundles yet" text="Combine related courses (e.g. CPC + CCS) and offer them at a better price." action={<Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>Create Bundle</Btn>} />
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((b) => (
              <article key={b.id} className="flex flex-col overflow-hidden rounded-xl border border-stroke">
                <div className="relative aspect-video bg-slate-100">
                  {b.thumbnail ? (
                    <img src={fileUrl(b.thumbnail)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-slate-400">
                      <ImageOff className="h-8 w-8" />
                    </span>
                  )}
                  <span className="absolute left-2 top-2">
                    <Badge tone={b.isActive ? 'green' : 'gray'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-semibold text-text-charcoal">{b.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {b.courses.length} course(s) · {b.enrollmentCount} enrolled
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
                    {b.courses.slice(0, 4).map((c) => (
                      <li key={c.id} className="truncate">
                        • {c.name}
                      </li>
                    ))}
                    {b.courses.length > 4 && <li className="text-slate-400">+{b.courses.length - 4} more</li>}
                  </ul>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-primary-navy">{inr(b.discountPrice ?? b.price)}</span>
                      {b.discountPrice != null && b.discountPrice < b.price && <span className="text-xs text-slate-400 line-through">{inr(b.price)}</span>}
                    </span>
                    <div className="flex gap-1">
                      <RowActions
                        actions={[
                          { kind: 'open', title: b.isActive ? 'Open landing page' : 'Activate the bundle to open its landing page', href: bundleLandingUrl(b.id), disabled: !b.isActive },
                          { kind: 'copy', title: copied === b.id ? 'Link copied' : 'Copy landing page link', done: copied === b.id, disabled: !b.isActive, onClick: () => copyLink(b.id) },
                          { kind: 'edit', onClick: () => open(b) },
                          {
                            kind: 'delete',
                            onClick: async () => {
                              if (await confirm({ title: `Delete bundle “${b.name}”?` })) remove.mutate(b.id);
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={!!editing}
        size="lg"
        title={editing === 'new' ? 'Create bundle' : 'Edit bundle'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn loading={save.isPending} onClick={submit}>
              Save bundle
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bundle name" required error={errors.name} className="sm:col-span-2">
            <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Complete Medical Coding Pack" />
          </Field>
          <Field label="Courses in this bundle" required error={errors.courseIds} className="sm:col-span-2">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter courses…" className="mb-2" />
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-stroke p-2">
              {(courses ?? [])
                .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
                .map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={f.courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} className="h-4 w-4 accent-[#139a8c]" />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-slate-500">{inr(c.discountPrice ?? c.price)}</span>
                  </label>
                ))}
              {!courses?.length && <p className="p-2 text-sm text-slate-500">Create courses first.</p>}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {f.courseIds.length} selected · individually {inr(sumOfCourses)}
              {sumOfCourses > selling && selling > 0 && <span className="font-semibold text-accent-teal"> · students save {inr(sumOfCourses - selling)}</span>}
            </p>
          </Field>
          <Field label="Price (₹)" required error={errors.price}>
            <Input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Offer price (₹)" error={errors.discountPrice}>
            <Input type="number" min={0} value={f.discountPrice ?? ''} onChange={(e) => set('discountPrice', numOrNull(e.target.value))} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Thumbnail">
            <FileUpload kind="image" accept="image/*" value={f.thumbnail} onUploaded={(r) => set('thumbnail', r.url)} onClear={() => set('thumbnail', null)} />
          </Field>
          <div className="flex items-start pt-6">
            <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active" hint="Inactive bundles cannot be sold" />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-text-charcoal">Questions &amp; Answers</p>
                <p className="text-xs text-slate-500">Shown in the FAQ section of this bundle's landing page</p>
              </div>
              <Btn size="sm" variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => set('faqs', [...f.faqs, { question: '', answer: '' }])}>
                Add Q&amp;A
              </Btn>
            </div>
            <div className="space-y-2">
              {f.faqs.length === 0 && <p className="rounded-lg border border-dashed border-stroke p-3 text-center text-sm text-slate-500">No questions added yet.</p>}
              {f.faqs.map((q, i) => (
                <div key={i} className="flex gap-2 rounded-lg border border-stroke p-2.5">
                  <span className="mt-2 w-5 shrink-0 text-xs font-semibold text-slate-400">Q{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    <Input value={q.question} placeholder="Question" onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                    <Textarea className="min-h-[60px]" value={q.answer} placeholder="Answer" onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                  </div>
                  <IconBtn title="Remove Q&A" tone="red" onClick={() => set('faqs', f.faqs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              ))}
              {errors.faqs && <p className="text-xs text-red-600">{errors.faqs}</p>}
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!created}
        size="sm"
        title="Bundle created"
        onClose={() => setCreated(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setCreated(null)}>
              Close
            </Btn>
            {created?.isActive && (
              <Btn icon={<ExternalLink className="h-4 w-4" />} onClick={() => created && window.open(bundleLandingUrl(created.id), '_blank', 'noopener')}>
                Open landing page
              </Btn>
            )}
          </>
        }
      >
        {created && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">{created.name}</span> has its own landing page. Share this link with students on WhatsApp, Instagram or your website.
            </p>
            {created.isActive ? (
              <div className="flex items-center gap-2">
                <Input readOnly value={bundleLandingUrl(created.id)} onFocus={(e) => e.target.select()} className="text-xs" />
                <Btn variant="outline" size="sm" icon={copied === created.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={() => copyLink(created.id)}>
                  {copied === created.id ? 'Copied' : 'Copy'}
                </Btn>
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">This bundle is inactive, so its landing page is hidden. Turn on “Active” to publish it.</p>
            )}
          </div>
        )}
      </Modal>
      {dialog}
    </Page>
  );
};

export default Bundles;
