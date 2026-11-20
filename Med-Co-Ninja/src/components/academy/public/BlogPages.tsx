import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, BookOpen, CalendarDays, Check, Search, Share2, UserRound } from 'lucide-react';
import { apiError, fileUrl, publicApi } from '@/lib/api/admin/academyApi';
import { fmtDate } from '../ui';
import { BlogCard } from './HomeLanding';
import { ContactSection, PublicFooter, PublicHeader, sanitizeHtml, useWebsite } from './site';

const opts = { retry: 1, staleTime: 60_000 } as const;

/** /blogs — all published posts with search and tag filter. */
export const BlogList = () => {
  const { w, siteName } = useWebsite();
  const { data, isLoading, error } = useQuery({ queryKey: ['public', 'blogs'], queryFn: publicApi.blogs, ...opts });
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Blogs | ${siteName}`;
  }, [siteName]);

  const tags = useMemo(() => [...new Set((data ?? []).flatMap((b) => b.tags))].slice(0, 12), [data]);
  const posts = (data ?? []).filter((b) => {
    const q = search.trim().toLowerCase();
    return (!tag || b.tags.includes(tag)) && (!q || b.title.toLowerCase().includes(q) || (b.excerpt ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-white text-text-charcoal">
      <PublicHeader w={w} siteName={siteName} active="blogs" />
      <div className="bg-primary-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Blogs</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Insights, tips & updates</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Guides on medical coding, certification preparation and careers from the {siteName} team.</p>
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles"
              className="w-full rounded-lg border-0 bg-white py-2.5 pl-9 pr-3 text-sm text-text-charcoal outline-none ring-2 ring-transparent focus:ring-accent-teal"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {[null, ...tags].map((t) => (
              <button
                key={t ?? 'all'}
                type="button"
                onClick={() => setTag(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${tag === t ? 'bg-primary-navy text-white ring-primary-navy' : 'text-slate-600 ring-stroke hover:bg-slate-50'}`}
              >
                {t ?? 'All'}
              </button>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-600">{apiError(error).message}</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-primary-navy">{data?.length ? 'No articles match your search' : 'No articles yet'}</p>
            <p className="mt-1 text-sm text-slate-500">{data?.length ? 'Try another word or tag.' : 'Please check back soon.'}</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((b) => (
              <BlogCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>

      <ContactSection w={w} />
      <PublicFooter w={w} siteName={siteName} />
    </div>
  );
};

/** /blogs/:slug — one published post. */
export const BlogPost = ({ slug }: { slug: string }) => {
  const { w, siteName } = useWebsite();
  const { data: post, isLoading, error } = useQuery({ queryKey: ['public', 'blog', slug], queryFn: () => publicApi.blog(slug), ...opts });
  const { data: all } = useQuery({ queryKey: ['public', 'blogs'], queryFn: publicApi.blogs, ...opts });
  const html = useMemo(() => (post ? sanitizeHtml(post.content) : ''), [post]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post) document.title = `${post.title} | ${siteName}`;
  }, [post, siteName]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* share sheet closed */
    }
  };

  const more = (all ?? []).filter((b) => b.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-text-charcoal">
      <PublicHeader w={w} siteName={siteName} active="blogs" />
      {isLoading ? (
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6">
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="aspect-video animate-pulse rounded-xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded bg-slate-100" />
        </div>
      ) : error || !post ? (
        <div className="flex flex-col items-center px-4 py-24 text-center">
          <BookOpen className="h-10 w-10 text-slate-300" />
          <h1 className="mt-3 text-lg font-semibold text-primary-navy">Article not found</h1>
          <p className="mt-1 text-sm text-slate-500">{error ? apiError(error).message : 'It may have been moved or unpublished.'}</p>
          <Link to="/blogs" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-teal hover:underline">
            <ArrowLeft className="h-4 w-4" /> All blogs
          </Link>
        </div>
      ) : (
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/blogs" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-teal hover:underline">
            <ArrowLeft className="h-4 w-4" /> All blogs
          </Link>
          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-accent-teal/10 px-2.5 py-0.5 text-xs font-medium text-accent-teal">
                  {t}
                </span>
              ))}
            </div>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight text-primary-navy sm:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4" /> {post.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {fmtDate(post.publishedAt)}
            </span>
            <button type="button" onClick={share} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-primary-navy ring-1 ring-inset ring-stroke hover:bg-slate-50">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
          {post.coverImage && <img src={fileUrl(post.coverImage)} alt="" className="mt-6 aspect-video w-full rounded-2xl object-cover" />}
          {post.excerpt && <p className="mt-6 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>}
          <div className="prose-academy mt-6 max-w-none text-[15px] leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      )}

      {more.length > 0 && (
        <div className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-bold text-primary-navy">More articles</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((b) => (
                <BlogCard key={b.id} b={b} />
              ))}
            </div>
          </div>
        </div>
      )}

      <ContactSection w={w} />
      <PublicFooter w={w} siteName={siteName} />
    </div>
  );
};
