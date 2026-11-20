import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { academyApi, apiError, EnrollmentQuery } from '@/lib/api/admin/academyApi';

/** Every academy query key starts with 'academy' so related screens refresh together after a change. */
export const AK = {
  categories: ['academy', 'categories'],
  courses: ['academy', 'courses'],
  courseOptions: ['academy', 'courses', 'options'],
  course: (id: string) => ['academy', 'courses', 'detail', id],
  questions: ['academy', 'questions'],
  popular: ['academy', 'popular'],
  bundles: ['academy', 'bundles'],
  liveClasses: ['academy', 'live-classes'],
  enrollments: ['academy', 'enrollments'],
  coupons: ['academy', 'coupons'],
  partners: ['academy', 'partners'],
  payouts: ['academy', 'payouts'],
  report: ['academy', 'report'],
  files: ['academy', 'files'],
  blogs: ['academy', 'blogs'],
  contactMessages: ['academy', 'contact-messages'],
  settings: (key: string) => ['academy', 'settings', key],
  learners: ['academy', 'learners'],
};

/**
 * Mutation with a toast on success/failure that refreshes the given query groups.
 * Errors surface the server's message (e.g. "This coupon code already exists").
 */
export const useAcademyMutation = <TVars, TData = unknown>(
  fn: (vars: TVars) => Promise<TData>,
  opts: { invalidate?: (readonly unknown[])[]; success?: string | false } = {},
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      (opts.invalidate ?? [['academy']]).forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      if (opts.success !== false) toast.success(opts.success || 'Saved');
    },
    onError: (e) => toast.error(apiError(e).message),
  });
};

export const useCategories = () => useQuery({ queryKey: AK.categories, queryFn: academyApi.categories });
export const useCourses = (q: { search?: string; categoryId?: string; status?: string }) =>
  useQuery({ queryKey: [...AK.courses, q], queryFn: () => academyApi.courses(q), placeholderData: keepPreviousData });
export const useCourseOptions = () => useQuery({ queryKey: AK.courseOptions, queryFn: academyApi.courseOptions });
export const useCourse = (id: string) =>
  useQuery({ queryKey: AK.course(id), queryFn: () => academyApi.course(id), enabled: !!id });
export const useQuestions = (q: { courseId?: string; status?: string; search?: string }) =>
  useQuery({ queryKey: [...AK.questions, q], queryFn: () => academyApi.questions(q), placeholderData: keepPreviousData });
export const usePopular = () => useQuery({ queryKey: AK.popular, queryFn: academyApi.popular });
export const useBundles = () => useQuery({ queryKey: AK.bundles, queryFn: academyApi.bundles });
export const useBundleOptions = () => useQuery({ queryKey: [...AK.bundles, 'options'], queryFn: academyApi.bundleOptions });
export const useLiveClasses = (q: { status?: string; courseId?: string }) =>
  useQuery({ queryKey: [...AK.liveClasses, q], queryFn: () => academyApi.liveClasses(q) });
export const useEnrollments = (q: EnrollmentQuery) =>
  useQuery({ queryKey: [...AK.enrollments, q], queryFn: () => academyApi.enrollments(q), placeholderData: keepPreviousData });
export const useCoupons = () => useQuery({ queryKey: AK.coupons, queryFn: academyApi.coupons });
export const usePartners = () => useQuery({ queryKey: AK.partners, queryFn: academyApi.partners });
export const usePayouts = (q: { partnerId?: string; status?: string }) =>
  useQuery({ queryKey: [...AK.payouts, q], queryFn: () => academyApi.payouts(q) });
export const useReport = (q: { from?: string; to?: string }) =>
  useQuery({ queryKey: [...AK.report, q], queryFn: () => academyApi.report(q), placeholderData: keepPreviousData });
export const useEduFiles = (q: { search?: string; category?: string; courseId?: string }) =>
  useQuery({ queryKey: [...AK.files, q], queryFn: () => academyApi.files(q), placeholderData: keepPreviousData });
export const useBlogs = (q: { search?: string; status?: string }) =>
  useQuery({ queryKey: [...AK.blogs, q], queryFn: () => academyApi.blogs(q), placeholderData: keepPreviousData });
export const useContactMessages = (q: { page: number; limit: number; search?: string; status?: string }) =>
  useQuery({ queryKey: [...AK.contactMessages, q], queryFn: () => academyApi.contactMessages(q), placeholderData: keepPreviousData });
export const useSetting = <T,>(key: 'website' | 'business') =>
  useQuery({ queryKey: AK.settings(key), queryFn: () => academyApi.setting<T>(key) });
export const useLearners = (q: { page: number; limit: number; search?: string }) =>
  useQuery({ queryKey: [...AK.learners, q], queryFn: () => academyApi.learners(q), placeholderData: keepPreviousData });
export const useLearnerOptions = (search: string) =>
  useQuery({
    queryKey: [...AK.learners, 'options', search],
    queryFn: () => academyApi.learnerOptions(search || undefined),
    placeholderData: keepPreviousData,
  });
export const useLearnerEnrollments = (id: string | null) =>
  useQuery({
    queryKey: [...AK.learners, 'enrollments', id],
    queryFn: () => academyApi.learnerEnrollments(id!),
    enabled: !!id,
  });
