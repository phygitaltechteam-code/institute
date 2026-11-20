import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { academyApi, apiError, CourseInput } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCategories, useCourse } from '@/lib/react-query/queriesAndMutations/academy';
import { Btn, ErrorState, Field, FileUpload, IconBtn, Input, Loading, numOrNull, Page, Panel, PanelHeader, RichText, Select, Textarea, Toggle } from '../ui';

const EMPTY: CourseInput = {
  name: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  thumbnail: null,
  price: 0,
  discountPrice: null,
  level: 'Beginner',
  language: 'English',
  validityDays: null,
  status: 'DRAFT',
  allowDownload: false,
  faqs: [],
};

const CourseForm = ({ courseId }: { courseId?: string }) => {
  const navigate = useNavigate();
  const isEdit = !!courseId;
  const { data: existing, isLoading, error } = useCourse(courseId ?? '');
  const { data: categories } = useCategories();
  const [f, setF] = useState<CourseInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCat, setNewCat] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setF({
        name: existing.name,
        categoryId: existing.categoryId ?? existing.category?.id ?? '',
        shortDescription: existing.shortDescription ?? '',
        description: existing.description ?? '',
        thumbnail: existing.thumbnail,
        price: existing.price,
        discountPrice: existing.discountPrice,
        level: existing.level ?? '',
        language: existing.language ?? '',
        validityDays: existing.validityDays,
        status: existing.status,
        allowDownload: existing.allowDownload,
        faqs: Array.isArray(existing.faqs) ? existing.faqs : [],
      });
    }
  }, [existing]);

  const set = <K extends keyof CourseInput>(k: K, v: CourseInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useAcademyMutation(
    (d: CourseInput) => (isEdit ? academyApi.updateCourse(courseId!, d) : academyApi.createCourse(d)),
    { invalidate: [AK.courses, AK.categories], success: isEdit ? 'Course updated' : 'Course created' },
  );
  const addCat = useAcademyMutation(academyApi.createCategory, { invalidate: [AK.categories], success: 'Category added' });

  const submit = (goToCurriculum: boolean) => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter the course name';
    if (f.price < 0) e.price = 'Price cannot be negative';
    if (f.discountPrice != null && f.discountPrice > f.price) e.discountPrice = 'Offer price cannot be more than the price';
    const faqs = f.faqs.filter((x) => x.question.trim() || x.answer.trim());
    if (faqs.some((x) => !x.question.trim() || !x.answer.trim())) e.faqs = 'Each FAQ needs both a question and an answer';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { ...f, faqs, categoryId: f.categoryId || null },
      {
        onSuccess: (c) => {
          const id = isEdit ? courseId! : (c as { id: string }).id;
          navigate(goToCurriculum ? { to: '/admin/courses/$courseId/curriculum', params: { courseId: id } } : { to: '/admin/courses/manage' });
        },
        onError: (err) => setErrors(apiError(err).fields),
      },
    );
  };

  if (isEdit && isLoading) return <Loading />;
  if (isEdit && error) return <ErrorState error={error} />;

  return (
    <Page
      title={isEdit ? 'Edit Course' : 'Add New Course'}
      subtitle={isEdit ? existing?.name : 'Fill in the details, then build the curriculum'}
      action={
        <Btn variant="outline" onClick={() => navigate({ to: '/admin/courses/manage' })}>
          ← Back
        </Btn>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader title="Basic information" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Course name" required error={errors.name} className="sm:col-span-2">
                <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. CPC Exam Preparation" />
              </Field>
              <Field label="Category" error={errors.categoryId}>
                {newCat === null ? (
                  <div className="flex gap-2">
                    <Select value={f.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)}>
                      <option value="">— Select —</option>
                      {categories?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <IconBtn title="New category" onClick={() => setNewCat('')}>
                      <Plus className="h-4 w-4" />
                    </IconBtn>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" />
                    <Btn
                      size="sm"
                      loading={addCat.isPending}
                      onClick={() =>
                        newCat.trim() &&
                        addCat.mutate(newCat.trim(), {
                          onSuccess: (c) => {
                            set('categoryId', (c as { id: string }).id);
                            setNewCat(null);
                          },
                        })
                      }
                    >
                      Add
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => setNewCat(null)}>
                      Cancel
                    </Btn>
                  </div>
                )}
              </Field>
              <Field label="Level">
                <Select value={f.level ?? ''} onChange={(e) => set('level', e.target.value)}>
                  <option value="">—</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>All levels</option>
                </Select>
              </Field>
              <Field label="Language">
                <Input value={f.language ?? ''} onChange={(e) => set('language', e.target.value)} placeholder="English" />
              </Field>
              <Field label="Access validity (days)" hint="Leave empty for lifetime access" error={errors.validityDays}>
                <Input type="number" min={1} value={f.validityDays ?? ''} onChange={(e) => set('validityDays', numOrNull(e.target.value))} placeholder="Lifetime" />
              </Field>
              <Field label="Short description" hint="Shown on course cards (1–2 lines)" className="sm:col-span-2">
                <Textarea className="min-h-[64px]" maxLength={300} value={f.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)} />
              </Field>
              <Field label="Full description" className="sm:col-span-2">
                <RichText value={f.description ?? ''} onChange={(v) => set('description', v)} minHeight={180} />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Course FAQs"
              subtitle="Answers to common questions, shown on the course page"
              action={
                <Btn size="sm" variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => set('faqs', [...f.faqs, { question: '', answer: '' }])}>
                  Add FAQ
                </Btn>
              }
            />
            <div className="space-y-3 p-4">
              {f.faqs.length === 0 && <p className="text-sm text-slate-500">No FAQs added.</p>}
              {f.faqs.map((q, i) => (
                <div key={i} className="flex gap-2 rounded-lg border border-stroke p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={q.question}
                      placeholder="Question"
                      onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                    />
                    <Textarea
                      className="min-h-[60px]"
                      value={q.answer}
                      placeholder="Answer"
                      onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                    />
                  </div>
                  <IconBtn title="Remove FAQ" tone="red" onClick={() => set('faqs', f.faqs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              ))}
              {errors.faqs && <p className="text-xs text-red-600">{errors.faqs}</p>}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Publish" />
            <div className="space-y-4 p-4">
              <Field label="Status">
                <Select value={f.status} onChange={(e) => set('status', e.target.value as CourseInput['status'])}>
                  <option value="DRAFT">Draft — hidden, still editing</option>
                  <option value="PUBLIC">Published — visible on website</option>
                  <option value="PRIVATE">Private — enrolled students only</option>
                </Select>
              </Field>
              <Toggle checked={f.allowDownload} onChange={(v) => set('allowDownload', v)} label="Allow video download" hint="Students can download lesson videos" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Pricing" />
            <div className="grid gap-4 p-4">
              <Field label="Price (₹)" required error={errors.price} hint="Set 0 for a free course">
                <Input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value) || 0)} />
              </Field>
              <Field label="Offer price (₹)" error={errors.discountPrice} hint="Optional discounted selling price">
                <Input type="number" min={0} value={f.discountPrice ?? ''} onChange={(e) => set('discountPrice', numOrNull(e.target.value))} />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Thumbnail" subtitle="16:9 image, e.g. 1280×720" />
            <div className="p-4">
              <FileUpload kind="image" accept="image/*" value={f.thumbnail} onUploaded={(r) => set('thumbnail', r.url)} onClear={() => set('thumbnail', null)} label="Upload thumbnail" hint="JPG, PNG or WEBP" />
            </div>
          </Panel>

          <div className="flex flex-col gap-2">
            <Btn loading={save.isPending} onClick={() => submit(true)}>
              {isEdit ? 'Save & open curriculum' : 'Save & add lessons'}
            </Btn>
            <Btn variant="outline" disabled={save.isPending} onClick={() => submit(false)}>
              Save
            </Btn>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default CourseForm;
