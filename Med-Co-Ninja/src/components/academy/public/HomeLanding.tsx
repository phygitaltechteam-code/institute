import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Award, BookOpen, Briefcase, CalendarDays, ChevronDown, ImageOff, Layers, MessageCircle, Quote, Star, Users, Video } from 'lucide-react';
import { fileUrl, publicApi } from '@/lib/api/admin/academyApi';
import { useAuthContext } from '@/context/AuthContext';
import { fmtDate, inr } from '../ui';
import { ContactSection, PublicFooter, PublicHeader, sanitizeHtml, Section, useWebsite, waNumber } from './site';

const HOME_BY_ROLE: Record<string, string> = {
  SUPERADMIN: '/superadmin/admins',
  ADMIN: '/admin/dashboard',
  TEACHER: '/faculty/batchtable',
  STUDENT: '/student/studentdahboard',
};
const opts = { retry: 1, staleTime: 60_000 } as const;

const HomeLanding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();

  // Logged-in users go straight to their own panel
  useEffect(() => {
    if (isAuthenticated && user?.role && HOME_BY_ROLE[user.role]) navigate({ to: HOME_BY_ROLE[user.role], replace: true });
  }, [isAuthenticated, user?.role, navigate]);

  const { w, siteName } = useWebsite();
  const popular = useQuery({ queryKey: ['public', 'courses', 'popular'], queryFn: () => publicApi.courses(true), ...opts });
  const all = useQuery({
    queryKey: ['public', 'courses', 'all'],
    queryFn: () => publicApi.courses(false),
    ...opts,
    // only needed when no course is marked popular
    enabled: popular.isSuccess && popular.data.length === 0,
  });
  const bundles = useQuery({ queryKey: ['public', 'bundles'], queryFn: publicApi.bundles, ...opts });
  const blogs = useQuery({ queryKey: ['public', 'blogs'], queryFn: publicApi.blogs, ...opts });

  const courses = (popular.data?.length ? popular.data : (all.data ?? [])).slice(0, 6);
  const coursesLoading = popular.isLoading || all.isFetching;
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // About text may be plain text (Website Settings) or older rich-text HTML
  const aboutIsHtml = !!w.aboutContent && /<[a-z][\s\S]*>/i.test(w.aboutContent);
  const about = useMemo(() => (w.aboutContent && aboutIsHtml ? sanitizeHtml(w.aboutContent) : ''), [w.aboutContent, aboutIsHtml]);
  const aboutParas = !aboutIsHtml && w.aboutContent ? w.aboutContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];

  useEffect(() => {
    document.title = w.tagline ? `${siteName} | ${w.tagline}` : siteName;
  }, [siteName, w.tagline]);

  // Favicon from Website Settings
  useEffect(() => {
    if (!w.favicon) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = fileUrl(w.favicon);
  }, [w.favicon]);

  // Opening /#contact etc. from another page: scroll once the sections exist
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => clearTimeout(t);
  }, [bundles.isSuccess, blogs.isSuccess]);

  const wa = waNumber(w.whatsapp || w.contactPhone);
  const enquire = (what?: string) =>
    wa
      ? `https://wa.me/${wa}?text=${encodeURIComponent(what ? `Hi, I'd like to know more about "${what}".` : `Hi, I'd like to know more about your courses.`)}`
      : '#contact';
  const ext = (href: string) => (href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {});

  const faqs = w.faqs?.filter((f) => f.question && f.answer) ?? [];
  const testimonials = w.testimonials?.filter((t) => t.name && t.message).slice(0, 6) ?? [];
  const latestBlogs = (blogs.data ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-text-charcoal">
      <PublicHeader w={w} siteName={siteName} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-primary-navy text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-teal/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div className="min-w-0">
            {w.tagline && <p className="inline-flex max-w-full rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-200 ring-1 ring-inset ring-white/15">{w.tagline}</p>}
            <h1 className="mt-4 break-words text-[28px] font-bold leading-tight sm:text-4xl lg:text-5xl">{w.heroTitle || 'Build your career in medical coding'}</h1>
            <p className="mt-4 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-slate-200 sm:text-lg">
              {w.heroSubtitle || 'Industry-focused training for CPC, CCS and specialty coding, with expert faculty, live classes, practice exams and placement support.'}
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <a href={bundles.data?.length ? '#bundles' : courses.length ? '#courses' : '#contact'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-teal px-5 py-3 text-sm font-semibold text-white shadow hover:brightness-110">
                Explore courses <ArrowRight className="h-4 w-4" />
              </a>
              <a href={enquire()} {...ext(enquire())} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">
                <MessageCircle className="h-4 w-4" /> Talk to a counsellor
              </a>
            </div>
          </div>
          {w.heroImage ? (
            <img src={fileUrl(w.heroImage)} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" />
          ) : (
            <div className="hidden grid-cols-2 gap-3 lg:grid">
              {[
                { icon: <Award className="h-6 w-6" />, t: 'Certification prep', d: 'CPC, CCS & specialty exams' },
                { icon: <Video className="h-6 w-6" />, t: 'Live + recorded', d: 'Learn at your own pace' },
                { icon: <Users className="h-6 w-6" />, t: 'Expert faculty', d: 'Coders from the industry' },
                { icon: <Briefcase className="h-6 w-6" />, t: 'Placement support', d: 'Interview & job help' },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-inset ring-white/10">
                  <span className="text-teal-300">{c.icon}</span>
                  <p className="mt-3 font-semibold">{c.t}</p>
                  <p className="text-sm text-slate-300">{c.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="border-b border-stroke bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6 md:grid-cols-4">
          {[
            { icon: <Award className="h-5 w-5" />, t: 'Certification prep' },
            { icon: <Video className="h-5 w-5" />, t: 'Live & recorded classes' },
            { icon: <BookOpen className="h-5 w-5" />, t: 'Practice exams' },
            { icon: <Briefcase className="h-5 w-5" />, t: 'Placement support' },
          ].map((h) => (
            <div key={h.t} className="flex items-center gap-2 text-[13px] font-medium leading-snug text-primary-navy sm:gap-2.5 sm:text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">{h.icon}</span>
              {h.t}
            </div>
          ))}
        </div>
      </div>

      {/* Course bundles */}
      {bundles.data && bundles.data.length > 0 && (
        <Section id="bundles" eyebrow="Save more" title="Course bundles" subtitle="Learn several courses together at a better price.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.data.map((b) => {
              const price = b.discountPrice ?? b.price;
              const off = b.discountPrice != null && b.price > 0 && b.discountPrice < b.price ? Math.round(((b.price - b.discountPrice) / b.price) * 100) : 0;
              return (
                <Link
                  key={b.id}
                  to="/bundle/$bundleId"
                  params={{ bundleId: b.id }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-stroke bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {b.thumbnail ? (
                      <img src={fileUrl(b.thumbnail)} alt={b.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full items-center justify-center bg-gradient-to-br from-primary-navy to-accent-teal text-white/80">
                        <Layers className="h-10 w-10" />
                      </span>
                    )}
                    {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">{off}% off</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-primary-navy">{b.name}</h3>
                    <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
                      {b.courses.slice(0, 3).map(({ course }) => (
                        <li key={course.id} className="truncate">
                          • {course.name}
                        </li>
                      ))}
                      {b.courses.length > 3 && <li className="text-xs text-slate-400">+{b.courses.length - 3} more</li>}
                    </ul>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-primary-navy">{inr(price)}</span>
                        {off > 0 && <span className="text-xs text-slate-400 line-through">{inr(b.price)}</span>}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-teal">
                        View details <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* Courses */}
      {(coursesLoading || courses.length > 0) && (
        <Section id="courses" eyebrow="Courses" title="Popular courses" subtitle="Start with a course that fits your goal. Ask us anything before you enroll." className="bg-slate-50">
          {coursesLoading && !courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => {
                const price = c.discountPrice ?? c.price;
                return (
                  <article key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-stroke bg-white shadow-sm transition hover:shadow-md">
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
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-primary-navy">{price ? inr(price) : 'Free'}</span>
                          {c.discountPrice != null && c.discountPrice < c.price && <span className="text-xs text-slate-400 line-through">{inr(c.price)}</span>}
                        </span>
                        <a href={enquire(c.name)} {...ext(enquire(c.name))} className="inline-flex items-center gap-1 rounded-lg bg-accent-teal/10 px-3 py-1.5 text-xs font-semibold text-accent-teal hover:bg-accent-teal/20">
                          Enquire <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* About us */}
      <Section id="about" eyebrow="About us" title={w.aboutTitle || `Why learn with ${siteName}`}>
        <div className={`grid items-start gap-8 ${w.aboutImage ? 'lg:grid-cols-2' : ''}`}>
          {about ? (
            <div className="prose-academy max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: about }} />
          ) : aboutParas.length ? (
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 sm:text-base">
              {aboutParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line break-words">
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { t: 'Practical, job-ready training', d: 'Real medical records, coding guidelines and audit practice, not just theory.' },
                { t: 'Certification focused', d: 'Structured preparation and mock exams for CPC, CCS and specialty credentials.' },
                { t: 'Learn your way', d: 'Live classes with recordings, notes and doubt support from faculty.' },
                { t: 'Career support', d: 'Resume help, interview preparation and placement assistance.' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-stroke p-5">
                  <p className="font-semibold text-primary-navy">{x.t}</p>
                  <p className="mt-1 text-sm text-slate-600">{x.d}</p>
                </div>
              ))}
            </div>
          )}
          {w.aboutImage && <img src={fileUrl(w.aboutImage)} alt="" className="w-full rounded-2xl object-cover shadow-lg" loading="lazy" />}
        </div>
      </Section>

      {/* Blogs */}
      {latestBlogs.length > 0 && (
        <Section
          id="blogs"
          eyebrow="Blogs"
          title="Latest from our blog"
          className="bg-slate-50"
          action={
            <Link to="/blogs" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-teal hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestBlogs.map((b) => (
              <BlogCard key={b.id} b={b} />
            ))}
          </div>
        </Section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section id="testimonials" eyebrow="Testimonials" title="What our students say">
          {/* Phones: swipe sideways; tablets/desktop: grid */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="flex w-[85%] shrink-0 snap-center flex-col rounded-xl border border-stroke bg-white p-5 sm:w-auto">
                <Quote className="h-5 w-5 text-accent-teal" />
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">{t.message}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  {t.photo ? (
                    <img src={fileUrl(t.photo)} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-navy text-sm font-semibold text-white">{t.name.slice(0, 1)}</span>
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
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <Section id="faq" eyebrow="FAQ" title="Frequently asked questions">
          <div className="max-w-3xl space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-stroke">
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

      <ContactSection w={w} />
      <PublicFooter w={w} siteName={siteName} />
    </div>
  );
};

export const BlogCard = ({ b }: { b: Awaited<ReturnType<typeof publicApi.blogs>>[number] }) => (
  <Link
    to="/blogs/$slug"
    params={{ slug: b.slug }}
    className="group flex flex-col overflow-hidden rounded-xl border border-stroke bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="aspect-video bg-slate-100">
      {b.coverImage ? (
        <img src={fileUrl(b.coverImage)} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="flex h-full items-center justify-center bg-gradient-to-br from-primary-navy to-accent-teal text-white/80">
          <BookOpen className="h-10 w-10" />
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(b.publishedAt)}
        {b.author && <span>· {b.author}</span>}
      </p>
      <h3 className="mt-1.5 line-clamp-2 font-semibold text-primary-navy group-hover:text-accent-teal">{b.title}</h3>
      {b.excerpt && <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{b.excerpt}</p>}
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-accent-teal">
        Read more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  </Link>
);

export default HomeLanding;
