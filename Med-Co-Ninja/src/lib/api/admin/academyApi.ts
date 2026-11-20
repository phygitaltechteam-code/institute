import { api } from '@/utils/axios';

/**
 * Online academy (LMS) admin API — backend: /api/v1/admin/academy.
 * The axios response interceptor already unwraps res.data, so each call returns the
 * `{ success, message, data }` body and these helpers return its `data`.
 */
const BASE = '/admin/academy';
const unwrap = <T,>(p: Promise<unknown>) => p.then((r) => (r as { data: T }).data);
const get = <T,>(url: string, params?: Record<string, unknown>) => unwrap<T>(api.get(BASE + url, { params }));
const post = <T,>(url: string, body?: unknown) => unwrap<T>(api.post(BASE + url, body));
const put = <T,>(url: string, body?: unknown) => unwrap<T>(api.put(BASE + url, body));
const patch = <T,>(url: string, body?: unknown) => unwrap<T>(api.patch(BASE + url, body));
const del = <T,>(url: string) => unwrap<T>(api.delete(BASE + url));

/** Turn a stored path like "/uploads/academy/x.png" into a full URL on the API host. */
export const fileUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const origin = String(import.meta.env.VITE_SERVER_URL || '').replace(/\/api\/v\d+\/?$/, '');
  return `${origin}${url}`;
};

// ── Types ─────────────────────────────────────────────────────
export type CourseStatus = 'DRAFT' | 'PUBLIC' | 'PRIVATE';
export type PaymentMode = 'FREE' | 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
export type Faq = { question: string; answer: string };

export type Category = { id: string; name: string; createdAt: string; _count: { courses: number } };

export type CourseInput = {
  name: string;
  categoryId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  price: number;
  discountPrice?: number | null;
  level?: string | null;
  language?: string | null;
  validityDays?: number | null;
  status: CourseStatus;
  allowDownload: boolean;
  faqs: Faq[];
};

export type CourseRow = CourseInput & {
  id: string;
  createdAt: string;
  isPopular: boolean;
  category: { id: string; name: string } | null;
  sectionCount: number;
  lessonCount: number;
  enrollmentCount: number;
};

export type CourseOption = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  status: CourseStatus;
  validityDays: number | null;
};

export type LessonResource = { id: string; name: string; fileUrl: string; fileType: string; sizeBytes: number };
export type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  durationMinutes: number | null;
  isPreview: boolean;
  order: number;
  resources: LessonResource[];
};
export type Section = { id: string; title: string; order: number; lessons: Lesson[] };
export type CourseDetail = CourseRow & {
  sections: Section[];
  revenue: number;
  _count: { enrollments: number; questions: number };
};

export type Question = {
  id: string;
  question: string;
  isResolved: boolean;
  createdAt: string;
  course: { id: string; name: string };
  lesson: { id: string; title: string } | null;
  student: { id: string; user: { fullname: string; phoneNumber: string } };
  replies: { id: string; authorName: string; isStaff: boolean; message: string; createdAt: string }[];
};

export type BundleInput = {
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  price: number;
  discountPrice?: number | null;
  isActive: boolean;
  courseIds: string[];
  faqs: Faq[];
};
export type Bundle = Omit<BundleInput, 'courseIds' | 'faqs'> & {
  faqs: Faq[] | null;
  id: string;
  createdAt: string;
  courses: { id: string; name: string; price: number; discountPrice: number | null }[];
  enrollmentCount: number;
};
/** Public landing-page data for one bundle (GET /public/bundles/:id, no login). */
export type PublicBundleCourse = {
  id: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  level: string | null;
  language: string | null;
  validityDays: number | null;
  category: { id: string; name: string } | null;
  sections: { title: string; lessons: { title: string; durationMinutes: number | null }[] }[];
};
export type PublicBundle = {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  enrollmentCount: number;
  faqs: Faq[] | null;
  courses: PublicBundleCourse[];
  institute: { name: string; logo: string | null; tagline: string | null; phone: string; email: string; address: string };
  website: WebsiteSettings;
};
export type PublicCourseCard = {
  id: string;
  name: string;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  level: string | null;
  language: string | null;
  category: { id: string; name: string } | null;
};
export type PublicBundleCard = Omit<PublicBundle, 'courses' | 'institute' | 'website' | 'enrollmentCount'> & {
  courses: { course: PublicCourseCard }[];
};
/** Optional: pin the public website to one institute with VITE_PUBLIC_ADMIN_ID (defaults to the first institute). */
const publicParams = () => (import.meta.env.VITE_PUBLIC_ADMIN_ID ? { adminId: import.meta.env.VITE_PUBLIC_ADMIN_ID } : undefined);
export const publicApi = {
  bundle: (id: string) => unwrap<PublicBundle>(api.get(`/public/bundles/${id}`)),
  website: () => unwrap<WebsiteSettings>(api.get('/public/website', { params: publicParams() })),
  courses: (popular?: boolean) =>
    unwrap<PublicCourseCard[]>(api.get('/public/courses', { params: { ...publicParams(), ...(popular ? { popular: 'true' } : {}) } })),
  bundles: () => unwrap<PublicBundleCard[]>(api.get('/public/bundles', { params: publicParams() })),
  blogs: () => unwrap<PublicBlogCard[]>(api.get('/public/blogs', { params: publicParams() })),
  blog: (slug: string) => unwrap<PublicBlog>(api.get(`/public/blogs/${encodeURIComponent(slug)}`, { params: publicParams() })),
  /** Returns the server's thank-you message. */
  contact: (d: ContactMessageInput) =>
    (api.post('/public/contact', d, { params: publicParams() }) as Promise<unknown>).then((r) => (r as { message?: string }).message ?? 'Message sent'),
};
/** Shareable landing-page link for a bundle. */
export const bundleLandingUrl = (id: string) => `${window.location.origin}/bundle/${id}`;

export type BundleOption = { id: string; name: string; price: number; discountPrice: number | null; isActive: boolean };

export type LiveClassStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type LiveClassInput = {
  title: string;
  courseId?: string | null;
  description?: string | null;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: LiveClassStatus;
  recordingUrl?: string | null;
};
export type LiveClass = LiveClassInput & { id: string; course: { id: string; name: string } | null };

export type Enrollment = {
  id: string;
  invoiceNo: string;
  listPrice: number;
  discount: number;
  amountPaid: number;
  taxAmount: number;
  paymentMode: PaymentMode;
  paymentRef: string | null;
  partnerCommission: number;
  status: 'ACTIVE' | 'REVOKED';
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
  student: { id: string; user: { fullname: string; phoneNumber: string; email: string } };
  course: { id: string; name: string } | null;
  bundle: { id: string; name: string } | null;
  coupon: { id: string; code: string } | null;
  partner: { id: string; name: string; code: string } | null;
};
export type Paged<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
};
export type EnrollmentPage = Paged<Enrollment> & {
  totals: { amountPaid: number; taxAmount: number; discount: number };
};
export type EnrollmentQuery = {
  page: number;
  limit: number;
  search?: string;
  courseId?: string;
  bundleId?: string;
  status?: string;
  paymentMode?: string;
  from?: string;
  to?: string;
  paidOnly?: boolean;
};
export type EnrollInput = {
  studentIds: string[];
  courseId?: string | null;
  bundleId?: string | null;
  paymentMode: PaymentMode;
  amountPaid?: number | null;
  couponCode?: string | null;
  partnerId?: string | null;
  paymentRef?: string | null;
  note?: string | null;
  expiresAt?: string | null;
};
export type EnrollResult = {
  created: Enrollment[];
  skipped: { studentId: string; name: string; reason: string }[];
};

export type BusinessSettings = {
  businessName?: string;
  legalName?: string;
  gstNumber?: string;
  panNumber?: string;
  gstPercent?: number;
  sacCode?: string;
  invoicePrefix?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  phone?: string;
  invoiceFooter?: string;
};
export type Invoice = {
  enrollment: Enrollment & {
    student: Enrollment['student'] & { address: string; city: string; state: string; pincode: string };
  };
  business: BusinessSettings;
};

export type CouponInput = {
  code: string;
  description?: string | null;
  discountType: 'PERCENT' | 'FLAT';
  value: number;
  maxUses?: number | null;
  minAmount?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
  courseId?: string | null;
  partnerId?: string | null;
};
export type Coupon = CouponInput & {
  id: string;
  usedCount: number;
  course: { id: string; name: string } | null;
  partner: { id: string; name: string } | null;
};

export type PartnerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  code: string;
  commissionPercent: number;
  upiId?: string | null;
  bankDetails?: string | null;
  isActive: boolean;
};
export type Partner = PartnerInput & {
  id: string;
  totalSales: number;
  earned: number;
  paid: number;
  pendingPayouts: number;
  balance: number;
  _count: { enrollments: number; coupons: number };
};
export type PayoutStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type Payout = {
  id: string;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  partner: { id: string; name: string; code: string; upiId: string | null };
};

export type Report = {
  totals: {
    revenue: number;
    tax: number;
    discount: number;
    commission: number;
    enrollments: number;
    buyers: number;
    totalCourses: number;
    totalStudents: number;
  };
  monthly: { month: string; revenue: number; enrollments: number }[];
  byPaymentMode: { mode: PaymentMode; count: number; revenue: number }[];
  items: { type: string; id: string; name: string; enrollments: number; revenue: number }[];
};

export type EduFileInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  courseId?: string | null;
  fileUrl: string;
  fileType: string;
  sizeBytes: number;
  isPublic: boolean;
};
export type EduFile = EduFileInput & { id: string; createdAt: string; course: { id: string; name: string } | null };

export type BlogInput = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  author?: string | null;
  tags: string[];
  isPublished: boolean;
};
export type Blog = BlogInput & { id: string; slug: string; publishedAt: string | null; createdAt: string; updatedAt: string };

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
export type ContactMessageInput = { name: string; email: string; phone?: string; subject: string; message: string; website?: string };
export type PublicBlogCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  tags: string[];
  publishedAt: string | null;
};
export type PublicBlog = PublicBlogCard & { content: string };

export type WebsiteSettings = {
  siteName?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  aboutTitle?: string;
  aboutContent?: string;
  aboutImage?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  address?: string;
  mapUrl?: string;
  social?: { facebook?: string; instagram?: string; youtube?: string; linkedin?: string; twitter?: string };
  faqs?: Faq[];
  testimonials?: { name: string; role?: string; message: string; photo?: string; rating?: number }[];
};

export type Learner = {
  id: string;
  city: string;
  state: string;
  qualification: string | null;
  collegeName: string | null;
  createdAt: string;
  user: { id: string; username: string; fullname: string; email: string; phoneNumber: string; isActive: boolean };
  batches: string[];
  enrollmentCount: number;
};
export type LearnerInput = {
  fullname: string;
  phoneNumber: string;
  email: string;
  password?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  address?: string | null;
  qualification?: string | null;
  collegeName?: string | null;
  isActive?: boolean;
};
export type LearnerOption = { id: string; user: { fullname: string; phoneNumber: string; email: string } };
export type UploadResult = { url: string; name: string; fileType: string; sizeBytes: number };

// ── Calls ─────────────────────────────────────────────────────
export const academyApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    return unwrap<UploadResult>(
      api.post(`${BASE}/uploads`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      }),
    );
  },

  categories: () => get<Category[]>('/categories'),
  createCategory: (name: string) => post<Category>('/categories', { name }),
  updateCategory: (id: string, name: string) => patch<Category>(`/categories/${id}`, { name }),
  deleteCategory: (id: string) => del(`/categories/${id}`),

  courses: (q: { search?: string; categoryId?: string; status?: string }) => get<CourseRow[]>('/courses', q),
  courseOptions: () => get<CourseOption[]>('/courses/options'),
  course: (id: string) => get<CourseDetail>(`/courses/${id}`),
  createCourse: (d: CourseInput) => post<CourseRow>('/courses', d),
  updateCourse: (id: string, d: CourseInput) => put<CourseRow>(`/courses/${id}`, d),
  deleteCourse: (id: string) => del(`/courses/${id}`),

  createSection: (courseId: string, title: string) => post<Section>('/sections', { courseId, title }),
  updateSection: (id: string, title: string) => patch<Section>(`/sections/${id}`, { title }),
  deleteSection: (id: string) => del(`/sections/${id}`),
  reorderSections: (ids: string[]) => patch('/sections/reorder', { ids }),
  createLesson: (d: Partial<Lesson> & { sectionId: string; title: string }) => post<Lesson>('/lessons', d),
  updateLesson: (id: string, d: Partial<Lesson>) => patch<Lesson>(`/lessons/${id}`, d),
  deleteLesson: (id: string) => del(`/lessons/${id}`),
  reorderLessons: (ids: string[]) => patch('/lessons/reorder', { ids }),
  addResource: (lessonId: string, d: Omit<LessonResource, 'id'>) => post(`/lessons/${lessonId}/resources`, d),
  deleteResource: (id: string) => del(`/resources/${id}`),

  questions: (q: { courseId?: string; status?: string; search?: string }) =>
    get<{ items: Question[]; openCount: number }>('/questions', q),
  replyQuestion: (id: string, message: string) => post(`/questions/${id}/replies`, { message }),
  resolveQuestion: (id: string, isResolved: boolean) => patch(`/questions/${id}`, { isResolved }),
  deleteQuestion: (id: string) => del(`/questions/${id}`),

  popular: () => get<(CourseOption & { thumbnail: string | null })[]>('/popular-courses'),
  setPopular: (courseIds: string[]) => put('/popular-courses', { courseIds }),

  bundles: () => get<Bundle[]>('/bundles'),
  bundleOptions: () => get<BundleOption[]>('/bundles/options'),
  createBundle: (d: BundleInput) => post<{ id: string }>('/bundles', d),
  updateBundle: (id: string, d: BundleInput) => put(`/bundles/${id}`, d),
  deleteBundle: (id: string) => del(`/bundles/${id}`),

  liveClasses: (q: { status?: string; courseId?: string }) => get<LiveClass[]>('/live-classes', q),
  createLiveClass: (d: LiveClassInput) => post('/live-classes', d),
  updateLiveClass: (id: string, d: LiveClassInput) => put(`/live-classes/${id}`, d),
  deleteLiveClass: (id: string) => del(`/live-classes/${id}`),

  enrollments: (q: EnrollmentQuery) => get<EnrollmentPage>('/enrollments', q),
  enroll: (d: EnrollInput) => post<EnrollResult>('/enrollments', d),
  setEnrollmentStatus: (id: string, status: 'ACTIVE' | 'REVOKED') => patch(`/enrollments/${id}`, { status }),
  deleteEnrollment: (id: string) => del(`/enrollments/${id}`),
  invoice: (id: string) => get<Invoice>(`/invoices/${id}`),

  coupons: () => get<Coupon[]>('/coupons'),
  createCoupon: (d: CouponInput) => post('/coupons', d),
  updateCoupon: (id: string, d: CouponInput) => put(`/coupons/${id}`, d),
  deleteCoupon: (id: string) => del(`/coupons/${id}`),
  validateCoupon: (d: { code: string; courseId?: string | null; bundleId?: string | null }) =>
    post<{ code: string; listPrice: number; discount: number; payable: number }>('/coupons/validate', d),

  partners: () => get<Partner[]>('/partners'),
  createPartner: (d: PartnerInput) => post('/partners', d),
  updatePartner: (id: string, d: PartnerInput) => put(`/partners/${id}`, d),
  deletePartner: (id: string) => del(`/partners/${id}`),
  payouts: (q: { partnerId?: string; status?: string }) => get<Payout[]>('/payouts', q),
  createPayout: (d: { partnerId: string; amount: number; status: PayoutStatus; reference?: string | null; note?: string | null }) =>
    post('/payouts', d),
  updatePayout: (id: string, d: { status?: PayoutStatus; reference?: string | null; note?: string | null }) =>
    patch(`/payouts/${id}`, d),
  deletePayout: (id: string) => del(`/payouts/${id}`),

  report: (q: { from?: string; to?: string }) => get<Report>('/report', q),

  files: (q: { search?: string; category?: string; courseId?: string }) => get<EduFile[]>('/files', q),
  createFile: (d: EduFileInput) => post('/files', d),
  updateFile: (id: string, d: Partial<EduFileInput>) => patch(`/files/${id}`, d),
  deleteFile: (id: string) => del(`/files/${id}`),

  blogs: (q: { search?: string; status?: string }) => get<Blog[]>('/blogs', q),
  createBlog: (d: BlogInput) => post('/blogs', d),
  updateBlog: (id: string, d: BlogInput) => put(`/blogs/${id}`, d),
  deleteBlog: (id: string) => del(`/blogs/${id}`),

  contactMessages: (q: { page?: number; limit?: number; search?: string; status?: string }) =>
    get<{ items: ContactMessage[]; totalItems: number; totalPages: number; unreadCount: number }>('/contact-messages', q),
  setContactMessageRead: (id: string, isRead: boolean) => patch<ContactMessage>(`/contact-messages/${id}`, { isRead }),
  deleteContactMessage: (id: string) => del(`/contact-messages/${id}`),

  setting: <T,>(key: 'website' | 'business') => get<T>(`/settings/${key}`),
  saveSetting: (key: 'website' | 'business', value: unknown) => put(`/settings/${key}`, value),

  learners: (q: { page: number; limit: number; search?: string }) => get<Paged<Learner>>('/students', q),
  learnerOptions: (search?: string) => get<LearnerOption[]>('/students/options', { search }),
  createLearner: (d: LearnerInput) => post('/students', d),
  updateLearner: (id: string, d: Partial<LearnerInput>) => patch(`/students/${id}`, d),
  learnerEnrollments: (id: string) => get<Enrollment[]>(`/students/${id}/enrollments`),
};

/** Server error → readable message + per-field messages from the zod validator. */
export const apiError = (error: unknown) => {
  const body = (error as { response?: { data?: { message?: string; errors?: unknown } } })?.response?.data;
  const fields: Record<string, string> = {};
  if (Array.isArray(body?.errors)) {
    for (const e of body.errors as { field?: string; message?: string }[]) {
      if (e?.field && e.message && !fields[e.field]) fields[e.field] = e.message;
    }
  }
  const first = Object.values(fields)[0];
  const message =
    body?.message && body.message !== 'Validation failed'
      ? body.message
      : first || body?.message || (error as Error)?.message || 'Something went wrong';
  return { message, fields };
};
