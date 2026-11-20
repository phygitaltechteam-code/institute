import { ReactNode, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CircleHelp, Globe, Info, Mail, MessageSquareText, Plus, Star } from 'lucide-react';
import { academyApi, Faq, fileUrl, WebsiteSettings as WS } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useSetting } from '@/lib/react-query/queriesAndMutations/academy';
import { actionsCol, Btn, DataTable, Empty, ErrorState, Field, FileUpload, Input, Loading, Modal, Page, Panel, srNoCol, Textarea, useConfirm } from '../ui';

type Testimonial = NonNullable<WS['testimonials']>[number];
type Social = NonNullable<WS['social']>;

const TABS = [
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'testimonials', label: 'Testimonials', icon: MessageSquareText },
  { key: 'faq', label: 'FAQ', icon: CircleHelp },
  { key: 'contact', label: 'Contact Us', icon: Mail },
  { key: 'about', label: 'About Us', icon: Info },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const SOCIAL_KEYS: (keyof Social)[] = ['facebook', 'instagram', 'youtube', 'linkedin', 'twitter'];
const EMPTY_T: Testimonial = { name: '', role: '', message: '', photo: '', rating: 5 };
const EMPTY_FAQ: Faq = { question: '', answer: '' };
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

/** Section body: title, fields and a Save button at the bottom-right. */
const Block = ({ title, children, onSave, saving, saveLabel = 'Save', extra }: { title: string; children: ReactNode; onSave: () => void; saving?: boolean; saveLabel?: string; extra?: ReactNode }) => (
  <form
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSave();
    }}
    className="p-4 sm:p-6"
  >
    <h3 className="mb-4 text-base font-semibold text-text-charcoal">{title}</h3>
    <div className="space-y-4">{children}</div>
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      {extra}
      <Btn type="submit" variant="teal" loading={saving} className="min-w-[96px] justify-center">
        {saveLabel}
      </Btn>
    </div>
  </form>
);

/** List title with count and the Add button on the right. */
const ListHead = ({ title, count, addLabel, onAdd }: { title: string; count: number; addLabel: string; onAdd: () => void }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-base font-semibold text-text-charcoal">
      {title} <span className="text-sm font-normal text-slate-500">({count})</span>
    </h3>
    <Btn variant="teal" icon={<Plus className="h-4 w-4" />} onClick={onAdd}>
      {addLabel}
    </Btn>
  </div>
);

const Grid2 =({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="p-0.5">
        <Star className={`h-5 w-5 ${value >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

/** Website settings shown on the public landing page: name & logo, testimonials, FAQ, contact, about. */
const WebsiteSettings = () => {
  const { data, isLoading, error, refetch } = useSetting<WS>('website');
  const [tab, setTab] = useState<TabKey>('website');
  const [f, setF] = useState<WS>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  // testimonial / FAQ add-or-edit forms (index = row being edited)
  const [t, setT] = useState<Testimonial>(EMPTY_T);
  const [tIndex, setTIndex] = useState<number | null>(null);
  const [tOpen, setTOpen] = useState(false);
  const [q, setQ] = useState<Faq>(EMPTY_FAQ);
  const [qIndex, setQIndex] = useState<number | null>(null);
  const [qOpen, setQOpen] = useState(false);

  const save = useAcademyMutation((v: WS) => academyApi.saveSetting('website', v), { invalidate: [AK.settings('website')], success: false });

  useEffect(() => {
    if (data) setF(data);
  }, [data]);

  const set = <K extends keyof WS>(k: K, v: WS[K]) => setF((p) => ({ ...p, [k]: v }));
  const setSocial = (k: keyof Social, v: string) => set('social', { ...(f.social ?? {}), [k]: v });

  /** Save only this tab's fields on top of what's already stored, so unsaved edits in other tabs aren't sent. */
  const persist = (patch: Partial<WS>, message: string, after?: () => void) =>
    save.mutate({ ...(data ?? {}), ...patch }, {
      onSuccess: () => {
        setF((p) => ({ ...p, ...patch }));
        toast.success(message);
        after?.();
      },
    });

  const check = (er: Record<string, string>) => {
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const testimonials = data?.testimonials ?? [];
  const faqs = data?.faqs ?? [];

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // ── Tab: Website ───────────────────────────────────────────
  const saveWebsite = () => {
    if (!check(f.siteName && f.siteName.trim().length < 2 ? { siteName: 'Enter at least 2 characters' } : {})) return;
    persist(
      { siteName: f.siteName?.trim(), tagline: f.tagline?.trim(), logo: f.logo, favicon: f.favicon, heroTitle: f.heroTitle?.trim(), heroSubtitle: f.heroSubtitle?.trim(), heroImage: f.heroImage },
      'Website details saved',
    );
  };

  // ── Tab: Testimonials ──────────────────────────────────────
  const resetT = () => {
    setTOpen(false);
    setT(EMPTY_T);
    setTIndex(null);
    setErrors({});
  };
  const openT = (i: number | null) => {
    setT(i === null ? EMPTY_T : { ...EMPTY_T, ...testimonials[i] });
    setTIndex(i);
    setErrors({});
    setTOpen(true);
  };
  const saveTestimonial = () => {
    const er: Record<string, string> = {};
    if (t.name.trim().length < 2) er.tName = 'Enter the name';
    if (t.message.trim().length < 10) er.tMessage = 'Feedback should be at least 10 characters';
    if (!check(er)) return;
    const item: Testimonial = { name: t.name.trim(), role: t.role?.trim() || undefined, message: t.message.trim(), photo: t.photo || undefined, rating: t.rating ?? 5 };
    const list = tIndex === null ? [...testimonials, item] : testimonials.map((x, i) => (i === tIndex ? item : x));
    persist({ testimonials: list }, tIndex === null ? 'Testimonial added' : 'Testimonial updated', resetT);
  };
  const removeTestimonial = async (i: number) => {
    if (!(await confirm({ title: `Delete testimonial from ${testimonials[i].name}?`, message: 'It will be removed from the website.' }))) return;
    persist({ testimonials: testimonials.filter((_, j) => j !== i) }, 'Testimonial deleted', () => tIndex === i && resetT());
  };

  // ── Tab: FAQ ───────────────────────────────────────────────
  const resetQ = () => {
    setQOpen(false);
    setQ(EMPTY_FAQ);
    setQIndex(null);
    setErrors({});
  };
  const openQ = (i: number | null) => {
    setQ(i === null ? EMPTY_FAQ : { question: faqs[i].question, answer: faqs[i].answer });
    setQIndex(i);
    setErrors({});
    setQOpen(true);
  };
  const saveFaq = () => {
    const er: Record<string, string> = {};
    if (q.question.trim().length < 5) er.question = 'Enter the question';
    if (q.answer.trim().length < 2) er.answer = 'Enter the answer';
    if (!check(er)) return;
    const item = { question: q.question.trim(), answer: q.answer.trim() };
    const list = qIndex === null ? [...faqs, item] : faqs.map((x, i) => (i === qIndex ? item : x));
    persist({ faqs: list }, qIndex === null ? 'FAQ added' : 'FAQ updated', resetQ);
  };
  const removeFaq = async (i: number) => {
    if (!(await confirm({ title: 'Delete this FAQ?', message: faqs[i].question }))) return;
    persist({ faqs: faqs.filter((_, j) => j !== i) }, 'FAQ deleted', () => qIndex === i && resetQ());
  };
  const moveFaq = (i: number, d: -1 | 1) => {
    const list = [...faqs];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    persist({ faqs: list }, 'Order updated');
  };

  // ── Tab: Contact ───────────────────────────────────────────
  const saveContact = () => {
    const er: Record<string, string> = {};
    if (f.contactEmail && !isEmail(f.contactEmail.trim())) er.contactEmail = 'Enter a valid email';
    if (f.contactPhone && !/^[0-9+ -]{7,20}$/.test(f.contactPhone.trim())) er.contactPhone = 'Enter a valid phone number';
    if (f.whatsapp && !/^[0-9+ -]{7,20}$/.test(f.whatsapp.trim())) er.whatsapp = 'Enter a valid WhatsApp number';
    if (f.mapUrl && !isUrl(f.mapUrl.trim())) er.mapUrl = 'Link must start with http:// or https://';
    SOCIAL_KEYS.forEach((k) => {
      const v = f.social?.[k]?.trim();
      if (v && !isUrl(v)) er[k] = 'Link must start with http:// or https://';
    });
    if (!check(er)) return;
    const social = Object.fromEntries(SOCIAL_KEYS.map((k) => [k, f.social?.[k]?.trim() || undefined])) as Social;
    persist(
      { contactEmail: f.contactEmail?.trim(), contactPhone: f.contactPhone?.trim(), whatsapp: f.whatsapp?.trim(), address: f.address?.trim(), mapUrl: f.mapUrl?.trim(), social },
      'Contact details saved',
    );
  };

  // ── Tab: About ─────────────────────────────────────────────
  const saveAbout = () => persist({ aboutTitle: f.aboutTitle?.trim(), aboutContent: f.aboutContent?.trim(), aboutImage: f.aboutImage }, 'About Us saved');

  return (
    <Page title="Website Settings" subtitle="Everything here is shown on your public landing page.">
      <Panel>
        {/* Tabs */}
        <div className="border-b border-stroke px-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden" role="tablist">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  setErrors({});
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 text-sm font-medium transition sm:px-3 ${
                  tab === key ? 'border-accent-teal text-accent-teal' : 'border-transparent text-text-charcoal hover:text-accent-teal'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'website' && (
          <>
            <Block title="Website Data" onSave={saveWebsite} saving={save.isPending}>
              <Grid2>
                <Field label="Website Name" error={errors.siteName}>
                  <Input value={f.siteName ?? ''} onChange={(e) => set('siteName', e.target.value)} placeholder="Enter your website name" maxLength={80} />
                </Field>
                <Field label="Tagline" hint="Small line shown above the main heading">
                  <Input value={f.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. India's trusted medical coding academy" maxLength={120} />
                </Field>
                <Field label="Upload Logo">
                  <FileUpload kind="image" accept="image/*" value={f.logo} onUploaded={(u) => set('logo', u.url)} onClear={() => set('logo', '')} />
                </Field>
                <Field label="Favicon" hint="Small icon shown in the browser tab">
                  <FileUpload kind="image" accept="image/*" value={f.favicon} onUploaded={(u) => set('favicon', u.url)} onClear={() => set('favicon', '')} />
                </Field>
              </Grid2>
              <p className="pt-2 text-sm font-semibold text-text-charcoal">Home banner</p>
              <Field label="Main heading">
                <Input value={f.heroTitle ?? ''} onChange={(e) => set('heroTitle', e.target.value)} placeholder="Build your career in medical coding" maxLength={120} />
              </Field>
              <Field label="Sub-heading">
                <Textarea className="min-h-[70px]" value={f.heroSubtitle ?? ''} onChange={(e) => set('heroSubtitle', e.target.value)} placeholder="One or two lines about your training" maxLength={300} />
              </Field>
              <div className="sm:max-w-md">
                <Field label="Banner image">
                  <FileUpload kind="image" accept="image/*" value={f.heroImage} onUploaded={(u) => set('heroImage', u.url)} onClear={() => set('heroImage', '')} />
                </Field>
              </div>
            </Block>
          </>
        )}

        {tab === 'testimonials' && (
          <div className="p-4 sm:p-6">
            <ListHead title="Testimonials" count={testimonials.length} addLabel="Add testimonial" onAdd={() => openT(null)} />
            <DataTable
              rows={testimonials.map((x, i) => ({ ...x, _i: i }))}
              rowKey={(r) => String(r._i)}
              minWidth={640}
              empty={
                <Empty
                  icon={<MessageSquareText className="h-5 w-5" />}
                  title="No testimonials yet"
                  text="Add what your students say about you."
                  action={
                    <Btn variant="teal" icon={<Plus className="h-4 w-4" />} onClick={() => openT(null)}>
                      Add testimonial
                    </Btn>
                  }
                />
              }
              columns={[
                srNoCol(),
                {
                  header: 'Name',
                  cell: (r) => (
                    <div className="flex items-center gap-2">
                      {r.photo ? (
                        <img src={fileUrl(r.photo)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-navy text-xs font-semibold text-white">{r.name.slice(0, 1)}</span>
                      )}
                      <span className="min-w-0">
                        <span className="block font-medium text-text-charcoal">{r.name}</span>
                        {r.role && <span className="block text-xs text-slate-500">{r.role}</span>}
                      </span>
                    </div>
                  ),
                },
                { header: 'Feedback', cell: (r) => <p className="line-clamp-2 max-w-md text-slate-600">{r.message}</p> },
                {
                  header: 'Rating',
                  cell: (r) => (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" /> {r.rating ?? 5}
                    </span>
                  ),
                },
                actionsCol<Testimonial & { _i: number }>((r) => [
                  { kind: 'edit', onClick: () => openT(r._i) },
                  { kind: 'delete', onClick: () => removeTestimonial(r._i) },
                ]),
              ]}
            />
          </div>
        )}

        {tab === 'faq' && (
          <div className="p-4 sm:p-6">
            <ListHead title="FAQ's" count={faqs.length} addLabel="Add FAQ" onAdd={() => openQ(null)} />
            <DataTable
              rows={faqs.map((x, i) => ({ ...x, _i: i }))}
              rowKey={(r) => String(r._i)}
              minWidth={640}
              empty={
                <Empty
                  icon={<CircleHelp className="h-5 w-5" />}
                  title="No FAQs yet"
                  text="Add common questions students ask."
                  action={
                    <Btn variant="teal" icon={<Plus className="h-4 w-4" />} onClick={() => openQ(null)}>
                      Add FAQ
                    </Btn>
                  }
                />
              }
              columns={[
                srNoCol(),
                { header: 'Question', cell: (r) => <p className="max-w-xs font-medium text-text-charcoal">{r.question}</p> },
                { header: 'Answer', cell: (r) => <p className="line-clamp-2 max-w-md text-slate-600">{r.answer}</p> },
                actionsCol<Faq & { _i: number }>((r) => [
                  { kind: 'up', title: 'Move up', disabled: r._i === 0 || save.isPending, onClick: () => moveFaq(r._i, -1) },
                  { kind: 'down', title: 'Move down', disabled: r._i === faqs.length - 1 || save.isPending, onClick: () => moveFaq(r._i, 1) },
                  { kind: 'edit', onClick: () => openQ(r._i) },
                  { kind: 'delete', onClick: () => removeFaq(r._i) },
                ]),
              ]}
            />
          </div>
        )}

        {tab === 'contact' && (
          <Block title="Contact Us" onSave={saveContact} saving={save.isPending}>
            <Grid2>
              <Field label="Email" error={errors.contactEmail}>
                <Input type="email" value={f.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} placeholder="Enter email" />
              </Field>
              <Field label="Phone" error={errors.contactPhone}>
                <Input type="tel" value={f.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} placeholder="Enter phone number" />
              </Field>
            </Grid2>
            <Field label="Address">
              <Textarea className="min-h-[110px]" value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Enter address" maxLength={400} />
            </Field>
            <Grid2>
              <Field label="WhatsApp number" error={errors.whatsapp} hint="Used for the “Talk to a counsellor” and “Enquire” buttons">
                <Input type="tel" value={f.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="e.g. 9876543210" />
              </Field>
              <Field label="Google Maps link" error={errors.mapUrl}>
                <Input value={f.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value)} placeholder="https://maps.google.com/…" />
              </Field>
            </Grid2>
            <p className="pt-2 text-sm font-semibold text-text-charcoal">Social media links</p>
            <Grid2>
              {SOCIAL_KEYS.map((k) => (
                <Field key={k} label={k === 'twitter' ? 'X (Twitter)' : k === 'youtube' ? 'YouTube' : k === 'linkedin' ? 'LinkedIn' : k.charAt(0).toUpperCase() + k.slice(1)} error={errors[k]}>
                  <Input value={f.social?.[k] ?? ''} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" />
                </Field>
              ))}
            </Grid2>
          </Block>
        )}

        {tab === 'about' && (
          <Block title="About Us" onSave={saveAbout} saving={save.isPending}>
            <Field label="Section title">
              <Input value={f.aboutTitle ?? ''} onChange={(e) => set('aboutTitle', e.target.value)} placeholder="Why learn with us" maxLength={120} />
            </Field>
            <Field label="About Us Description" hint="Leave a blank line between paragraphs">
              <Textarea className="min-h-[160px]" value={f.aboutContent ?? ''} onChange={(e) => set('aboutContent', e.target.value)} placeholder="Enter description" maxLength={4000} />
            </Field>
            <div className="sm:max-w-md">
              <Field label="Image (optional)">
                <FileUpload kind="image" accept="image/*" value={f.aboutImage} onUploaded={(u) => set('aboutImage', u.url)} onClear={() => set('aboutImage', '')} />
              </Field>
            </div>
          </Block>
        )}
      </Panel>

      {/* Add / edit testimonial */}
      <Modal
        open={tOpen}
        title={tIndex === null ? 'Add testimonial' : 'Edit testimonial'}
        onClose={resetT}
        footer={
          <>
            <Btn variant="outline" onClick={resetT}>
              Cancel
            </Btn>
            <Btn variant="teal" loading={save.isPending} onClick={saveTestimonial}>
              {tIndex === null ? 'Save' : 'Update'}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Grid2>
            <Field label="Name" required error={errors.tName}>
              <Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="Enter name" maxLength={80} autoFocus />
            </Field>
            <Field label="Designation">
              <Input value={t.role ?? ''} onChange={(e) => setT({ ...t, role: e.target.value })} placeholder="Enter designation" maxLength={100} />
            </Field>
          </Grid2>
          <Field label="Feedback" required error={errors.tMessage}>
            <Textarea className="min-h-[110px]" value={t.message} onChange={(e) => setT({ ...t, message: e.target.value })} placeholder="Enter feedback" maxLength={800} />
          </Field>
          <Grid2>
            <Field label="Rating">
              <Stars value={t.rating ?? 5} onChange={(n) => setT({ ...t, rating: n })} />
            </Field>
            <Field label="Photo (optional)">
              <FileUpload kind="image" accept="image/*" value={t.photo} onUploaded={(u) => setT({ ...t, photo: u.url })} onClear={() => setT({ ...t, photo: '' })} />
            </Field>
          </Grid2>
        </div>
      </Modal>

      {/* Add / edit FAQ */}
      <Modal
        open={qOpen}
        title={qIndex === null ? 'Add FAQ' : 'Edit FAQ'}
        onClose={resetQ}
        footer={
          <>
            <Btn variant="outline" onClick={resetQ}>
              Cancel
            </Btn>
            <Btn variant="teal" loading={save.isPending} onClick={saveFaq}>
              {qIndex === null ? 'Save' : 'Update'}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Question" required error={errors.question}>
            <Input value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} placeholder="Enter the question" maxLength={200} autoFocus />
          </Field>
          <Field label="Answer" required error={errors.answer}>
            <Textarea className="min-h-[120px]" value={q.answer} onChange={(e) => setQ({ ...q, answer: e.target.value })} placeholder="Enter the answer" maxLength={1500} />
          </Field>
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default WebsiteSettings;
