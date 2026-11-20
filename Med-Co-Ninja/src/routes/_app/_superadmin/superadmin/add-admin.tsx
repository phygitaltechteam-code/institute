import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEye } from 'react-icons/fi';
import { LuEyeOff } from 'react-icons/lu';
import { createAdmin } from '@/lib/api/superAdmin/adminApi';

export const Route = createFileRoute('/_app/_superadmin/superadmin/add-admin')({
  component: AddAdminPage,
});

const phoneRegex = /^[6-9]\d{9}$/;

// Mirrors the backend rules in validations/admin.validation.ts
const addAdminSchema = z.object({
  fullname: z.string().trim().min(1, 'Full name is required').max(100),
  phoneNumber: z.string().trim().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  username: z.string().trim().max(50).optional(),
  email: z.string().trim().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((v) => /\d/.test(v) && /[a-zA-Z]/.test(v), 'Password must contain a letter and a number'),
  adminId: z.string().trim().min(1, 'Institute ID is required'),
  address: z.string().trim().min(1, 'Address is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  country: z.string().trim().min(1, 'Country is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  gst: z.string().trim().optional(),
  tagLine: z.string().trim().optional(),
});

type AddAdminForm = z.infer<typeof addAdminSchema>;

function AddAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddAdminForm>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { country: 'India' },
  });

  const { mutateAsync, isPending } = useMutation({ mutationFn: createAdmin });

  const onSubmit = async (values: AddAdminForm) => {
    // Login User ID defaults to the phone number, same as faculty accounts
    const payload = {
      ...values,
      username: values.username || values.phoneNumber,
      gst: values.gst || undefined,
      tagLine: values.tagLine || undefined,
    };
    try {
      await mutateAsync(payload);
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['superadmin-admins'] });
      navigate({ to: '/superadmin/admins' });
    } catch (err: any) {
      const body = err?.response?.data;
      // Map backend field errors (zod) back onto the form when possible
      if (Array.isArray(body?.errors)) {
        body.errors.forEach((e: { field?: string; message?: string }) => {
          if (e.field && e.field in addAdminSchema.shape) {
            setError(e.field as keyof AddAdminForm, { message: e.message });
          }
        });
      }
      setError('root', { message: body?.message || 'Failed to create admin' });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/superadmin/admins"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stroke bg-white hover:bg-bg-light-mint"
          aria-label="Back to admins"
        >
          <FiArrowLeft />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Add Institute Admin</h1>
          <p className="text-sm text-text-charcoal/60">The admin logs in with the User ID and password set here.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-stroke bg-white p-5 shadow-default md:p-8"
      >
        <Section title="Login details">
          <Field label="Full name *" error={errors.fullname?.message}>
            <input {...register('fullname')} className={inputCls(errors.fullname)} placeholder="Admin's full name" />
          </Field>
          <Field label="Mobile number *" error={errors.phoneNumber?.message}>
            <input {...register('phoneNumber')} className={inputCls(errors.phoneNumber)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Login User ID" error={errors.username?.message} hint="Leave blank to use the mobile number">
            <input {...register('username')} className={inputCls(errors.username)} placeholder="Defaults to mobile number" />
          </Field>
          <Field label="Email *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputCls(errors.email)} placeholder="admin@institute.com" />
          </Field>
          <Field label="Password *" error={errors.password?.message} hint="Min 8 characters, with a letter and a number">
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls(errors.password)} pr-10`}
                placeholder="Set a password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-charcoal/50 hover:text-accent-teal"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <LuEyeOff /> : <FiEye />}
              </button>
            </div>
          </Field>
        </Section>

        <Section title="Institute details">
          <Field label="Institute ID *" error={errors.adminId?.message}>
            <input {...register('adminId')} className={inputCls(errors.adminId)} placeholder="e.g. INST001" />
          </Field>
          <Field label="GST number" error={errors.gst?.message}>
            <input {...register('gst')} className={inputCls(errors.gst)} placeholder="Optional" />
          </Field>
          <Field label="Tagline" error={errors.tagLine?.message}>
            <input {...register('tagLine')} className={inputCls(errors.tagLine)} placeholder="Optional" />
          </Field>
          <Field label="Address *" error={errors.address?.message} wide>
            <input {...register('address')} className={inputCls(errors.address)} placeholder="Street, area" />
          </Field>
          <Field label="City *" error={errors.city?.message}>
            <input {...register('city')} className={inputCls(errors.city)} />
          </Field>
          <Field label="State *" error={errors.state?.message}>
            <input {...register('state')} className={inputCls(errors.state)} />
          </Field>
          <Field label="Country *" error={errors.country?.message}>
            <input {...register('country')} className={inputCls(errors.country)} />
          </Field>
          <Field label="Pincode *" error={errors.pincode?.message}>
            <input {...register('pincode')} className={inputCls(errors.pincode)} inputMode="numeric" maxLength={6} />
          </Field>
        </Section>

        {errors.root?.message && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-center text-sm font-medium text-danger">
            {errors.root.message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/superadmin/admins"
            className="rounded-xl border border-stroke px-6 py-2.5 text-center text-sm font-semibold hover:bg-bg-light-mint"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-primary-navy px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = (err?: unknown) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
    err ? 'border-danger focus:ring-danger/10' : 'border-stroke focus:border-accent-teal focus:ring-accent-teal/10'
  }`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-navy">{title}</legend>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  error,
  hint,
  wide,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${wide ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <label className="block text-xs font-semibold text-text-charcoal/80">{label}</label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-charcoal/50">{hint}</p>
      ) : null}
    </div>
  );
}
