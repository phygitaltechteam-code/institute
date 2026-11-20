import { useEffect, useState } from 'react';
import { ImageOff, Star } from 'lucide-react';
import { academyApi, fileUrl } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCourses, usePopular } from '@/lib/react-query/queriesAndMutations/academy';
import { Badge, Btn, Empty, inr, Loading, Page, Panel, PanelHeader, SearchBox, RowActions } from '../ui';
import { statusLabel, statusTone } from '../courses/ManageCourses';

const MAX = 12;

const PopularCourses = () => {
  const { data: popular, isLoading } = usePopular();
  const { data: courses } = useCourses({});
  const [ids, setIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const save = useAcademyMutation(academyApi.setPopular, { invalidate: [AK.popular, AK.courses], success: 'Popular courses saved' });

  useEffect(() => {
    if (popular) setIds(popular.map((p) => p.id));
  }, [popular]);

  const byId = new Map((courses ?? []).map((c) => [c.id, c]));
  const change = (next: string[]) => {
    setIds(next);
    setDirty(true);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const n = [...ids];
    [n[i], n[j]] = [n[j], n[i]];
    change(n);
  };
  const available = (courses ?? []).filter((c) => !ids.includes(c.id) && c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page
      title="Popular Courses"
      subtitle={`Pick up to ${MAX} courses to feature on the website home page, in order`}
      action={
        <Btn loading={save.isPending} disabled={!dirty} onClick={() => save.mutate(ids, { onSuccess: () => setDirty(false) })}>
          Save order
        </Btn>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title={`Featured (${ids.length}/${MAX})`} subtitle="Shown in this order" />
          {isLoading ? (
            <Loading />
          ) : ids.length === 0 ? (
            <Empty icon={<Star className="h-5 w-5" />} title="No popular courses selected" text="Add courses from the list." />
          ) : (
            <ul className="divide-y divide-stroke">
              {ids.map((id, i) => {
                const c = byId.get(id) ?? popular?.find((p) => p.id === id);
                return (
                  <li key={id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-5 text-center text-sm font-bold text-accent-teal">{i + 1}</span>
                    {c?.thumbnail ? <img src={fileUrl(c.thumbnail)} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 text-slate-400"><ImageOff className="h-4 w-4" /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-charcoal">{c?.name ?? 'Course'}</p>
                      {c && c.status !== 'PUBLIC' && <Badge tone={statusTone(c.status)}>{statusLabel(c.status)} – not visible on website</Badge>}
                    </div>
                    <RowActions
                      actions={[
                        { kind: 'up', disabled: i === 0, onClick: () => move(i, -1) },
                        { kind: 'down', disabled: i === ids.length - 1, onClick: () => move(i, 1) },
                        { kind: 'delete', title: 'Remove from popular', onClick: () => change(ids.filter((x) => x !== id)) },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="All courses" action={<SearchBox value={search} onChange={setSearch} placeholder="Search" />} />
          <ul className="max-h-[520px] divide-y divide-stroke overflow-y-auto">
            {available.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-charcoal">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {inr(c.discountPrice ?? c.price)} · {c.enrollmentCount} enrolled · {statusLabel(c.status)}
                  </p>
                </div>
                <Btn size="sm" variant="outline" disabled={ids.length >= MAX} onClick={() => change([...ids, c.id])}>
                  Add
                </Btn>
              </li>
            ))}
            {available.length === 0 && <li className="p-4 text-sm text-slate-500">No more courses to add.</li>}
          </ul>
        </Panel>
      </div>
    </Page>
  );
};

export default PopularCourses;
