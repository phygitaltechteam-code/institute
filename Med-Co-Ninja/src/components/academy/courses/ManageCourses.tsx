import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { BookOpen, ImageOff, Layers, Plus, Users } from 'lucide-react';
import { academyApi, CourseRow, fileUrl } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCategories, useCourses } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, Empty, ErrorState, inr, Loading, Page, Panel, SearchBox, Select, Toolbar, useConfirm, useDebounced, RowActions } from '../ui';

export const statusTone = (s: string) => (s === 'PUBLIC' ? 'green' : s === 'PRIVATE' ? 'amber' : 'gray') as 'green' | 'amber' | 'gray';
export const statusLabel = (s: string) => (s === 'PUBLIC' ? 'Published' : s === 'PRIVATE' ? 'Private' : 'Draft');

const Price = ({ c }: { c: Pick<CourseRow, 'price' | 'discountPrice'> }) =>
  c.price === 0 ? (
    <span className="font-semibold text-accent-teal">Free</span>
  ) : c.discountPrice != null && c.discountPrice < c.price ? (
    <span className="flex items-baseline gap-1.5">
      <span className="font-semibold text-primary-navy">{inr(c.discountPrice)}</span>
      <span className="text-xs text-slate-400 line-through">{inr(c.price)}</span>
    </span>
  ) : (
    <span className="font-semibold text-primary-navy">{inr(c.price)}</span>
  );

const ManageCourses = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const q = { search: useDebounced(search) || undefined, categoryId: categoryId || undefined, status: status || undefined };
  const { data, isLoading, error, isFetching, refetch } = useCourses(q);
  const { data: categories } = useCategories();
  const { confirm, dialog } = useConfirm();
  const remove = useAcademyMutation(academyApi.deleteCourse, { invalidate: [AK.courses], success: 'Course deleted' });

  return (
    <Page
      title="Manage Courses"
      subtitle="Your online courses, their curriculum and enrollments"
      action={
        <Link to="/admin/courses/new">
          <Btn icon={<Plus className="h-4 w-4" />}>Add New Course</Btn>
        </Link>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search courses" />
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="sm:w-48" aria-label="Category">
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" aria-label="Status">
            <option value="">All statuses</option>
            <option value="PUBLIC">Published</option>
            <option value="PRIVATE">Private</option>
            <option value="DRAFT">Draft</option>
          </Select>
          <span className="ml-auto text-xs text-slate-500">{data?.length ?? 0} course(s)</span>
        </Toolbar>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data?.length ? (
          <Empty
            icon={<BookOpen className="h-5 w-5" />}
            title={q.search || q.categoryId || q.status ? 'No course matches these filters' : 'No courses yet'}
            text="Create a course, then add sections and video lessons to it."
            action={
              <Link to="/admin/courses/new">
                <Btn icon={<Plus className="h-4 w-4" />}>Add New Course</Btn>
              </Link>
            }
          />
        ) : (
          <div className={`grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}>
            {data.map((c) => (
              <article key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-stroke bg-white transition hover:shadow-md">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/admin/courses/$courseId/curriculum', params: { courseId: c.id } })}
                  className="relative aspect-video w-full bg-slate-100"
                >
                  {c.thumbnail ? (
                    <img src={fileUrl(c.thumbnail)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-slate-400">
                      <ImageOff className="h-8 w-8" />
                    </span>
                  )}
                  <span className="absolute left-2 top-2">
                    <Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                  </span>
                </button>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-teal">{c.category?.name ?? 'Uncategorised'}</p>
                  <h3 className="mt-0.5 line-clamp-2 font-semibold text-text-charcoal">{c.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> {c.sectionCount} sections · {c.lessonCount} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {c.enrollmentCount} enrolled
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <Price c={c} />
                    <div className="flex gap-1">
                      <Link to="/admin/courses/$courseId/curriculum" params={{ courseId: c.id }}>
                        <Btn size="sm" variant="teal">
                          Curriculum
                        </Btn>
                      </Link>
                      <RowActions
                        actions={[
                          { kind: 'edit', title: 'Edit course', onClick: () => navigate({ to: '/admin/courses/$courseId/edit', params: { courseId: c.id } }) },
                          {
                            kind: 'delete',
                            title: 'Delete course',
                            onClick: async () => {
                              if (await confirm({ title: `Delete “${c.name}”?`, message: 'All sections, lessons and uploaded videos of this course will be removed.' }))
                                remove.mutate(c.id);
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      {dialog}
    </Page>
  );
};

export { Price };
export default ManageCourses;
