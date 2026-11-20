import { useForm, FormProvider, Control } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { City, State } from 'country-state-city';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import { passingYears, genderOptions, preferredLocations, preferredProfiles } from '@/mockdata';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/context/AuthContext';
import { Plus, X } from 'lucide-react';
import { useGetPlacementFormData, useGetStudentDataForPlacementForm, useStudentPlacement } from '@/lib/api/student/placementorm';

type EduType = 'diploma' | 'graduation' | 'post_graduation';
type EducationEntry = { id: number; type: EduType; score: string; course: string; year: string };

const EDU_LABEL: Record<EduType, string> = { diploma: 'Diploma', graduation: 'Graduation', post_graduation: 'Post Graduation' };
const YES_NO = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];
const EXPERIENCE_YEARS = [
  { label: 'Less than 1 year', value: '0' },
  { label: '1 Year', value: '1' },
  { label: '2 Years', value: '2' },
  { label: '3 Years', value: '3' },
  { label: '4 Years', value: '4' },
  { label: '5+ Years', value: '5' },
];
const toOptions = (list: (string | number)[]) => list.map((v) => ({ label: String(v), value: String(v) }));
const yearOptions = toOptions(passingYears);

const control =
  'w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none transition focus:border-primary-navy';

/** One card per form section: navy left border, compact padding */
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border-l-4 border-primary-navy bg-white p-3 shadow-sm sm:p-4">
    <h2 className="mb-3 text-base font-semibold text-primary-navy">{title}</h2>
    {children}
  </section>
);

const required = (msg: string) => z.string({ required_error: msg }).trim().min(1, msg);
const optional = z.string().optional().nullable();

const PlacmentFrom = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { mutateAsync: submitPlacement, isPending } = useStudentPlacement();
  const { data: studentData } = useGetStudentDataForPlacementForm();
  const { data: saved } = useGetPlacementFormData();

  // Documents are required only the first time; after that the saved file is kept
  const schema = useMemo(() => {
    const file = (label: string, has: boolean) =>
      z.any().refine((f) => has || (f && f.length > 0), `${label} is required`);
    return z.object({
      name: required('Name is required'),
      email: optional,
      phone1: required('Phone number is required').regex(/^[0-9+ -]{7,15}$/, 'Enter a valid phone number'),
      phone2: z.string().regex(/^([0-9+ -]{7,15})?$/, 'Enter a valid phone number').optional().nullable(),
      gender: required('Select gender'),
      ssc: required('10th percentage is required'),
      ssc_year: required('Select passing year'),
      hsc: optional,
      hsc_year: optional,
      isExperience: required('Select an option'),
      experience_years: optional,
      workProfile: optional,
      companies: optional,
      isCurrentlyWorking: required('Select an option'),
      currentProfile: optional,
      currentCompany: optional,
      Preferred_Profiles: required('Select a preferred profile'),
      state: required('Select state'),
      district: required('Select district'),
      preferredLocation: required('Select preferred location'),
      aadharcard: file('Aadhar card', !!saved?.aadharcard),
      profile_photo: file('Profile photo', !!saved?.profile_photo),
      resume: file('Resume', !!saved?.resume),
    });
  }, [saved?.aadharcard, saved?.profile_photo, saved?.resume]);

  type FormValues = z.infer<typeof schema>;

  // Prefill: previously saved form first, then the student profile
  const values = useMemo<FormValues | undefined>(() => {
    if (!studentData && !saved) return undefined;
    const s = saved ?? {};
    const yesNo = (v: unknown) => (v === undefined || v === null ? '' : String(!!v));
    return {
      name: s.name || studentData?.user?.fullname || '',
      email: user?.email || s.email || studentData?.user?.email || '',
      phone1: s.phone1 || studentData?.user?.phoneNumber || '',
      phone2: s.phone2 || studentData?.user?.secondaryPhoneNumber || '',
      gender: s.gender || '',
      ssc: s.ssc || '',
      ssc_year: s.ssc_year || '',
      hsc: s.hsc || '',
      hsc_year: s.hsc_year || '',
      isExperience: saved ? yesNo(s.isExperience) : '',
      experience_years: s.experience_years != null ? String(s.experience_years) : '',
      workProfile: s.workProfile || '',
      companies: s.companies || '',
      isCurrentlyWorking: saved ? yesNo(s.isCurrentlyWorking) : '',
      currentProfile: s.currentProfile || '',
      currentCompany: s.currentCompany || '',
      Preferred_Profiles: s.Preferred_Profiles || '',
      state: s.state || studentData?.state || '',
      district: s.district || studentData?.city || '',
      preferredLocation: s.preferredLocation || '',
      aadharcard: undefined,
      profile_photo: undefined,
      resume: undefined,
    };
  }, [saved, studentData, user?.email]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    values,
    resetOptions: { keepDirtyValues: true },
  });
  const { handleSubmit, watch, setValue } = methods;
  // GenericDropdown takes Control<any>; the typed control is not assignable to it
  const formControl = methods.control as unknown as Control<any>;

  const hasExperience = watch('isExperience') === 'true';
  const isWorking = watch('isCurrentlyWorking') === 'true';

  // Additional education (diploma / graduation / post graduation)
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [loadedSaved, setLoadedSaved] = useState(false);
  useEffect(() => {
    if (loadedSaved || !saved) return;
    setLoadedSaved(true);
    setEducation(
      (saved.degrees ?? []).map((d: any, i: number) => ({
        id: i + 1,
        type: String(d.graduation_type).toLowerCase() as EduType,
        score: d.score ?? '',
        course: d.course ?? '',
        year: d.passingyear ?? '',
      })),
    );
  }, [saved, loadedSaved]);
  const addEducation = (type: EduType) =>
    setEducation((prev) => [...prev, { id: Math.max(0, ...prev.map((e) => e.id)) + 1, type, score: '', course: '', year: '' }]);
  const updateEducation = (id: number, field: 'score' | 'course' | 'year', value: string) =>
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  // State → district
  const selectedState = watch('state');
  const district = watch('district');
  const stateOptions = useMemo(() => State.getStatesOfCountry('IN').map((s) => ({ label: s.name, value: s.name })), []);
  const districtOptions = useMemo(() => {
    const st = State.getStatesOfCountry('IN').find((s) => s.name === selectedState);
    return st ? City.getCitiesOfState('IN', st.isoCode).map((c) => ({ label: c.name, value: c.name })) : [];
  }, [selectedState]);
  // Clear the district only when it doesn't belong to the chosen state (keeps the prefilled one)
  useEffect(() => {
    if (district && districtOptions.length && !districtOptions.some((o) => o.value === district)) setValue('district', '');
  }, [district, districtOptions, setValue]);

  const onSubmit = async (data: FormValues) => {
    const fd = new FormData();
    const put = (k: string, v: unknown) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
    };
    put('name', data.name);
    put('email', data.email);
    put('phone1', data.phone1);
    put('phone2', data.phone2);
    put('gender', data.gender);
    put('ssc', data.ssc);
    put('ssc_year', data.ssc_year);
    put('hsc', data.hsc);
    put('hsc_year', data.hsc_year);
    education.forEach((e, i) => {
      fd.append(`additional_education[${i}][graduation_type]`, e.type.toUpperCase());
      fd.append(`additional_education[${i}][score]`, e.score);
      fd.append(`additional_education[${i}][course]`, e.course);
      fd.append(`additional_education[${i}][passingyear]`, e.year);
    });
    fd.append('isExperience', String(hasExperience));
    fd.append('isCurrentlyWorking', String(isWorking));
    if (hasExperience) {
      put('experience_years', data.experience_years);
      put('workProfile', data.workProfile);
      put('companies', data.companies);
    }
    if (isWorking) {
      put('currentProfile', data.currentProfile);
      put('currentCompany', data.currentCompany);
    }
    put('Preferred_Profiles', data.Preferred_Profiles);
    put('state', data.state);
    put('district', data.district);
    put('preferredLocation', data.preferredLocation);
    if (data.aadharcard?.length) fd.append('aadharcard', data.aadharcard[0]);
    if (data.profile_photo?.length) fd.append('profile_photo', data.profile_photo[0]);
    if (data.resume?.length) fd.append('resume', data.resume[0]);

    try {
      await submitPlacement(fd); // the hook shows the success / error toast
      navigate({ to: '/student/studentdahboard' });
    } catch {
      /* error toast already shown */
    }
  };

  const savedDoc = (url?: string | null) =>
    url ? (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-accent-teal hover:underline">
        Uploaded · view
      </a>
    ) : null;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-7xl space-y-3 p-2" noValidate>
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">Placement Registration</h1>

        <Section title="Personal Details">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <GenericInputField name="name" label="Name" required placeholder="Full name" />
            <GenericInputField name="email" label="Email ID" disabled helperText="Login email, can't be changed" />
            <GenericInputField name="phone1" label="Phone (WhatsApp)" required placeholder="Phone number" />
            <GenericInputField name="phone2" label="Alternate Phone" placeholder="Optional" />
            <GenericDropdown name="gender" label="Gender" required options={toOptions(genderOptions)} control={formControl} />
          </div>
        </Section>

        <Section title="Education Details">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <GenericInputField name="ssc" label="10th (SSC) %" required placeholder="e.g. 78" />
            <GenericDropdown name="ssc_year" label="10th Passing Year" required options={yearOptions} control={formControl} placeholder="Select" />
            <GenericInputField name="hsc" label="12th (HSC) %" placeholder="e.g. 72" />
            <GenericDropdown name="hsc_year" label="12th Passing Year" options={yearOptions} control={formControl} placeholder="Select" />
          </div>

          {education.map((e) => (
            <div key={e.id} className="mt-3 rounded-lg border border-stroke p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary-navy">{EDU_LABEL[e.type]}</h3>
                <button
                  type="button"
                  onClick={() => setEducation((prev) => prev.filter((x) => x.id !== e.id))}
                  className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-500"
                  aria-label={`Remove ${EDU_LABEL[e.type]}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="block text-sm font-medium text-black">
                  <span className="mb-1 block">Score</span>
                  <input className={control} placeholder="CGPA / %" value={e.score} onChange={(ev) => updateEducation(e.id, 'score', ev.target.value)} />
                </label>
                <label className="block text-sm font-medium text-black">
                  <span className="mb-1 block">Passing Year</span>
                  <select className={control} value={e.year} onChange={(ev) => updateEducation(e.id, 'year', ev.target.value)}>
                    <option value="">Select</option>
                    {yearOptions.map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 block text-sm font-medium text-black sm:col-span-1">
                  <span className="mb-1 block">Course</span>
                  <input className={control} placeholder="e.g. B.Sc Nursing" value={e.course} onChange={(ev) => updateEducation(e.id, 'course', ev.target.value)} />
                </label>
              </div>
            </div>
          ))}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Add:</span>
            {(Object.keys(EDU_LABEL) as EduType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addEducation(t)}
                className="inline-flex items-center gap-1 rounded border border-primary-navy/40 px-2 py-1 text-xs font-medium text-primary-navy transition hover:bg-primary-navy hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> {EDU_LABEL[t]}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Experience">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <GenericDropdown name="isExperience" label="Any experience?" required options={YES_NO} control={formControl} placeholder="Select" />
            <GenericDropdown name="isCurrentlyWorking" label="Currently working?" required options={YES_NO} control={formControl} placeholder="Select" />
            {hasExperience && (
              <>
                <GenericDropdown name="experience_years" label="Years of Experience" options={EXPERIENCE_YEARS} control={formControl} placeholder="Select" />
                <GenericInputField name="workProfile" label="Work Profile(s)" placeholder="Comma separated" />
                <GenericInputField name="companies" label="Companies Worked" placeholder="Comma separated" />
              </>
            )}
            {isWorking && (
              <>
                <GenericInputField name="currentProfile" label="Current Profile" placeholder="e.g. Medical Coder" />
                <GenericInputField name="currentCompany" label="Current Company" placeholder="Company name" />
              </>
            )}
          </div>
        </Section>

        <Section title="Preferences">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GenericDropdown name="Preferred_Profiles" label="Preferred Profile" required options={toOptions(preferredProfiles)} control={formControl} />
            <GenericDropdown name="preferredLocation" label="Preferred Location" required options={toOptions(preferredLocations)} control={formControl} />
            <GenericDropdown name="state" label="Current State" required options={stateOptions} control={formControl} />
            <GenericDropdown
              name="district"
              label="Current District"
              required
              options={districtOptions}
              control={formControl}
              disabled={!selectedState}
              placeholder={selectedState ? 'Select district' : 'Select state first'}
            />
          </div>
        </Section>

        <Section title="Documents">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <GenericInputField type="file" name="aadharcard" label="Aadhar Card" required={!saved?.aadharcard} />
              {savedDoc(saved?.aadharcard)}
            </div>
            <div>
              <GenericInputField type="file" name="profile_photo" label="Profile Photo" required={!saved?.profile_photo} />
              {savedDoc(saved?.profile_photo)}
            </div>
            <div>
              <GenericInputField type="file" name="resume" label="Resume" required={!saved?.resume} />
              {savedDoc(saved?.resume)}
            </div>
          </div>
        </Section>

        <div className="flex justify-end pb-2">
          <GenericButton type="submit" variant="navy" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Saving…' : saved ? 'Update Details' : 'Submit Details'}
          </GenericButton>
        </div>
      </form>
    </FormProvider>
  );
};

export default PlacmentFrom;
