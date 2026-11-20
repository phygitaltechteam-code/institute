import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { academyApi, apiError, Category } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useCategories } from '@/lib/react-query/queriesAndMutations/academy';
import { Btn, DataTable, Empty, Field, fmtDate, Input, Modal, Page, Panel, SearchBox, Toolbar, useConfirm, srNoCol, actionsCol } from '../ui';

const CourseCategories = () => {
  const { data, isLoading, error } = useCategories();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const { confirm, dialog } = useConfirm();

  const save = useAcademyMutation(
    (n: string) => (editing && editing !== 'new' ? academyApi.updateCategory(editing.id, n) : academyApi.createCategory(n)),
    { invalidate: [AK.categories, AK.courses], success: editing === 'new' ? 'Category added' : 'Category updated' },
  );
  const remove = useAcademyMutation(academyApi.deleteCategory, { invalidate: [AK.categories], success: 'Category deleted' });

  const open = (c: Category | 'new') => {
    setEditing(c);
    setName(c === 'new' ? '' : c.name);
    setErr('');
  };
  const submit = () => {
    if (!name.trim()) return setErr('Enter a category name');
    save.mutate(name.trim(), {
      onSuccess: () => setEditing(null),
      onError: (e) => setErr(apiError(e).message),
    });
  };

  const rows = (data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page
      title="Courses Category"
      subtitle="Group your online courses so students can browse them easily"
      action={
        <Btn icon={<Plus className="h-4 w-4" />} onClick={() => open('new')}>
          Add Category
        </Btn>
      }
    >
      <Panel>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search categories" />
        </Toolbar>
        <DataTable
          minWidth={520}
          rows={rows}
          loading={isLoading}
          error={error}
          rowKey={(r) => r.id}
          empty={
            <Empty
              icon={<Tags className="h-5 w-5" />}
              title={search ? 'No category matches your search' : 'No categories yet'}
              text="Create categories like “Medical Coding”, “CPC Prep” or “Anatomy”."
            />
          }
          columns={[
            srNoCol(),
            { header: 'Category', cell: (r) => <span className="font-medium text-text-charcoal">{r.name}</span> },
            { header: 'Courses', cell: (r) => r._count.courses, align: 'center' },
            { header: 'Created', cell: (r) => fmtDate(r.createdAt) },
            actionsCol<Category>((r) => [
              { kind: 'edit', onClick: () => open(r) },
              {
                kind: 'delete',
                onClick: async () => {
                  if (await confirm({ title: `Delete “${r.name}”?`, message: 'Courses must be moved out of this category first.' })) remove.mutate(r.id);
                },
              },
            ]),
          ]}
        />
      </Panel>

      <Modal
        open={!!editing}
        size="sm"
        title={editing === 'new' ? 'Add category' : 'Edit category'}
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
        <Field label="Category name" required error={err}>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="e.g. Medical Coding" />
        </Field>
      </Modal>
      {dialog}
    </Page>
  );
};

export default CourseCategories;
