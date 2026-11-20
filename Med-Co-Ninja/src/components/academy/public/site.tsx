import { FormEvent, ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Loader2, LogIn, Mail, MapPin, Menu, Phone, Send, X } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { apiError, ContactMessageInput, fileUrl, publicApi, WebsiteSettings } from '@/lib/api/admin/academyApi';

/** Shared pieces of the public website (home, blogs, blog post). */

export const BRAND = 'MedCode Ninja';

export const useWebsite = () => {
  const q = useQuery({ queryKey: ['public', 'website'], queryFn: publicApi.website, retry: 1, staleTime: 60_000 });
  const w: WebsiteSettings = q.data ?? {};
  return { w, siteName: w.siteName || BRAND, isLoading: q.isLoading };
};

/** Keeps only simple formatting from the admin's rich-text editor (no scripts, styles or event handlers). */
const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'A', 'BLOCKQUOTE', 'DIV', 'SPAN', 'IMG']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON']);
export const sanitizeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = (el: Element) => {
    // Iterate over a snapshot; unwrapped children are cleaned before being moved up
    Array.from(el.children).forEach((child) => {
      clean(child);
      if (DROP.has(child.tagName)) {
        child.remove();
        return;
      }
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      Array.from(child.attributes).forEach((a) => {
        const keepHref = child.tagName === 'A' && a.name === 'href' && /^(https?:|mailto:|tel:|\/)/i.test(a.value);
        const keepImg = child.tagName === 'IMG' && ((a.name === 'src' && /^(https?:|\/)/i.test(a.value)) || a.name === 'alt');
        if (!keepHref && !keepImg) child.removeAttribute(a.name);
      });
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noreferrer');
      }
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
};

export const waNumber = (raw?: string | null) => {
  const d = (raw ?? '').replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

export const SiteLogo = ({ w, siteName, light }: { w: WebsiteSettings; siteName: string; light?: boolean }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    {w.logo ? (
      <img src={fileUrl(w.logo)} alt={siteName} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
    ) : (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal text-base font-bold text-white">{siteName.slice(0, 1)}</span>
    )}
    <span className={`truncate text-base font-bold sm:text-lg ${light ? 'text-white' : 'text-primary-navy'}`}>{siteName}</span>
  </span>
);

/** Menu: Course Bundles · Blogs · About Us · Contact (anchors live on the home page). */
const NAV = [
  { label: 'Course Bundles', href: '/#bundles' },
  { label: 'Blogs', to: '/blogs' as const },
  { label: 'About Us', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export const PublicHeader = ({ w, siteName, active }: { w: WebsiteSettings; siteName: string; active?: 'blogs' }) => {
  const [open, setOpen] = useState(false);
  const item = (n: (typeof NAV)[number], mobile = false) => {
    const cls = mobile
      ? 'block rounded-lg px-3 py-2.5 text-[15px] font-medium text-text-charcoal hover:bg-slate-50'
      : `text-[15px] font-medium transition hover:text-accent-teal ${n.to === '/blogs' && active === 'blogs' ? 'text-accent-teal' : 'text-text-charcoal'}`;
    return n.to ? (
      <Link key={n.label} to={n.to} className={cls} onClick={() => setOpen(false)}>
        {n.label}
      </Link>
    ) : (
      <a key={n.label} href={n.href} className={cls} onClick={() => setOpen(false)}>
        {n.label}
      </a>
    );
  };
  return (
    <header className="sticky top-0 z-40 border-b border-stroke bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        <Link to="/" className="min-w-0">
          <SiteLogo w={w} siteName={siteName} />
        </Link>
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">{NAV.map((n) => item(n))}</nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link to="/signin" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-navy px-3 py-2 text-sm font-semibold text-white hover:bg-primary-navy/90 sm:px-4">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
          <button type="button" className="rounded-lg p-2 text-primary-navy hover:bg-slate-100 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && <nav className="border-t border-stroke bg-white px-3 py-2 md:hidden">{NAV.map((n) => item(n, true))}</nav>}
    </header>
  );
};

export const Section = ({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) => (
  <section id={id} className={`scroll-mt-20 ${className}`}>
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-accent-teal">{eyebrow}</p>}
          <h2 className="mt-1 text-[22px] font-bold leading-tight text-primary-navy sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-6 sm:mt-8">{children}</div>
    </div>
  </section>
);

// ── Contact ───────────────────────────────────────────────────
const SOCIAL = [
  { key: 'facebook', icon: FaFacebookF, label: 'Facebook' },
  { key: 'instagram', icon: FaInstagram, label: 'Instagram' },
  { key: 'youtube', icon: FaYoutube, label: 'YouTube' },
  { key: 'linkedin', icon: FaLinkedinIn, label: 'LinkedIn' },
  { key: 'twitter', icon: FaXTwitter, label: 'X (Twitter)' },
] as const;

const EMPTY_FORM: ContactMessageInput = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

const Line = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) => (
  <label className="block">
    <span className="text-[13px] font-semibold text-text-charcoal">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);
const lineInput =
  'mt-1 w-full border-0 border-b border-stroke bg-transparent px-0 py-2 text-sm text-text-charcoal outline-none transition placeholder:text-slate-400 focus:border-accent-teal focus:ring-0';

export const ContactSection = ({ w }: { w: WebsiteSettings }) => {
  const [f, setF] = useState<ContactMessageInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const set = (k: keyof ContactMessageInput, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'Enter a valid email';
    if (f.phone && !/^[0-9+ -]{7,20}$/.test(f.phone.trim())) er.phone = 'Enter a valid phone number';
    if (f.subject.trim().length < 2) er.subject = 'Enter a subject';
    if (f.message.trim().length < 5) er.message = 'Write a short message';
    setErrors(er);
    setFailed(null);
    if (Object.keys(er).length) return;
    setSending(true);
    try {
      setSent(await publicApi.contact(f));
      setF(EMPTY_FORM);
    } catch (err) {
      const x = apiError(err);
      setErrors(x.fields);
      setFailed(x.message);
    } finally {
      setSending(false);
    }
  };

  const info = [
    w.contactEmail && { icon: <Mail className="h-4 w-4" />, label: 'Email', value: w.contactEmail, href: `mailto:${w.contactEmail}` },
    w.contactPhone && { icon: <Phone className="h-4 w-4" />, label: 'Phone', value: w.contactPhone, href: `tel:${w.contactPhone}` },
    w.address && { icon: <MapPin className="h-4 w-4" />, label: 'Address', value: w.address, href: w.mapUrl || undefined },
  ].filter(Boolean) as { icon: ReactNode; label: string; value: string; href?: string }[];
  const socials = SOCIAL.filter((s) => w.social?.[s.key]);

  return (
    <section id="contact" className="scroll-mt-20 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-stroke md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Contact information */}
          <div className="relative overflow-hidden bg-primary-navy p-5 text-white sm:p-8">
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-accent-teal/25" />
            <h2 className="relative text-xl font-bold sm:text-2xl">Contact information</h2>
            <p className="relative mt-2 text-sm text-slate-300">Get in touch with us if you have any questions or need any help.</p>
            <ul className="relative mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              {info.length ? (
                info.map((i) => (
                  <li key={i.label} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-teal/20 text-teal-300">{i.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{i.label}</span>
                      {i.href ? (
                        <a href={i.href} target={i.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block whitespace-pre-line break-words text-sm text-slate-300 hover:text-white">
                          {i.value}
                        </a>
                      ) : (
                        <span className="block whitespace-pre-line break-words text-sm text-slate-300">{i.value}</span>
                      )}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-300">Send us a message and our team will reply soon.</li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="relative mt-10">
                <p className="text-base font-semibold">Connect with us on social media</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={w.social![s.key]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-teal/20 text-teal-200 transition hover:bg-accent-teal hover:text-white"
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Get in touch */}
          <div className="p-5 sm:p-8">
            <h2 className="text-xl font-bold text-primary-navy sm:text-2xl">Get in touch</h2>
            <p className="mt-2 text-sm text-slate-600">If you have any questions or feedback, please fill in the form below or email us directly.</p>
            {sent ? (
              <div className="mt-8 flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <p className="mt-3 font-semibold text-emerald-800">{sent}</p>
                <button type="button" onClick={() => setSent(null)} className="mt-4 text-sm font-semibold text-accent-teal hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6 space-y-5">
                {/* Honeypot for bots: hidden from people and screen readers */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => set('website', e.target.value)} />
                <Line label="Your name" required error={errors.name}>
                  <input className={lineInput} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" autoComplete="name" />
                </Line>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Line label="Email" required error={errors.email}>
                    <input type="email" className={lineInput} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="example@email.com" autoComplete="email" />
                  </Line>
                  <Line label="Phone number" error={errors.phone}>
                    <input type="tel" className={lineInput} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                  </Line>
                </div>
                <Line label="Subject" required error={errors.subject}>
                  <input className={lineInput} value={f.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Subject of your message" />
                </Line>
                <Line label="Message" required error={errors.message}>
                  <textarea rows={4} className={`${lineInput} resize-y`} value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Write your message here…" />
                </Line>
                {failed && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{failed}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PublicFooter = ({ w, siteName }: { w: WebsiteSettings; siteName: string }) => (
  <footer className="bg-primary-navy text-slate-300">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <SiteLogo w={w} siteName={siteName} light />
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {NAV.map((n) =>
          n.to ? (
            <Link key={n.label} to={n.to} className="hover:text-white">
              {n.label}
            </Link>
          ) : (
            <a key={n.label} href={n.href} className="hover:text-white">
              {n.label}
            </a>
          ),
        )}
        <Link to="/signin" className="hover:text-white">
          Login
        </Link>
      </nav>
    </div>
    <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
      © {new Date().getFullYear()} {siteName}. All rights reserved.
    </p>
  </footer>
);
