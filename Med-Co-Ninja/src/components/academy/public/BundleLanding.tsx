import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ImageOff,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Quote,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { apiError, bundleLandingUrl, fileUrl, publicApi, PublicBundle, PublicBundleCourse } from '@/lib/api/admin/academyApi';
import { inr } from '../ui';

// ── helpers ───────────────────────────────────────────────────
const lessonsOf = (c: PublicBundleCourse) => c.sections.reduce((n, s) => n + s.lessons.length, 0);
const minutesOf = (c: PublicBundleCourse) =>
  c.sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.durationMinutes ?? 0), 0), 0);
const hours = (min: number) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
};
const sellPrice = (p: { price: number; discountPrice: number | null }) => p.discountPrice ?? p.price;
/** wa.me needs the number with country code and no symbols; assume India for 10-digit numbers. */
const waNumber = (raw?: string | null) => {
  const d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  return d.length === 10 ? `91${d}` : d;
};

const Section = ({ id, eyebrow, title, children, className = '' }: { id?: string; eyebrow?: string; title: string; children: ReactNode; className?: string }) => (
  <section id={id} className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 ${className}`}>
    {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-accent-teal">{eyebrow}</p>}
    <h2 className="mt-1 text-xl font-bold text-primary-navy sm:text-2xl">{title}</h2>
    <div className="mt-6">{children}</div>
  </section>
);

// ── page ──────────────────────────────────────────────────────
const BundleLanding = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useQuery({ queryKey: ['public', 'bundle', id], queryFn: () => publicApi.bundle(id), retry: 1 });

  useEffect(() => {
    if (data) document.title = `${data.name} | ${data.website.siteName || data.institute.name}`;
  }, [data]);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent-teal border-t-transparent" />
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center">
        <Layers className="h-10 w-10 text-slate-300" />
        <h1 className="text-lg font-semibold text-primary-navy">Bundle not available</h1>
        <p className="max-w-sm text-sm text-slate-500">{error ? apiError(error).message : 'This link may be old, or the bundle is no longer on sale.'}</p>
      </div>
    );
  return <Landing b={data} />;
};

const Landing = ({ b }: { b: PublicBundle }) => {
  const [copied, setCopied] = useState(false);
  const [openCourse, setOpenCourse] = useState<string | null>(b.courses[0]?.id ?? null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const siteName = b.website.siteName || b.institute.name;
  const logo = b.website.logo || b.institute.logo;
  const phone = b.website.contactPhone || b.institute.phone;
  const email = b.website.contactEmail || b.institute.email;
  const address = b.website.address || b.institute.address;
  const url = bundleLandingUrl(b.id);

  const stats = useMemo(() => {
    const lessons = b.courses.reduce((n, c) => n + lessonsOf(c), 0);
    const minutes = b.courses.reduce((n, c) => n + minutesOf(c), 0);
    const worth = b.courses.reduce((n, c) => n + sellPrice(c), 0);
    const validity = b.courses.some((c) => c.validityDays == null) ? null : Math.max(0, ...b.courses.map((c) => c.validityDays ?? 0));
    return { lessons, minutes, worth, validity };
  }, [b.courses]);

  const price = sellPrice(b);
  const saveVsCourses = stats.worth - price;
  const offPct = b.discountPrice != null && b.price > 0 && b.discountPrice < b.price ? Math.round(((b.price - b.discountPrice) / b.price) * 100) : 0;

  const wa = waNumber(b.website.whatsapp || phone);
  const enrollHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I'd like to enroll in the "${b.name}" bundle (${inr(price)}).\n${url}`)}`
    : phone
      ? `tel:${phone}`
      : email
        ? `mailto:${email}?subject=${encodeURIComponent(`Enrollment: ${b.name}`)}`
        : '#contact';

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: b.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled the share sheet */
    }
  };

  // Bundle's own FAQs first, then the website-wide FAQs (skipping duplicate questions)
  const faqs = [...(Array.isArray(b.faqs) ? b.faqs : []), ...(b.website.faqs ?? [])]
    .filter((f) => f.question?.trim() && f.answer?.trim())
    .filter((f, i, all) => all.findIndex((x) => x.question.trim().toLowerCase() === f.question.trim().toLowerCase()) === i);
  const testimonials = b.website.testimonials?.filter((t) => t.name && t.message).slice(0, 6) ?? [];
  const includes = [
    `${b.courses.length} complete course${b.courses.length === 1 ? '' : 's'}`,
    stats.lessons ? `${stats.lessons} video lessons` : null,
    stats.minutes ? `${hours(stats.minutes)} of content` : null,
    stats.validity == null ? 'Lifetime access' : stats.validity ? `${stats.validity} days access` : null,
    'Doubt support from faculty',
  ].filter(Boolean) as string[];

  const EnrollBtn = ({ className = '' }: { className?: string }) => (
    <a
      href={enrollHref}
      target={enrollHref.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-accent-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 ${className}`}
    >
      {wa ? <MessageCircle className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
      Enroll now
    </a>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-text-charcoal lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-stroke bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            {logo ? (
              <img src={fileUrl(logo)} alt={siteName} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-navy text-sm font-bold text-white">{siteName.slice(0, 1)}</span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary-navy sm:text-base">{siteName}</p>
              {(b.website.tagline || b.institute.tagline) && <p className="hidden truncate text-[11px] text-slate-500 sm:block">{b.website.tagline || b.institute.tagline}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {phone && (
              <a href={`tel:${phone}`} className="hidden items-center gap-1.5 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-primary-navy hover:bg-slate-50 sm:inline-flex">
                <Phone className="h-4 w-4" /> {phone}
              </a>
            )}
            <EnrollBtn className="!px-4 !py-2" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-primary-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-200 ring-1 ring-inset ring-white/15">
              <Layers className="h-3.5 w-3.5" /> Course bundle · {b.courses.length} course{b.courses.length === 1 ? '' : 's'}
            </span>
            <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-4xl">{b.name}</h1>
            {b.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-200 sm:text-base">{b.description}</p>}

            <dl className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <BookOpen className="h-4 w-4" />, label: 'Courses', value: b.courses.length },
                { icon: <PlayCircle className="h-4 w-4" />, label: 'Lessons', value: stats.lessons || '—' },
                { icon: <Clock className="h-4 w-4" />, label: 'Duration', value: hours(stats.minutes) || '—' },
                { icon: <Users className="h-4 w-4" />, label: 'Enrolled', value: b.enrollmentCount || 'New' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-inset ring-white/10">
                  <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-300">
                    {s.icon} {s.label}
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#courses" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-navy hover:bg-slate-100">
                See what's included
              </a>
              <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'Link copied' : 'Share'}
              </button>
            </div>
          </div>

          {/* Price card */}
          <aside className="overflow-hidden rounded-2xl bg-white text-text-charcoal shadow-xl lg:sticky lg:top-20">
            <div className="aspect-video bg-slate-100">
              {b.thumbnail ? (
                <img src={fileUrl(b.thumbnail)} alt={b.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center bg-gradient-to-br from-primary-navy to-accent-teal text-white/80">
                  <Layers className="h-12 w-12" />
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-primary-navy">{inr(price)}</span>
                {offPct > 0 && <span className="text-base text-slate-400 line-through">{inr(b.price)}</span>}
                {offPct > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{offPct}% off</span>}
              </div>
              {saveVsCourses > 0 && (
                <p className="mt-1 text-sm text-slate-600">
                  Worth {inr(stats.worth)} if bought separately. <span className="font-semibold text-accent-teal">You save {inr(saveVsCourses)}.</span>
                </p>
              )}
              <EnrollBtn className="mt-4 w-full" />
              {phone && (
                <a href={`tel:${phone}`} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-primary-navy hover:bg-slate-50">
                  <Phone className="h-4 w-4" /> Call for details
                </a>
              )}
              <ul className="mt-5 space-y-2 border-t border-stroke pt-4 text-sm">
                {includes.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Courses */}
      <Section id="courses" eyebrow="What's included" title={`${b.courses.length} course${b.courses.length === 1 ? '' : 's'} in this bundle`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {b.courses.map((c) => (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-stroke bg-white shadow-sm">
              <div className="aspect-video bg-slate-100">
                {c.thumbnail ? (
                  <img src={fileUrl(c.thumbnail)} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-slate-300">
                    <ImageOff className="h-8 w-8" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                {c.category && <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-teal">{c.category.name}</p>}
                <h3 className="mt-0.5 font-semibold text-primary-navy">{c.name}</h3>
                {c.shortDescription && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{c.shortDescription}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  {c.level && <span className="rounded-full bg-slate-100 px-2 py-0.5">{c.level}</span>}
                  {c.language && <span className="rounded-full bg-slate-100 px-2 py-0.5">{c.language}</span>}
                  {lessonsOf(c) > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5">{lessonsOf(c)} lessons</span>}
                  {minutesOf(c) > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5">{hours(minutesOf(c))}</span>}
                </div>
                <p className="mt-auto pt-3 text-xs text-slate-500">
                  Worth <span className="font-semibold text-slate-700">{inr(sellPrice(c))}</span> on its own
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Curriculum */}
      {b.courses.some((c) => c.sections.length) && (
        <div className="bg-white">
          <Section eyebrow="Curriculum" title="What you'll learn">
            <div className="space-y-3">
              {b.courses
                .filter((c) => c.sections.length)
                .map((c) => {
                  const open = openCourse === c.id;
                  return (
                    <div key={c.id} className="overflow-hidden rounded-xl border border-stroke">
                      <button
                        type="button"
                        onClick={() => setOpenCourse(open ? null : c.id)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-primary-navy">{c.name}</span>
                          <span className="text-xs text-slate-500">
                            {c.sections.length} module{c.sections.length === 1 ? '' : 's'} · {lessonsOf(c)} lessons
                            {minutesOf(c) ? ` · ${hours(minutesOf(c))}` : ''}
                          </span>
                        </span>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && (
                        <ol className="divide-y divide-stroke">
                          {c.sections.map((s, si) => (
                            <li key={si} className="px-4 py-3">
                              <p className="text-sm font-semibold text-text-charcoal">
                                {si + 1}. {s.title}
                              </p>
                              <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                                {s.lessons.map((l, li) => (
                                  <li key={li} className="flex items-start gap-2 text-sm text-slate-600">
                                    <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-teal" />
                                    <span className="min-w-0 flex-1">{l.title}</span>
                                    {l.durationMinutes ? <span className="shrink-0 text-xs text-slate-400">{hours(l.durationMinutes)}</span> : null}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
            </div>
          </Section>
        </div>
      )}

      {/* Value */}
      <Section eyebrow="Pricing" title="Why the bundle is the better deal">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-stroke bg-white shadow-sm">
          <ul className="divide-y divide-stroke text-sm">
            {b.courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate">{c.name}</span>
                <span className="shrink-0 text-slate-600">{inr(sellPrice(c))}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 font-medium">
              <span>Total if bought separately</span>
              <span className={saveVsCourses > 0 ? 'text-slate-400 line-through' : ''}>{inr(stats.worth)}</span>
            </li>
            <li className="flex items-center justify-between gap-3 bg-primary-navy px-4 py-3 font-semibold text-white">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-300" /> Bundle price
              </span>
              <span className="text-lg">{inr(price)}</span>
            </li>
          </ul>
          {saveVsCourses > 0 && <p className="bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700">You save {inr(saveVsCourses)}</p>}
        </div>
        <div className="mt-6 text-center">
          <EnrollBtn className="px-8" />
        </div>
      </Section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div className="bg-white">
          <Section eyebrow="Students say" title="Learners who trained with us">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <figure key={i} className="flex flex-col rounded-xl border border-stroke bg-slate-50 p-4">
                  <Quote className="h-5 w-5 text-accent-teal" />
                  <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">{t.message}</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    {t.photo ? (
                      <img src={fileUrl(t.photo)} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-navy text-sm font-semibold text-white">{t.name.slice(0, 1)}</span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{t.name}</span>
                      {t.role && <span className="block text-xs text-slate-500">{t.role}</span>}
                    </span>
                    {t.rating ? (
                      <span className="ml-auto flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" /> {t.rating}
                      </span>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <Section eyebrow="FAQ" title="Frequently asked questions">
          <div className="mx-auto max-w-3xl space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-stroke bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-primary-navy">
                  {f.question}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-slate-600">{f.answer}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contact / footer */}
      <footer id="contact" className="bg-primary-navy text-slate-200">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-lg font-bold text-white">Ready to start {b.name}?</p>
            <p className="mt-1 max-w-md text-sm text-slate-300">Talk to our team for a free counselling session, batch timings and payment options.</p>
            <EnrollBtn className="mt-4" />
          </div>
          <ul className="space-y-2.5 text-sm">
            {phone && (
              <li>
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 text-teal-300" /> {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 break-all hover:text-white">
                  <Mail className="h-4 w-4 shrink-0 text-teal-300" /> {email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" /> {address}
              </li>
            )}
          </ul>
        </div>
        <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </footer>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-stroke bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{b.name}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-primary-navy">{inr(price)}</span>
            {offPct > 0 && <span className="text-xs text-slate-400 line-through">{inr(b.price)}</span>}
          </p>
        </div>
        <EnrollBtn className="shrink-0 !py-2.5" />
      </div>
    </div>
  );
};

export default BundleLanding;
