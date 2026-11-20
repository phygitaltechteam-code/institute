import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Radio } from 'lucide-react';
import { academyApi, apiError, LiveClass, LiveClassInput } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourseOptions, useLiveClasses } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, DataTable, Empty, Field, fmtDateTime, Input, Modal, Page, Panel, Select, Textarea, toDateTimeInput, Toolbar, useConfirm, actionsCol, RowActions } from '../ui';

const EMPTY: LiveClassInput = { title: '', courseId: '', description: '', meetingUrl: '', scheduledAt: '', durationMinutes: 60, status: 'SCHEDULED', recordingUrl: '' };
const tone = (s: string) => (s === 'COMPLETED' ? 'green' : s === 'CANCELLED' ? 'red' : 'teal') as 'green' | 'red' | 'teal';

const LiveClasses = () => {
  const [tab, setTab] = useState('upcoming');
  const { data, isLoading, error } = useLiveClasses({ status: tab || undefined });
  const { data: courses } = useCourseOptions();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [f, setF] = useState<LiveClassInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (d: LiveClassInput) => (editing && editing !== 'new' ? academyApi.updateLiveClass(editing, d) : academyApi.createLiveClass(d)),
    { invalidate: [AK.liveClasses], success: 'Live class saved' },
  );
  const remove = useAcademyMutation(academyApi.deleteLiveClass, { invalidate: [AK.liveClasses], success: 'Live class deleted' });

  const set = <K extends keyof LiveClassInput>(k: K, v: LiveClassInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const open = (c?: LiveClass) => {
    setErrors({});
    setEditing(c ? c.id : 'new');
    setF(
      c
        ? { title: c.title, courseId: c.course?.id ?? '', description: c.description ?? '', meetingUrl: c.meetingUrl, scheduledAt: toDateTimeInput(c.scheduledAt), durationMinutes: c.durationMinutes, status: c.status, recordingUrl: c.recordingUrl ?? '' }
        : EMPTY,
    );
  };
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 2) e.title = 'Enter a title';
    if (!/^https?:\/\//i.test(f.meetingUrl.trim())) e.meetingUrl = 'Enter the full meeting link (https://…)';
    if (!f.scheduledAt) e.scheduledAt = 'Pick date and time';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { ...f, courseId: f.courseId || null, scheduledAt: new Date(f.scheduledAt).toISOString() },
      { onSuccess: () => setEditing(null), onError: (err) => setErrors(apiError(err).fields) },
    );
  };

  return (
    <Page
      title="Live Classes"
      subtitle="Schedule Zoom / Google Meet sessions for your courses"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open()}>
          Schedule Class
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <div className="flex rounded-lg border border-stroke p-0.5 text-xs font-medium">
            {[
              ['upcoming', 'Upcoming'],
              ['COMPLETED', 'Completed'],
              ['CANCELLED', 'Cancelled'],
              ['', 'All'],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setTab(v)} className={`rounded-md px-2.5 py-1.5 ${tab === v ? 'bg-primary-navy text-white' : 'text-slate-600'}`}>
                {l}
              </button>
            ))}
          </div>
        </Toolbar>
        <DataTable
          rows={data}
          loading={isLoading}
          error={error}
          rowKey={(r) => r.id}
          empty={<Empty icon={<Radio className="h-5 w-5" />} title="No live classes here" text="Schedule a class and share the link with enrolled students." />}
          columns={[
            {
              header: 'Class',
              cell: (r) => (
                <div>
                  <p className="font-medium text-text-charcoal">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.course?.name ?? 'All students'}</p>
                </div>
              ),
            },
            { header: 'When', cell: (r) => <span className="whitespace-nowrap">{fmtDateTime(r.scheduledAt)}</span> },
            { header: 'Duration', cell: (r) => `${r.durationMinutes} min` },
            { header: 'Status', cell: (r) => <Badge tone={tone(r.status)}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge> },
            {
              header: 'Link',
              cell: (r) => (
                <div className="flex gap-1">
                  <RowActions
                    actions={[
                      { kind: 'open', title: 'Open meeting', href: r.meetingUrl },
                      {
                        kind: 'copy',
                        title: 'Copy link',
                        onClick: () => {
                          navigator.clipboard?.writeText(r.meetingUrl);
                          toast.success('Link copied');
                        },
                      },
                    ]}
                  />
                  {r.recordingUrl && (
                    <a href={r.recordingUrl} target="_blank" rel="noreferrer" className="self-center text-xs font-medium text-accent-teal hover:underline">
                      Recording
                    </a>
                  )}
                </div>
              ),
            },
            actionsCol<LiveClass>((r) => [
              { kind: 'edit', onClick: () => open(r) },
              {
                kind: 'delete',
                onClick: async () => {
                  if (await confirm({ title: `Delete “${r.title}”?` })) remove.mutate(r.id);
                },
              },
            ]),
          ]}
        />
      </Panel>

      <Modal
        open={!!editing}
        size="lg"
        title={editing === 'new' ? 'Schedule live class' : 'Edit live class'}
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
          <Field label="Title" required error={errors.title} className="sm:col-span-2">
            <Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Doubt-clearing session: E/M coding" />
          </Field>
          <Field label="Course" hint="Leave empty for an open session">
            <Select value={f.courseId ?? ''} onChange={(e) => set('courseId', e.target.value)}>
              <option value="">All students</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value as LiveClassInput['status'])}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
          <Field label="Date & time" required error={errors.scheduledAt}>
            <Input type="datetime-local" value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
          </Field>
          <Field label="Duration (minutes)" error={errors.durationMinutes}>
            <Input type="number" min={5} max={600} value={f.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value) || 60)} />
          </Field>
          <Field label="Meeting link" required error={errors.meetingUrl} className="sm:col-span-2">
            <Input value={f.meetingUrl} onChange={(e) => set('meetingUrl', e.target.value)} placeholder="https://meet.google.com/… or https://zoom.us/j/…" />
          </Field>
          <Field label="Recording link" hint="Add after the class is over" className="sm:col-span-2">
            <Input value={f.recordingUrl ?? ''} onChange={(e) => set('recordingUrl', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Description / agenda" className="sm:col-span-2">
            <Textarea value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      </Modal>
      {dialog}
    </Page>
  );
};

export default LiveClasses;
