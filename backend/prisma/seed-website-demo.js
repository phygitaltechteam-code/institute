/**
 * Demo content for an institute's public website (landing page).
 *
 *   node prisma/seed-website-demo.js [adminUsername]     (default: 9123456780 = MedCode Demo Institute)
 *
 * Safe to run more than once: rows are matched by name/slug and reused, and website settings
 * only fill keys that are still empty (nothing you've already typed is overwritten).
 */
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();
const USERNAME = process.argv[2] || '9123456780';

const WEBSITE = {
    siteName: 'MedCode Ninja',
    tagline: 'Medical coding training that gets you hired',
    heroTitle: 'Become a certified medical coder in 4 months',
    heroSubtitle:
        'Live classes, real medical records and mock exams for CPC and CCS, taught by working coders.\nJoin 2,000+ learners who started their healthcare career with us.',
    aboutTitle: 'Why learn with MedCode Ninja',
    aboutContent:
        'MedCode Ninja is a medical coding academy built by coders who have worked on US healthcare projects for over a decade. We teach the way the job is done: real charts, current guidelines and the audit standards employers expect.\n\nEvery course combines live online classes with recordings, chapter-wise practice questions and full-length mock exams. Small batches mean faculty know each learner, and doubts are cleared the same day.\n\nAfter certification, our placement team helps with your resume, interview practice and referrals to hiring partners across India.',
    contactEmail: 'hello@example.com',
    contactPhone: '+91 98765 43210',
    whatsapp: '9876543210',
    address: '2nd Floor, Example Towers, FC Road,\nShivajinagar, Pune, Maharashtra 411004',
    mapUrl: 'https://maps.google.com/?q=FC+Road+Pune',
    social: {
        facebook: 'https://www.facebook.com/',
        instagram: 'https://www.instagram.com/',
        youtube: 'https://www.youtube.com/',
        linkedin: 'https://www.linkedin.com/',
    },
    testimonials: [
        {
            name: 'Priya Deshmukh',
            role: 'CPC certified · Medical Coder at a US RCM company',
            message:
                'I came from a B.Pharm background with zero coding knowledge. The mock exams were tougher than the real CPC, so on exam day I felt calm. Cleared it in my first attempt and got placed within a month.',
            rating: 5,
        },
        {
            name: 'Rahul Patil',
            role: 'CCS certified · Inpatient Coder',
            message:
                'The inpatient chart practice is what made the difference. Faculty explained DRG logic and sequencing rules with real cases, not just slides. Highly recommend the CCS batch.',
            rating: 5,
        },
        {
            name: 'Sneha Kulkarni',
            role: 'Nursing graduate · E/M Coder',
            message:
                'Weekend batches let me keep my hospital job while studying. Recordings were available the same night, and doubt sessions were very helpful.',
            rating: 4,
        },
        {
            name: 'Amit Joshi',
            role: 'Coding Auditor',
            message:
                'Joined the E/M auditing course to move from coder to auditor. The 2023 guideline changes were covered in detail, and the audit worksheets are something I still use at work.',
            rating: 5,
        },
    ],
    faqs: [
        {
            question: 'Who can join a medical coding course?',
            answer: 'Graduates from life sciences, pharmacy, nursing, physiotherapy, BDS, BHMS, BAMS and similar backgrounds are a great fit. Basic English and computer skills are enough to start; we teach anatomy and terminology from scratch.',
        },
        {
            question: 'Are classes online or offline?',
            answer: 'All classes are live online with recordings, so you can learn from anywhere. Recordings stay available for the full validity of your course.',
        },
        {
            question: 'Do you help with the CPC / CCS exam?',
            answer: 'Yes. Courses include chapter-wise tests and full-length mock exams in the real exam format, plus guidance on booking the exam and time management.',
        },
        {
            question: 'Is placement support included?',
            answer: 'Yes. After you complete the course, we help with your resume, conduct mock interviews and share openings from our hiring partners.',
        },
        {
            question: 'Can I pay in instalments?',
            answer: 'Yes, instalment options are available for most courses and bundles. Contact us and our counsellor will share the plan that suits you.',
        },
    ],
};

const CATEGORIES = ['Certification Prep', 'Coding Fundamentals', 'Specialty Coding'];

const COURSES = [
    {
        name: 'CPC Certification Prep',
        category: 'Certification Prep',
        shortDescription: 'Complete preparation for the AAPC CPC exam: CPT, ICD-10-CM and HCPCS with 3 full mock exams.',
        description:
            '<p>Prepare for the AAPC Certified Professional Coder exam with live classes, real outpatient charts and exam-style practice.</p><ul><li>All 17 CPT chapters</li><li>ICD-10-CM guidelines</li><li>3 full-length timed mock exams</li></ul>',
        price: 28000,
        discountPrice: 21999,
        level: 'Beginner',
        language: 'English',
        validityDays: 365,
        isPopular: true,
        popularOrder: 1,
        sections: [
            ['Getting started', ['Introduction to medical coding', 'Healthcare in the US and the revenue cycle', 'How the CPC exam works']],
            ['Medical terminology & anatomy', ['Word roots, prefixes and suffixes', 'Body systems overview', 'Reading an operative note']],
            ['CPT coding', ['E/M basics', 'Surgery section: integumentary to musculoskeletal', 'Radiology, pathology and medicine']],
            ['Exam practice', ['Mock exam 1 with review', 'Mock exam 2 with review', 'Exam-day strategy']],
        ],
    },
    {
        name: 'ICD-10-CM Fundamentals',
        category: 'Coding Fundamentals',
        shortDescription: 'Master diagnosis coding: conventions, official guidelines and chapter-specific rules with hands-on cases.',
        description: '<p>A focused course on ICD-10-CM diagnosis coding, ideal before CPC or CCS.</p>',
        price: 12000,
        discountPrice: 8999,
        level: 'Beginner',
        language: 'English',
        validityDays: 180,
        isPopular: true,
        popularOrder: 2,
        sections: [
            ['Code book conventions', ['Structure of ICD-10-CM', 'Index and tabular list', 'Excludes1 vs Excludes2']],
            ['Official guidelines', ['Section I general guidelines', 'Sequencing rules', 'Outpatient guidelines (Section IV)']],
            ['Chapter-specific coding', ['Diabetes and complications', 'Neoplasms', 'Injuries and external causes']],
        ],
    },
    {
        name: 'CCS Inpatient Coding',
        category: 'Certification Prep',
        shortDescription: 'Inpatient coding with ICD-10-PCS, DRG assignment and AHIMA CCS exam preparation.',
        description: '<p>Learn ICD-10-PCS procedure coding and inpatient sequencing, then practise with full inpatient records.</p>',
        price: 30000,
        discountPrice: 24999,
        level: 'Intermediate',
        language: 'English',
        validityDays: 365,
        isPopular: true,
        popularOrder: 3,
        sections: [
            ['ICD-10-PCS', ['PCS structure and the 7 characters', 'Root operations', 'Medical and surgical section']],
            ['Inpatient sequencing', ['Principal diagnosis selection', 'CC/MCC and DRGs', 'Present on admission']],
            ['CCS exam prep', ['Inpatient case practice', 'Mock exam with review']],
        ],
    },
    {
        name: 'E/M Coding & Auditing',
        category: 'Specialty Coding',
        shortDescription: 'Evaluation & Management coding with the latest guidelines, MDM levels and audit worksheets.',
        description: '<p>For coders moving into E/M or auditing roles. Covers office, hospital and ED visits with audit practice.</p>',
        price: 15000,
        discountPrice: 11999,
        level: 'Advanced',
        language: 'English',
        validityDays: 180,
        isPopular: false,
        popularOrder: 0,
        sections: [
            ['E/M guidelines', ['Office and outpatient visits', 'Medical decision making (MDM)', 'Time-based coding']],
            ['Auditing', ['Building an audit worksheet', 'Common E/M errors', 'Writing audit feedback']],
        ],
    },
];

const BUNDLES = [
    {
        name: 'Complete Medical Coder Bundle',
        description:
            'Everything you need to start a medical coding career: ICD-10-CM fundamentals, full CPC preparation and E/M coding, at one bundled price.',
        price: 55000,
        discountPrice: 39999,
        courses: ['ICD-10-CM Fundamentals', 'CPC Certification Prep', 'E/M Coding & Auditing'],
    },
    {
        name: 'Inpatient Coding Pro Bundle',
        description: 'Diagnosis coding plus ICD-10-PCS and DRGs, ending with CCS exam preparation. Ideal for hospital and inpatient coding roles.',
        price: 42000,
        discountPrice: 29999,
        courses: ['ICD-10-CM Fundamentals', 'CCS Inpatient Coding'],
    },
];

const BLOGS = [
    {
        title: 'What is medical coding? A beginner’s guide for 2026',
        slug: 'what-is-medical-coding',
        excerpt: 'Medical coding turns doctors’ notes into standard codes used for billing and records. Here is what coders do, the skills you need and how to start.',
        tags: ['Career', 'Beginners'],
        content:
            '<h2>What medical coders do</h2><p>Every visit, test and procedure in healthcare is recorded by doctors in plain language. Medical coders read these records and convert them into standard codes: ICD-10-CM for diagnoses, CPT and HCPCS for procedures and services.</p><p>Insurance companies use these codes to process claims, so accurate coding directly affects how hospitals get paid.</p><h2>Skills you need</h2><ul><li>Basic anatomy and medical terminology</li><li>Attention to detail</li><li>Comfort reading English documents</li></ul><h2>How to start</h2><p>Begin with ICD-10-CM fundamentals, then prepare for a certification such as CPC. Certified coders are preferred by most employers.</p>',
        daysAgo: 3,
    },
    {
        title: 'CPC vs CCS: which certification should you choose?',
        slug: 'cpc-vs-ccs-certification',
        excerpt: 'Both are respected credentials, but they lead to different jobs. Compare exam format, difficulty and career paths before you decide.',
        tags: ['Certification', 'CPC', 'CCS'],
        content:
            '<h2>CPC (AAPC)</h2><p>The Certified Professional Coder exam focuses on outpatient and physician coding using CPT, ICD-10-CM and HCPCS. It is the most common certification for freshers in India.</p><h2>CCS (AHIMA)</h2><p>The Certified Coding Specialist exam focuses on inpatient hospital coding, including ICD-10-PCS and DRGs. It suits learners who want hospital or inpatient roles.</p><h2>Our advice</h2><p>Freshers usually start with CPC. If you already work in coding and want to move into inpatient work, CCS is a strong next step.</p>',
        daysAgo: 10,
    },
    {
        title: '5 tips to clear the CPC exam on your first attempt',
        slug: 'tips-to-clear-cpc-exam',
        excerpt: 'Time management, a well-tabbed code book and full mock exams make the biggest difference. Here are five practical tips from our faculty.',
        tags: ['CPC', 'Exam tips'],
        content:
            '<ol><li><strong>Tab and highlight your books</strong> so you can find guidelines quickly.</li><li><strong>Practise under time pressure.</strong> You have about 2 minutes per question.</li><li><strong>Use elimination.</strong> Remove options with wrong code ranges first.</li><li><strong>Read the guidelines</strong> at the start of each CPT section.</li><li><strong>Take at least three full mock exams</strong> and review every mistake.</li></ol>',
        daysAgo: 18,
    },
];

const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

async function main() {
    const user = await prisma.user.findUnique({where: {username: USERNAME}, select: {fullname: true, institute: {select: {id: true}}}});
    if (!user?.institute) throw new Error(`No institute admin with username ${USERNAME}`);
    const adminId = user.institute.id;
    console.log(`Seeding website demo for "${user.fullname}" (${adminId})`);

    // Website settings: fill only empty keys
    const row = await prisma.siteSetting.findUnique({where: {adminId_key: {adminId, key: 'website'}}});
    const current = (row?.value && typeof row.value === 'object' ? row.value : {}) || {};
    const merged = {...current};
    let filled = 0;
    for (const [k, v] of Object.entries(WEBSITE)) {
        if (isEmpty(current[k])) {
            merged[k] = v;
            filled++;
        }
    }
    await prisma.siteSetting.upsert({
        where: {adminId_key: {adminId, key: 'website'}},
        create: {adminId, key: 'website', value: merged},
        update: {value: merged},
    });
    console.log(`  website settings: ${filled} field(s) filled`);

    // Categories
    const cat = {};
    for (const name of CATEGORIES) {
        cat[name] = (
            await prisma.courseCategory.upsert({where: {adminId_name: {adminId, name}}, create: {adminId, name}, update: {}})
        ).id;
    }

    // Courses with curriculum
    const courseId = {};
    for (const c of COURSES) {
        const {sections, category, ...data} = c;
        const existing = await prisma.onlineCourse.findFirst({where: {adminId, name: c.name}, select: {id: true}});
        if (existing) {
            courseId[c.name] = existing.id;
            continue;
        }
        const created = await prisma.onlineCourse.create({
            data: {
                ...data,
                adminId,
                categoryId: cat[category],
                status: 'PUBLIC',
                sections: {
                    create: sections.map(([title, lessons], si) => ({
                        title,
                        order: si,
                        lessons: {
                            create: lessons.map((t, li) => ({
                                title: t,
                                order: li,
                                durationMinutes: 15 + ((si * 7 + li * 11) % 30),
                                isPreview: si === 0 && li === 0,
                            })),
                        },
                    })),
                },
            },
        });
        courseId[c.name] = created.id;
    }
    console.log(`  courses: ${COURSES.length} ready`);

    // Bundles
    for (const b of BUNDLES) {
        const {courses, ...data} = b;
        if (await prisma.bundle.findFirst({where: {adminId, name: b.name}, select: {id: true}})) continue;
        await prisma.bundle.create({
            data: {...data, adminId, isActive: true, courses: {create: courses.map((n) => ({courseId: courseId[n]}))}},
        });
    }
    console.log(`  bundles: ${BUNDLES.length} ready`);

    // Blogs
    for (const b of BLOGS) {
        const {daysAgo, ...data} = b;
        await prisma.blog.upsert({
            where: {adminId_slug: {adminId, slug: b.slug}},
            create: {...data, adminId, author: 'MedCode Ninja Team', isPublished: true, publishedAt: new Date(Date.now() - daysAgo * 86400000)},
            update: {},
        });
    }
    console.log(`  blogs: ${BLOGS.length} ready`);
}

main()
    .catch((e) => {
        console.error(e.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
