import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FileText, Layers, Pencil, PlayCircle, Plus, Trash2, Video } from 'lucide-react';
import { academyApi, apiError, fileUrl, Lesson, Section } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourse } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, Empty, ErrorState, Field, FileUpload, fmtBytes, IconBtn, Input, inr, Loading, Modal, numOrNull, Page, Panel, Stat, Textarea, Toggle, useConfirm, RowActions } from '../ui';
import { statusLabel, statusTone } from './ManageCourses';

type LessonDraft = {
  id?: string;
  sectionId: string;
  title: string;
  description: string;
  videoUrl: string | null;
  durationMinutes: number | null;
  isPreview: boolean;
};

const move = <T,>(arr: T[], i: number, dir: -1 | 1) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
};

const LessonResources = ({ lesson }: { lesson: Lesson }) => {
  const [name, setName] = useState('');
  const add = useAcademyMutation(
    (r: { name: string; fileUrl: string; fileType: string; sizeBytes: number }) => academyApi.addResource(lesson.id, r),
    { invalidate: [AK.courses], success: 'Resource added' },
  );
  const remove = useAcademyMutation(academyApi.deleteResource, { invalidate: [AK.courses], success: 'Resource removed' });
  return (
    <div className="space-y-2">
      {lesson.resources.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-accent-teal" />
          <a href={fileUrl(r.fileUrl)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">
            {r.name}
          </a>
          <span className="text-xs text-slate-500">{fmtBytes(r.sizeBytes)}</span>
          <IconBtn title="Remove" tone="red" onClick={() => remove.mutate(r.id)}>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Resource name (optional)" />
        <div className="sm:w-56">
          <FileUpload
            label={add.isPending ? 'Saving…' : 'Upload PDF / notes'}
            onUploaded={(u) =>
              add.mutate({ name: name.trim() || u.name, fileUrl: u.url, fileType: u.fileType, sizeBytes: u.sizeBytes }, { onSuccess: () => setName('') })
            }
          />
        </div>
      </div>
    </div>
  );
};

const CourseCurriculum = ({ courseId }: { courseId: string }) => {
  const { data: course, isLoading, error, refetch } = useCourse(courseId);
  const { confirm, dialog } = useConfirm();
  const [sectionModal, setSectionModal] = useState<{ id?: string; title: string } | null>(null);
  const [lesson, setLesson] = useState<LessonDraft | null>(null);
  const [lessonErr, setLessonErr] = useState<Record<string, string>>({});
  const [videoMode, setVideoMode] = useState<'upload' | 'link'>('upload');
  const [resourcesFor, setResourcesFor] = useState<string | null>(null);

  const inv = { invalidate: [AK.courses] };
  const saveSection = useAcademyMutation(
    (s: { id?: string; title: string }) => (s.id ? academyApi.updateSection(s.id, s.title) : academyApi.createSection(courseId, s.title)),
    { ...inv, success: 'Section saved' },
  );
  const delSection = useAcademyMutation(academyApi.deleteSection, { ...inv, success: 'Section deleted' });
  const reorderSections = useAcademyMutation(academyApi.reorderSections, { ...inv, success: false });
  const saveLesson = useAcademyMutation(
    (l: LessonDraft) => {
      const body = { title: l.title, description: l.description || null, videoUrl: l.videoUrl, durationMinutes: l.durationMinutes, isPreview: l.isPreview };
      return l.id ? academyApi.updateLesson(l.id, body) : academyApi.createLesson({ ...body, sectionId: l.sectionId });
    },
    { ...inv, success: 'Lesson saved' },
  );
  const delLesson = useAcademyMutation(academyApi.deleteLesson, { ...inv, success: 'Lesson deleted' });
  const reorderLessons = useAcademyMutation(academyApi.reorderLessons, { ...inv, success: false });

  if (isLoading) return <Loading />;
  if (error || !course) return <ErrorState error={error} onRetry={refetch} />;

  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalMinutes = course.sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.durationMinutes || 0), 0), 0);
  const resourceLesson = course.sections.flatMap((s) => s.lessons).find((l) => l.id === resourcesFor);

  const openLesson = (sectionId: string, l?: Lesson) => {
    setLessonErr({});
    setVideoMode(l?.videoUrl && /^https?:/i.test(l.videoUrl) ? 'link' : 'upload');
    setLesson(
      l
        ? { id: l.id, sectionId, title: l.title, description: l.description ?? '', videoUrl: l.videoUrl, durationMinutes: l.durationMinutes, isPreview: l.isPreview }
        : { sectionId, title: '', description: '', videoUrl: null, durationMinutes: null, isPreview: false },
    );
  };
  const submitLesson = () => {
    if (!lesson) return;
    if (!lesson.title.trim()) return setLessonErr({ title: 'Enter a lesson title' });
    saveLesson.mutate(lesson, { onSuccess: () => setLesson(null), onError: (e) => setLessonErr(apiError(e).fields) });
  };

  return (
    <Page
      title={course.name}
      subtitle="Curriculum: sections, video lessons and downloadable resources"
      action={
        <div className="flex gap-2">
          <Link to="/admin/courses/manage">
            <Btn variant="outline">← Courses</Btn>
          </Link>
          <Link to="/admin/courses/$courseId/edit" params={{ courseId }}>
            <Btn variant="outline" icon={<Pencil className="h-4 w-4" />}>
              Edit details
            </Btn>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Status" value={<Badge tone={statusTone(course.status)}>{statusLabel(course.status)}</Badge>} hint={course.category?.name ?? 'Uncategorised'} />
        <Stat label="Lessons" value={lessonCount} hint={`${course.sections.length} sections · ${totalMinutes} min`} />
        <Stat label="Enrolled" value={course._count.enrollments} hint={`${course._count.questions} questions asked`} tone="teal" />
        <Stat label="Revenue" value={inr(course.revenue)} hint={course.price ? `Price ${inr(course.discountPrice ?? course.price)}` : 'Free course'} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-charcoal">Sections</h2>
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => setSectionModal({ title: '' })}>
          Add Section
        </Btn>
      </div>

      {course.sections.length === 0 ? (
        <Panel>
          <Empty icon={<Layers className="h-5 w-5" />} title="No sections yet" text="Start with a section like “Introduction”, then add video lessons inside it." action={<Btn icon={<Plus className="h-4 w-4" />} onClick={() => setSectionModal({ title: '' })}>Add Section</Btn>} />
        </Panel>
      ) : (
        course.sections.map((s: Section, si) => (
          <Panel key={s.id}>
            <div className="flex flex-wrap items-center gap-2 border-b border-stroke bg-slate-50/70 px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-navy text-xs font-bold text-white">{si + 1}</span>
              <h3 className="min-w-0 flex-1 truncate font-semibold text-text-charcoal">{s.title}</h3>
              <span className="text-xs text-slate-500">{s.lessons.length} lesson(s)</span>
              <RowActions
                actions={[
                  { kind: 'up', title: 'Move section up', disabled: si === 0, onClick: () => reorderSections.mutate(move(course.sections, si, -1).map((x) => x.id)) },
                  { kind: 'down', title: 'Move section down', disabled: si === course.sections.length - 1, onClick: () => reorderSections.mutate(move(course.sections, si, 1).map((x) => x.id)) },
                  { kind: 'edit', title: 'Rename section', onClick: () => setSectionModal({ id: s.id, title: s.title }) },
                  {
                    kind: 'delete',
                    title: 'Delete section',
                    onClick: async () => {
                      if (await confirm({ title: `Delete section “${s.title}”?`, message: `Its ${s.lessons.length} lesson(s) and their videos will be deleted.` })) delSection.mutate(s.id);
                    },
                  },
                ]}
              />
            </div>
            <ul className="divide-y divide-stroke">
              {s.lessons.map((l, li) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  {l.videoUrl ? <PlayCircle className="h-4 w-4 shrink-0 text-accent-teal" /> : <FileText className="h-4 w-4 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-charcoal">
                      {li + 1}. {l.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {l.durationMinutes ? `${l.durationMinutes} min` : 'No duration'} · {l.videoUrl ? 'Video' : 'No video'} · {l.resources.length} resource(s)
                    </p>
                  </div>
                  {l.isPreview && <Badge tone="teal">Free preview</Badge>}
                  <Btn size="sm" variant="ghost" onClick={() => setResourcesFor(l.id)}>
                    Resources
                  </Btn>
                  <RowActions
                    actions={[
                      !!l.videoUrl && { kind: 'view', title: 'Watch video', href: fileUrl(l.videoUrl) },
                      { kind: 'up', disabled: li === 0, onClick: () => reorderLessons.mutate(move(s.lessons, li, -1).map((x) => x.id)) },
                      { kind: 'down', disabled: li === s.lessons.length - 1, onClick: () => reorderLessons.mutate(move(s.lessons, li, 1).map((x) => x.id)) },
                      { kind: 'edit', title: 'Edit lesson', onClick: () => openLesson(s.id, l) },
                      {
                        kind: 'delete',
                        title: 'Delete lesson',
                        onClick: async () => {
                          if (await confirm({ title: `Delete lesson “${l.title}”?` })) delLesson.mutate(l.id);
                        },
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
            <div className="border-t border-stroke px-3 py-2">
              <Btn size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => openLesson(s.id)}>
                Add lesson
              </Btn>
            </div>
          </Panel>
        ))
      )}

      {/* Section modal */}
      <Modal
        open={!!sectionModal}
        size="sm"
        title={sectionModal?.id ? 'Rename section' : 'Add section'}
        onClose={() => setSectionModal(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setSectionModal(null)}>
              Cancel
            </Btn>
            <Btn
              loading={saveSection.isPending}
              disabled={!sectionModal?.title.trim()}
              onClick={() => sectionModal && saveSection.mutate({ ...sectionModal, title: sectionModal.title.trim() }, { onSuccess: () => setSectionModal(null) })}
            >
              Save
            </Btn>
          </>
        }
      >
        <Field label="Section title" required>
          <Input autoFocus value={sectionModal?.title ?? ''} onChange={(e) => setSectionModal((p) => p && { ...p, title: e.target.value })} placeholder="e.g. Introduction to ICD-10" />
        </Field>
      </Modal>

      {/* Lesson modal */}
      <Modal
        open={!!lesson}
        size="lg"
        title={lesson?.id ? 'Edit lesson' : 'Add lesson'}
        onClose={() => setLesson(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setLesson(null)}>
              Cancel
            </Btn>
            <Btn loading={saveLesson.isPending} onClick={submitLesson}>
              Save lesson
            </Btn>
          </>
        }
      >
        {lesson && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lesson title" required error={lessonErr.title} className="sm:col-span-2">
              <Input autoFocus value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-text-charcoal">Video</span>
                <div className="flex rounded-md border border-stroke p-0.5 text-xs font-medium">
                  {(['upload', 'link'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setVideoMode(m)} className={`rounded px-2 py-0.5 ${videoMode === m ? 'bg-primary-navy text-white' : 'text-slate-500'}`}>
                      {m === 'upload' ? 'Upload file' : 'Paste link'}
                    </button>
                  ))}
                </div>
              </div>
              {videoMode === 'upload' ? (
                <FileUpload
                  kind="video"
                  accept="video/*"
                  value={lesson.videoUrl && !/^https?:/i.test(lesson.videoUrl) ? lesson.videoUrl : null}
                  onUploaded={(u) => setLesson((p) => p && { ...p, videoUrl: u.url })}
                  onClear={() => setLesson({ ...lesson, videoUrl: null })}
                  label="Upload lesson video"
                  hint="MP4 / WEBM / MOV, up to 1 GB"
                />
              ) : (
                <Field error={lessonErr.videoUrl} hint="YouTube (unlisted), Vimeo or any video URL">
                  <Input value={lesson.videoUrl ?? ''} onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value || null })} placeholder="https://…" />
                </Field>
              )}
            </div>
            <Field label="Duration (minutes)" error={lessonErr.durationMinutes}>
              <Input type="number" min={0} value={lesson.durationMinutes ?? ''} onChange={(e) => setLesson({ ...lesson, durationMinutes: numOrNull(e.target.value) })} />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle checked={lesson.isPreview} onChange={(v) => setLesson({ ...lesson, isPreview: v })} label="Free preview" hint="Visible to anyone before buying" />
            </div>
            <Field label="Description / notes" className="sm:col-span-2">
              <Textarea value={lesson.description} onChange={(e) => setLesson({ ...lesson, description: e.target.value })} />
            </Field>
            {!lesson.id && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 sm:col-span-2">
                <Video className="h-3.5 w-3.5" /> You can attach PDFs and notes after saving the lesson.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Resources modal */}
      <Modal open={!!resourceLesson} title={`Resources · ${resourceLesson?.title ?? ''}`} onClose={() => setResourcesFor(null)}>
        {resourceLesson && <LessonResources lesson={resourceLesson} />}
      </Modal>
      {dialog}
    </Page>
  );
};

export default CourseCurriculum;
