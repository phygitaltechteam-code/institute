import { useState } from 'react';
import { FileArchive, FileImage, FileText, FileVideo, FolderOpen, Plus } from 'lucide-react';
import { academyApi, apiError, EduFile, EduFileInput, fileUrl } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourseOptions, useEduFiles } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, FileUpload, fmtBytes, fmtDate, Input, Modal, Page, Panel, SearchBox, Select, Textarea, Toggle, Toolbar, useConfirm, useDebounced, RowActions } from '../ui';

const EMPTY: EduFileInput = { title: '', description: '', category: '', courseId: '', fileUrl: '', fileType: 'file', sizeBytes: 0, isPublic: false };
const CATEGORIES = ['Notes', 'Question bank', 'Mock test', 'Guidelines', 'E-book', 'Worksheet', 'Other'];

const KindIcon = ({ t }: { t: string }) =>
  t === 'image' ? <FileImage className="h-5 w-5" /> : t === 'video' ? <FileVideo className="h-5 w-5" /> : t === 'zip' ? <FileArchive className="h-5 w-5" /> : <FileText className="h-5 w-5" />;

const EducationalFiles = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [courseId, setCourseId] = useState('');
  const { data, isLoading, error, isFetching } = useEduFiles({ search: useDebounced(search) || undefined, category: category || undefined, courseId: courseId || undefined });
  const { data: courses } = useCourseOptions();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<EduFileInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (d: EduFileInput) => {
      if (editing && editing !== 'new') {
        const { title, description, category: c, courseId: cid, isPublic } = d;
        return academyApi.updateFile(editing, { title, description, category: c, courseId: cid, isPublic });
      }
      return academyApi.createFile(d);
    },
    { invalidate: [AK.files], success: 'File saved' },
  );
  const remove = useAcademyMutation(academyApi.deleteFile, { invalidate: [AK.files], success: 'File deleted' });
  const set = <K extends keyof EduFileInput>(k: K, v: EduFileInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const open = (x?: EduFile) => {
    setErrors({});
    setEditing(x ? x.id : 'new');
    setF(x ? { title: x.title, description: x.description ?? '', category: x.category ?? '', courseId: x.course?.id ?? '', fileUrl: x.fileUrl, fileType: x.fileType, sizeBytes: x.sizeBytes, isPublic: x.isPublic } : EMPTY);
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 2) e.title = 'Enter a title';
    if (!f.fileUrl) e.fileUrl = 'Upload a file';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate({ ...f, courseId: f.courseId || null, category: f.category || null }, { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) });
  };

  return (
    <Page
      title="Educational Files"
      subtitle="Study material library: notes, question banks, e-books"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Upload File
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by title" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44" aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-52" aria-label="Course">
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Toolbar>
        <DataTable
          rows={data}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          empty={<Empty icon={<FolderOpen className="h-5 w-5" />} title="No files yet" text="Upload PDFs, worksheets or e-books and link them to a course." />}
          columns={[
            {
              header: 'File',
              cell: (r) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-navy/5 text-primary-navy">
                    <KindIcon t={r.fileType} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-charcoal">{r.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{r.description || `${r.fileType.toUpperCase()} · ${fmtBytes(r.sizeBytes)}`}</p>
                  </div>
                </div>
              ),
            },
            { header: 'Category', cell: (r) => r.category ?? '—' },
            { header: 'Course', cell: (r) => <span className="text-xs">{r.course?.name ?? 'General'}</span> },
            { header: 'Size', cell: (r) => fmtBytes(r.sizeBytes) },
            { header: 'Visibility', cell: (r) => <Badge tone={r.isPublic ? 'teal' : 'gray'}>{r.isPublic ? 'Public' : 'Students only'}</Badge> },
            { header: 'Uploaded', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.createdAt)}</span> },
            {
              header: 'Actions',
              align: 'right',
              className: 'w-px whitespace-nowrap',
              cell: (r) => (
                <RowActions
                  actions={[
                    { kind: 'open', title: 'Open / download', href: fileUrl(r.fileUrl) },
                    { kind: 'edit', onClick: () => open(r) },
                    {
                      kind: 'delete',
                      onClick: async () => {
                        if (await confirm({ title: `Delete “${r.title}”?`, message: 'The file is removed from the server.' })) remove.mutate(r.id);
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
        size="lg"
        title={editing === 'new' ? 'Upload file' : 'Edit file'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn loading={save.isPending} onClick={submit}>
              Save
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {editing === 'new' && (
            <Field label="File" required error={errors.fileUrl} className="sm:col-span-2">
              <FileUpload
                value={f.fileUrl || null}
                onUploaded={(u) => setF((p) => ({ ...p, fileUrl: u.url, fileType: u.fileType, sizeBytes: u.sizeBytes, title: p.title || u.name.replace(/\.[^.]+$/, '') }))}
                onClear={() => set('fileUrl', '')}
                label="Upload PDF, DOC, PPT, XLS, ZIP, image or video"
              />
            </Field>
          )}
          <Field label="Title" required error={errors.title} className="sm:col-span-2">
            <Input value={f.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={f.category ?? ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Course">
            <Select value={f.courseId ?? ''} onChange={(e) => set('courseId', e.target.value)}>
              <option value="">General (no course)</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea className="min-h-[60px]" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Toggle checked={f.isPublic} onChange={(v) => set('isPublic', v)} label="Public" hint="Anyone can download it from the website" />
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default EducationalFiles;
