import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
import { academyApi, Question } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourseOptions, useQuestions } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, Empty, ErrorState, fmtDateTime, Loading, Page, Panel, SearchBox, Select, Textarea, Toolbar, useConfirm, useDebounced, RowActions } from '../ui';

const Thread = ({ q }: { q: Question }) => {
  const [msg, setMsg] = useState('');
  const { confirm, dialog } = useConfirm();
  const inv = { invalidate: [AK.questions] };
  const reply = useAcademyMutation((m: string) => academyApi.replyQuestion(q.id, m), { ...inv, success: 'Reply sent' });
  const resolve = useAcademyMutation((v: boolean) => academyApi.resolveQuestion(q.id, v), { ...inv, success: false });
  const remove = useAcademyMutation(() => academyApi.deleteQuestion(q.id), { ...inv, success: 'Question deleted' });

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-navy/5 text-sm font-bold text-primary-navy">
          {q.student.user.fullname.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-charcoal">
            {q.student.user.fullname} <span className="font-normal text-slate-500">· {q.student.user.phoneNumber}</span>
          </p>
          <p className="text-xs text-slate-500">
            {q.course.name}
            {q.lesson && ` › ${q.lesson.title}`} · {fmtDateTime(q.createdAt)}
          </p>
        </div>
        <Badge tone={q.isResolved ? 'green' : 'amber'}>{q.isResolved ? 'Answered' : 'Awaiting reply'}</Badge>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-text-charcoal">{q.question}</p>

      {q.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-accent-teal/40 pl-3">
          {q.replies.map((r) => (
            <div key={r.id} className={`rounded-lg px-3 py-2 text-sm ${r.isStaff ? 'bg-accent-teal/5' : 'bg-slate-50'}`}>
              <p className="text-xs font-semibold text-text-charcoal">
                {r.authorName} {r.isStaff && <span className="text-accent-teal">(Instructor)</span>}
                <span className="ml-1 font-normal text-slate-500">{fmtDateTime(r.createdAt)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-line text-slate-700">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea className="min-h-[56px] flex-1" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write your answer…" />
        <div className="flex gap-1">
          <Btn icon={<Send className="h-4 w-4" />} loading={reply.isPending} disabled={!msg.trim()} onClick={() => reply.mutate(msg.trim(), { onSuccess: () => setMsg('') })}>
            Reply
          </Btn>
          <RowActions
            className="self-end"
            actions={[
              q.isResolved
                ? { kind: 'restore', title: 'Reopen', onClick: () => resolve.mutate(false) }
                : { kind: 'approve', title: 'Mark as answered', onClick: () => resolve.mutate(true) },
              {
                kind: 'delete',
                title: 'Delete question',
                onClick: async () => {
                  if (await confirm({ title: 'Delete this question?', message: 'The question and all replies will be removed.' })) remove.mutate(undefined);
                },
              },
            ]}
          />
        </div>
      </div>
      {dialog}
    </div>
  );
};

const StudentQnA = () => {
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const { data, isLoading, error, isFetching, refetch } = useQuestions({ courseId: courseId || undefined, status: status || undefined, search: term || undefined });
  const { data: courses } = useCourseOptions();

  return (
    <Page title="Student Q&A" subtitle={`Questions students ask inside their courses${data ? ` · ${data.openCount} awaiting reply` : ''}`}>
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search questions" />
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56" aria-label="Course">
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex rounded-lg border border-stroke p-0.5 text-xs font-medium">
            {[
              ['open', 'Awaiting reply'],
              ['resolved', 'Answered'],
              ['', 'All'],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setStatus(v)} className={`rounded-md px-2.5 py-1.5 ${status === v ? 'bg-primary-navy text-white' : 'text-slate-600'}`}>
                {l}
              </button>
            ))}
          </div>
        </Toolbar>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data?.items.length ? (
          <Empty
            icon={<MessageCircleQuestion className="h-5 w-5" />}
            title={status === 'open' ? 'No questions waiting for a reply' : 'No questions found'}
            text="Enrolled students ask questions from the course player; they appear here for you to answer."
          />
        ) : (
          <div className={`divide-y divide-stroke ${isFetching ? 'opacity-60' : ''}`}>
            {data.items.map((q) => (
              <Thread key={q.id} q={q} />
            ))}
          </div>
        )}
      </Panel>
    </Page>
  );
};

export default StudentQnA;
