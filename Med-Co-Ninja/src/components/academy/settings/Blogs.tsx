import { useState } from 'react';
import { ImageOff, Newspaper, Plus } from 'lucide-react';
import { academyApi, apiError, Blog, BlogInput, fileUrl } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useBlogs } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, FileUpload, fmtDate, Input, Modal, Page, Panel, RichText, SearchBox, Textarea, Toolbar, useConfirm, useDebounced, RowActions } from '../ui';

const EMPTY: BlogInput = { title: '', slug: '', excerpt: '', content: '', coverImage: null, author: '', tags: [], isPublished: false };

const Blogs = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error, isFetching } = useBlogs({ search: useDebounced(search) || undefined, status: status || undefined });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<BlogInput>(EMPTY);
  const [tagText, setTagText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (d: BlogInput) => (editing && editing !== 'new' ? academyApi.updateBlog(editing, d) : academyApi.createBlog(d)),
    { invalidate: [AK.blogs], success: 'Blog saved' },
  );
  const publish = useAcademyMutation(({ b, on }: { b: Blog; on: boolean }) => academyApi.updateBlog(b.id, { ...b, isPublished: on }), {
    invalidate: [AK.blogs],
    success: 'Blog updated',
  });
  const remove = useAcademyMutation(academyApi.deleteBlog, { invalidate: [AK.blogs], success: 'Blog deleted' });
  const set = <K extends keyof BlogInput>(k: K, v: BlogInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const open = (b?: Blog) => {
    setErrors({});
    setEditing(b ? b.id : 'new');
    setF(b ? { title: b.title, slug: b.slug, excerpt: b.excerpt ?? '', content: b.content, coverImage: b.coverImage, author: b.author ?? '', tags: b.tags, isPublished: b.isPublished } : EMPTY);
    setTagText(b ? b.tags.join(', ') : '');
  };
  const submit = (isPublished: boolean) => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = 'Enter a title (3+ characters)';
    const text = f.content.replace(/<[^>]*>/g, '').trim();
    if (!text) e.content = 'Write some content';
    setErrors(e);
    if (Object.keys(e).length) return;
    const tags = tagText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    save.mutate({ ...f, tags, isPublished }, { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) });
  };

  return (
    <Page
      title="Blogs"
      subtitle="Articles published on your website blog"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Add Blog
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search titles" />
          <div className="flex rounded-lg border border-stroke p-0.5 text-xs font-medium">
            {[
              ['', 'All'],
              ['published', 'Published'],
              ['draft', 'Drafts'],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setStatus(v)} className={`rounded-md px-2.5 py-1.5 ${status === v ? 'bg-primary-navy text-white' : 'text-slate-600'}`}>
                {l}
              </button>
            ))}
          </div>
        </Toolbar>
        <DataTable
          rows={data}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          empty={<Empty icon={<Newspaper className="h-5 w-5" />} title="No blog posts" text="Share coding tips, exam updates and success stories." />}
          columns={[
            {
              header: 'Post',
              cell: (r) => (
                <div className="flex items-center gap-3">
                  {r.coverImage ? (
                    <img src={fileUrl(r.coverImage)} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                      <ImageOff className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium text-text-charcoal">{r.title}</p>
                    <p className="truncate text-[11px] text-slate-500">/blog/{r.slug}</p>
                  </div>
                </div>
              ),
            },
            { header: 'Author', cell: (r) => r.author || '—' },
            { header: 'Tags', cell: (r) => <span className="text-xs">{r.tags.join(', ') || '—'}</span> },
            { header: 'Status', cell: (r) => <Badge tone={r.isPublished ? 'green' : 'gray'}>{r.isPublished ? 'Published' : 'Draft'}</Badge> },
            { header: 'Date', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.publishedAt ?? r.updatedAt)}</span> },
            {
              header: 'Actions',
              align: 'right',
              className: 'w-px whitespace-nowrap',
              cell: (r) => (
                <RowActions
                  actions={[
                    r.isPublished
                      ? { kind: 'revoke', title: 'Unpublish', onClick: () => publish.mutate({ b: r, on: false }) }
                      : { kind: 'approve', title: 'Publish', onClick: () => publish.mutate({ b: r, on: true }) },
                    { kind: 'edit', onClick: () => open(r) },
                    {
                      kind: 'delete',
                      onClick: async () => {
                        if (await confirm({ title: `Delete “${r.title}”?` })) remove.mutate(r.id);
                      },
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        open={!!editing}
        size="xl"
        title={editing === 'new' ? 'New blog post' : 'Edit blog post'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn variant="outline" disabled={save.isPending} onClick={() => submit(false)}>
              Save as draft
            </Btn>
            <Btn loading={save.isPending} onClick={() => submit(true)}>
              Publish
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Field label="Title" required error={errors.title}>
              <Input value={f.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Content" required error={errors.content}>
              <RichText value={f.content} onChange={(v) => set('content', v)} minHeight={320} />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Cover image">
              <FileUpload kind="image" accept="image/*" value={f.coverImage} onUploaded={(u) => set('coverImage', u.url)} onClear={() => set('coverImage', null)} />
            </Field>
            <Field label="URL slug" hint="Leave empty to create from the title" error={errors.slug}>
              <Input value={f.slug ?? ''} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
            </Field>
            <Field label="Short summary" hint="Shown in blog lists and search results">
              <Textarea className="min-h-[70px]" maxLength={300} value={f.excerpt ?? ''} onChange={(e) => set('excerpt', e.target.value)} />
            </Field>
            <Field label="Author">
              <Input value={f.author ?? ''} onChange={(e) => set('author', e.target.value)} />
            </Field>
            <Field label="Tags" hint="Comma separated">
              <Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="CPC, ICD-10, careers" />
            </Field>
          </div>
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default Blogs;
