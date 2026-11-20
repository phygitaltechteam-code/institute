import { useState } from 'react';
import { Inbox, Mail, MessageCircle, Phone } from 'lucide-react';
import { academyApi, ContactMessage } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useContactMessages } from '@/lib/react-query/queriesAndMutations/academy';
import { actionsCol, Badge, Btn, DataTable, Empty, fmtDateTime, Modal, Page, Pagination, Panel, SearchBox, Select, srNoCol, Toolbar, useConfirm, useDebounced } from '../ui';

const PAGE_SIZE = 20;
const waLink = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
};

/** Messages sent from the website's "Get in touch" form. */
const ContactMessages = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const term = useDebounced(search.trim());
  const { data, isLoading, isFetching, error } = useContactMessages({ page, limit: PAGE_SIZE, search: term || undefined, status: status || undefined });
  const [viewing, setViewing] = useState<ContactMessage | null>(null);
  const { confirm, dialog } = useConfirm();

  const setRead = useAcademyMutation(({ id, isRead }: { id: string; isRead: boolean }) => academyApi.setContactMessageRead(id, isRead), {
    invalidate: [AK.contactMessages],
    success: false,
  });
  const remove = useAcademyMutation(academyApi.deleteContactMessage, { invalidate: [AK.contactMessages], success: 'Message deleted' });

  const open = (m: ContactMessage) => {
    setViewing(m);
    if (!m.isRead) setRead.mutate({ id: m.id, isRead: true });
  };
  const del = async (m: ContactMessage) => {
    if (await confirm({ title: `Delete message from ${m.name}?`, message: 'This cannot be undone.' })) {
      remove.mutate(m.id);
      if (viewing?.id === m.id) setViewing(null);
    }
  };

  return (
    <Page title="Website Enquiries" subtitle={data ? `Messages from the website contact form · ${data.unreadCount} unread` : 'Messages from the website contact form'}>
      <Panel>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Name, email, phone or subject"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="">All messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </Select>
        </Toolbar>
        <DataTable
          rows={data?.items}
          loading={isLoading}
          error={error}
          dim={isFetching && !isLoading}
          rowKey={(r) => r.id}
          minWidth={860}
          startIndex={(page - 1) * PAGE_SIZE}
          empty={<Empty icon={<Inbox className="h-5 w-5" />} title={term || status ? 'No messages match' : 'No messages yet'} text={term || status ? undefined : 'Messages sent from the website contact form appear here.'} />}
          columns={[
            srNoCol(),
            {
              header: 'From',
              cell: (r) => (
                <div className="min-w-0">
                  <p className={`text-text-charcoal ${r.isRead ? '' : 'font-semibold'}`}>{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
              ),
            },
            { header: 'Phone', cell: (r) => <span className="whitespace-nowrap">{r.phone || '—'}</span> },
            {
              header: 'Subject',
              cell: (r) => (
                <button type="button" onClick={() => open(r)} className="max-w-[280px] text-left hover:text-accent-teal">
                  <span className={`block truncate ${r.isRead ? '' : 'font-semibold'}`}>{r.subject}</span>
                  <span className="block truncate text-xs text-slate-500">{r.message}</span>
                </button>
              ),
            },
            { header: 'Received', cell: (r) => <span className="whitespace-nowrap">{fmtDateTime(r.createdAt)}</span> },
            { header: 'Status', cell: (r) => <Badge tone={r.isRead ? 'gray' : 'green'}>{r.isRead ? 'Read' : 'New'}</Badge> },
            actionsCol<ContactMessage>((r) => [
              { kind: 'view', title: 'Read message', onClick: () => open(r) },
              r.isRead
                ? { kind: 'restore', title: 'Mark as unread', onClick: () => setRead.mutate({ id: r.id, isRead: false }) }
                : { kind: 'approve', title: 'Mark as read', onClick: () => setRead.mutate({ id: r.id, isRead: true }) },
              { kind: 'delete', onClick: () => del(r) },
            ]),
          ]}
        />
        {data && <Pagination page={page} totalPages={data.totalPages} totalItems={data.totalItems} onChange={setPage} />}
      </Panel>

      <Modal
        open={!!viewing}
        title={viewing?.subject ?? ''}
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <>
              <Btn variant="danger" onClick={() => del(viewing)}>
                Delete
              </Btn>
              <a href={`mailto:${viewing.email}?subject=${encodeURIComponent(`Re: ${viewing.subject}`)}`}>
                <Btn icon={<Mail className="h-4 w-4" />}>Reply by email</Btn>
              </a>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3">
              <dt className="text-slate-500">From</dt>
              <dd className="font-medium text-text-charcoal">{viewing.name}</dd>
              <dt className="text-slate-500">Email</dt>
              <dd>
                <a href={`mailto:${viewing.email}`} className="break-all text-accent-teal hover:underline">
                  {viewing.email}
                </a>
              </dd>
              {viewing.phone && (
                <>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="flex flex-wrap items-center gap-3">
                    <a href={`tel:${viewing.phone}`} className="inline-flex items-center gap-1 text-accent-teal hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {viewing.phone}
                    </a>
                    <a href={waLink(viewing.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-teal hover:underline">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </dd>
                </>
              )}
              <dt className="text-slate-500">Received</dt>
              <dd>{fmtDateTime(viewing.createdAt)}</dd>
            </dl>
            <p className="whitespace-pre-line break-words leading-relaxed text-text-charcoal">{viewing.message}</p>
          </div>
        )}
      </Modal>
      {dialog}
    </Page>
  );
};

export default ContactMessages;
