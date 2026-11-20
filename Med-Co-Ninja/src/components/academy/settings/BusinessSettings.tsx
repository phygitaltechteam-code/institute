import { useEffect, useState } from 'react';
import { academyApi, BusinessSettings as BS } from '@/lib/api/admin/academyApi';
import { AK, useAcademyMutation, useSetting } from '@/lib/react-query/queriesAndMutations/academy';
import { Btn, ErrorState, Field, Input, inr, Loading, Page, Panel, PanelHeader, Select, Textarea } from '../ui';

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const BusinessSettings = () => {
  const { data, isLoading, error, refetch } = useSetting<BS>('business');
  const [f, setF] = useState<BS>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAcademyMutation((v: BS) => academyApi.saveSetting('business', v), { invalidate: [AK.settings('business')], success: 'Business details saved' });

  useEffect(() => {
    if (data) setF(data);
  }, [data]);
  const set = <K extends keyof BS>(k: K, v: BS[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.businessName?.trim()) e.businessName = 'Enter the business name';
    if (f.gstNumber && !GSTIN.test(f.gstNumber)) e.gstNumber = 'Invalid GSTIN (15 characters, e.g. 27ABCDE1234F1Z5)';
    if (f.panNumber && !PAN.test(f.panNumber)) e.panNumber = 'Invalid PAN (e.g. ABCDE1234F)';
    if (f.invoicePrefix && !/^[A-Za-z0-9]{1,8}$/.test(f.invoicePrefix)) e.invoicePrefix = 'Up to 8 letters/numbers';
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate({ ...f, gstPercent: Number(f.gstPercent) || 0 });
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const gst = Number(f.gstPercent) || 0;
  const example = 11800;
  const tax = gst ? (example * gst) / (100 + gst) : 0;

  return (
    <Page
      title="Business & GST"
      subtitle="Printed on every invoice; GST is applied to new enrollments"
      action={
        <Btn loading={save.isPending} onClick={submit}>
          Save
        </Btn>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader title="Business details" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Business / brand name" required error={errors.businessName}>
                <Input value={f.businessName ?? ''} onChange={(e) => set('businessName', e.target.value)} />
              </Field>
              <Field label="Legal name" hint="As registered for GST, if different">
                <Input value={f.legalName ?? ''} onChange={(e) => set('legalName', e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea className="min-h-[60px]" value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={f.city ?? ''} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="State" hint="Decides CGST+SGST vs IGST on invoices">
                <Input value={f.state ?? ''} onChange={(e) => set('state', e.target.value)} />
              </Field>
              <Field label="PIN code">
                <Input value={f.pincode ?? ''} onChange={(e) => set('pincode', e.target.value)} />
              </Field>
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Invoice" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Invoice number prefix" error={errors.invoicePrefix} hint={`Next invoice looks like ${(f.invoicePrefix || 'INV').toUpperCase()}-${new Date().getFullYear()}-00001`}>
                <Input value={f.invoicePrefix ?? ''} onChange={(e) => set('invoicePrefix', e.target.value.toUpperCase())} placeholder="INV" />
              </Field>
              <Field label="SAC code" hint="999293 = commercial training & coaching">
                <Input value={f.sacCode ?? ''} onChange={(e) => set('sacCode', e.target.value)} placeholder="999293" />
              </Field>
              <Field label="Footer note" className="sm:col-span-2">
                <Textarea className="min-h-[60px]" value={f.invoiceFooter ?? ''} onChange={(e) => set('invoiceFooter', e.target.value)} placeholder="Thank you for learning with us!" />
              </Field>
            </div>
          </Panel>
        </div>

        <Panel className="h-fit">
          <PanelHeader title="GST" />
          <div className="space-y-4 p-4">
            <Field label="GSTIN" error={errors.gstNumber}>
              <Input value={f.gstNumber ?? ''} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} maxLength={15} className="font-mono" />
            </Field>
            <Field label="PAN" error={errors.panNumber}>
              <Input value={f.panNumber ?? ''} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} maxLength={10} className="font-mono" />
            </Field>
            <Field label="GST rate" hint="Course prices are treated as GST-inclusive">
              <Select value={String(f.gstPercent ?? 0)} onChange={(e) => set('gstPercent', Number(e.target.value))}>
                <option value="0">Not registered / 0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </Select>
            </Field>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-text-charcoal">Example: student pays {inr(example)}</p>
              <p>Taxable value: {inr(example - tax)}</p>
              <p>GST @ {gst}%: {inr(tax)}</p>
            </div>
          </div>
        </Panel>
      </div>
    </Page>
  );
};

export default BusinessSettings;
