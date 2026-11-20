/**
 * Demo data for the admin panel.
 *
 *   npm run seed:demo            -> creates the demo institute if it does not exist
 *   npm run seed:demo -- --reset -> deletes the demo institute's data and recreates it
 *
 * Every record belongs to one demo Admin (institute), so it never touches other institutes.
 */
import {PrismaClient, Role, BatchType, LeadStatus, Interested, InterviewStatus, paymentType} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_ADMIN = {
    username: '9123456780',
    password: 'Pass@123',
    email: 'demo.admin@medcodeninja.com',
    fullname: 'MedCode Demo Institute',
};
const TEACHER_PASSWORD = 'Teacher@123';
const STUDENT_PASSWORD = 'Student@123';

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const hash = (p: string) => bcrypt.hash(p, 10);

async function resetDemo(adminId: string, adminUserId: string) {
    const batches = (await prisma.batch.findMany({where: {adminId}, select: {id: true}})).map((b) => b.id);
    const students = (await prisma.student.findMany({where: {adminId}, select: {id: true, userId: true}}));
    const teachers = (await prisma.teacher.findMany({where: {adminId}, select: {id: true, userId: true}}));
    const studentIds = students.map((s) => s.id);
    const exams = (await prisma.exam.findMany({where: {adminId}, select: {id: true}})).map((e) => e.id);
    const placements = (await prisma.placement.findMany({where: {adminId}, select: {id: true}})).map((p) => p.id);
    const accounts = (await prisma.accounts.findMany({where: {adminId}, select: {id: true}})).map((a) => a.id);
    const courses = (await prisma.course.findMany({where: {adminId}, select: {id: true}})).map((c) => c.id);

    // Children first, parents last
    await prisma.$transaction([
        prisma.studentExamSubmitted.deleteMany({where: {result: {examId: {in: exams}}}}),
        prisma.examResults.deleteMany({where: {OR: [{examId: {in: exams}}, {studentId: {in: studentIds}}]}}),
        prisma.examQuestions.deleteMany({where: {examId: {in: exams}}}),
        prisma.examBatches.deleteMany({where: {OR: [{examId: {in: exams}}, {batchId: {in: batches}}]}}),
        prisma.exam.deleteMany({where: {id: {in: exams}}}),
        prisma.taskCompletion.deleteMany({where: {studentId: {in: studentIds}}}),
        prisma.dailyTasks.deleteMany({where: {batchId: {in: batches}}}),
        prisma.assignmentCompletion.deleteMany({where: {studentId: {in: studentIds}}}),
        prisma.assignment.deleteMany({where: {batchId: {in: batches}}}),
        prisma.attendanceEntry.deleteMany({where: {attendance: {batchId: {in: batches}}}}),
        prisma.attendance.deleteMany({where: {batchId: {in: batches}}}),
        prisma.placementInterview.deleteMany({where: {placementId: {in: placements}}}),
        prisma.placementStudent.deleteMany({where: {placementId: {in: placements}}}),
        prisma.placement.deleteMany({where: {id: {in: placements}}}),
        prisma.leadFollowUp.deleteMany({where: {lead: {courseId: {in: courses}}}}),
        prisma.lead.deleteMany({where: {courseId: {in: courses}}}),
        prisma.feesCollect.deleteMany({where: {studentId: {in: studentIds}}}),
        prisma.feeFollowup.deleteMany({where: {studentId: {in: studentIds}}}),
        prisma.expenditure.deleteMany({where: {adminId}}),
        prisma.accountHistory.deleteMany({where: {accountId: {in: accounts}}}),
        prisma.accounts.deleteMany({where: {id: {in: accounts}}}),
        prisma.batchStudents.deleteMany({where: {batchId: {in: batches}}}),
        prisma.student.updateMany({where: {adminId}, data: {feeOptionId: null, referId: null}}),
        prisma.feeInstallments.deleteMany({where: {feeOption: {batchId: {in: batches}}}}),
        prisma.feeOptions.deleteMany({where: {batchId: {in: batches}}}),
        prisma.teachingDays.deleteMany({where: {batchId: {in: batches}}}),
        prisma.batch.deleteMany({where: {id: {in: batches}}}),
        prisma.student.deleteMany({where: {adminId}}),
        prisma.subject.deleteMany({where: {adminId}}),
        prisma.teacher.deleteMany({where: {adminId}}),
        prisma.course.deleteMany({where: {adminId}}),
        prisma.admin.delete({where: {id: adminId}}),
        prisma.user.deleteMany({
            where: {id: {in: [adminUserId, ...students.map((s) => s.userId), ...teachers.map((t) => t.userId)]}},
        }),
    ]);
}

async function main() {
    const reset = process.argv.includes('--reset');

    const existing = await prisma.user.findUnique({
        where: {username: DEMO_ADMIN.username},
        include: {institute: true},
    });
    if (existing) {
        if (!reset) {
            console.log(`Demo institute already exists (login ${DEMO_ADMIN.username}). Use --reset to recreate it.`);
            return;
        }
        if (!existing.institute) throw new Error(`User ${DEMO_ADMIN.username} exists but is not an institute admin`);
        console.log('Removing existing demo data...');
        await resetDemo(existing.institute.id, existing.id);
    }

    const [adminPw, teacherPw, studentPw] = await Promise.all([
        hash(DEMO_ADMIN.password),
        hash(TEACHER_PASSWORD),
        hash(STUDENT_PASSWORD),
    ]);

    // ---------- Institute admin ----------
    const adminUser = await prisma.user.create({
        data: {
            username: DEMO_ADMIN.username,
            email: DEMO_ADMIN.email,
            fullname: DEMO_ADMIN.fullname,
            phoneNumber: DEMO_ADMIN.username,
            password: adminPw,
            role: Role.ADMIN,
        },
    });
    const admin = await prisma.admin.create({
        data: {
            userId: adminUser.id,
            adminId: 'MCN-DEMO-01',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            pincode: '411004',
            address: '2nd Floor, Shivaji Nagar, FC Road',
            tagLine: 'Learn medical coding the right way',
            gst: '27ABCDE1234F1Z5',
        },
    });
    const adminId = admin.id;

    // ---------- Accounts ----------
    const cash = await prisma.accounts.create({data: {name: 'Cash', adminId, balance: 0}});
    const bank = await prisma.accounts.create({data: {name: 'HDFC Bank', adminId, balance: 0}});
    const balances: Record<string, number> = {[cash.id]: 0, [bank.id]: 0};
    const ledger = async (accountId: string, amount: number, type: paymentType, notes: string) => {
        balances[accountId] += type === paymentType.CREDIT ? amount : -amount;
        await prisma.accountHistory.create({
            data: {accountId, amount, type, notes, afterWalletBalance: balances[accountId]},
        });
    };
    await ledger(bank.id, 150000, paymentType.CREDIT, 'Opening balance');
    await ledger(cash.id, 20000, paymentType.CREDIT, 'Opening balance');

    // ---------- Teachers ----------
    const teacherData = [
        {fullname: 'Dr. Priya Sharma', phone: '9811111101', subject: 'Medical Terminology', salary: 45000},
        {fullname: 'Rahul Deshmukh', phone: '9811111102', subject: 'ICD-10-CM Coding', salary: 40000},
        {fullname: 'Sneha Kulkarni', phone: '9811111103', subject: 'CPT & HCPCS', salary: 38000},
    ];
    const teachers = [];
    for (const t of teacherData) {
        const user = await prisma.user.create({
            data: {
                username: t.phone,
                phoneNumber: t.phone,
                email: `${t.fullname.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@medcodeninja.com`,
                fullname: t.fullname,
                password: teacherPw,
                role: Role.TEACHER,
            },
        });
        teachers.push(
            await prisma.teacher.create({
                data: {
                    userId: user.id,
                    adminId,
                    address: 'Pune, Maharashtra',
                    subject: t.subject,
                    salary: t.salary,
                    emergencyContact: 'Family',
                    emergencyContactNumber: '9822222200',
                    Relationship: 'Spouse',
                },
            }),
        );
    }

    // ---------- Courses & subjects ----------
    const courseNames = ['Certified Professional Coder (CPC)', 'Medical Billing & Coding', 'ICD-10-CM Advanced'];
    const courses = [];
    for (const name of courseNames) courses.push(await prisma.course.create({data: {name, adminId}}));

    const subjectNames = ['Anatomy & Physiology', 'Medical Terminology', 'ICD-10-CM', 'CPT', 'HCPCS Level II'];
    const subjects = [];
    for (const [i, name] of subjectNames.entries()) {
        subjects.push(
            await prisma.subject.create({data: {name, adminId, teacherId: teachers[i % teachers.length].id}}),
        );
    }

    // ---------- Batches (+ teaching days, fee options) ----------
    const batchData = [
        {name: 'CPC Morning Batch - Jan', course: 0, teacher: 0, type: BatchType.OFFLINE, start: -60, end: 120, st: '09:00', et: '11:00', fee: 45000},
        {name: 'Billing Evening Batch', course: 1, teacher: 1, type: BatchType.ONLINE, start: -30, end: 90, st: '18:00', et: '20:00', fee: 35000},
        {name: 'ICD-10 Weekend Batch', course: 2, teacher: 2, type: BatchType.OFFLINE, start: 7, end: 97, st: '10:00', et: '14:00', fee: 25000},
    ];
    const batches: Awaited<ReturnType<typeof prisma.batch.create>>[] = [];
    const feeOptionByBatch: string[] = [];
    for (const b of batchData) {
        const batch = await prisma.batch.create({
            data: {
                name: b.name,
                courseId: courses[b.course].id,
                teacherId: teachers[b.teacher].id,
                adminId,
                batchType: b.type,
                type: b.type,
                startDate: days(b.start),
                endDate: days(b.end),
                startTime: b.st,
                endTime: b.et,
                totalDays: b.end - b.start,
                educationalDays: Math.round(((b.end - b.start) * 5) / 7),
                referalBonus: 1000,
            },
        });
        const weekend = b.name.includes('Weekend');
        await prisma.teachingDays.create({
            data: weekend
                ? {batchId: batch.id, saturday: true, sunday: true}
                : {batchId: batch.id, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true},
        });
        const feeOption = await prisma.feeOptions.create({
            data: {
                name: '3 Installments',
                batchId: batch.id,
                feeInstallments: {
                    create: [
                        {name: 'Admission', amount: b.fee * 0.4},
                        {name: 'Installment 2', amount: b.fee * 0.3},
                        {name: 'Installment 3', amount: b.fee * 0.3},
                    ],
                },
            },
        });
        await prisma.feeOptions.create({
            data: {name: 'One-time Payment', batchId: batch.id, feeInstallments: {create: [{name: 'Full Fee', amount: b.fee}]}},
        });
        batches.push(batch);
        feeOptionByBatch.push(feeOption.id);
    }

    // ---------- Students ----------
    const studentNames = [
        'Aarav Patil', 'Ananya Joshi', 'Rohan Gupta', 'Isha Verma', 'Karan Mehta', 'Pooja Nair',
        'Siddharth Rao', 'Neha Pawar', 'Vikram Singh', 'Riya Kapoor', 'Aditya Jadhav', 'Sakshi More',
    ];
    const colleges = ['Fergusson College', 'MIT College', 'Symbiosis', 'Modern College', 'DY Patil'];
    const students = [];
    for (const [i, fullname] of studentNames.entries()) {
        const batchIdx = i % 3;
        const totalFees = batchData[batchIdx].fee;
        const paid = [totalFees, totalFees * 0.7, totalFees * 0.4, 0][i % 4];
        const phone = `97000000${String(i + 10).padStart(2, '0')}`;
        const user = await prisma.user.create({
            data: {
                username: phone,
                phoneNumber: phone,
                email: `${fullname.toLowerCase().replace(' ', '.')}@example.com`,
                fullname,
                password: studentPw,
                role: Role.STUDENT,
            },
        });
        const student = await prisma.student.create({
            data: {
                userId: user.id,
                adminId,
                teacherId: teachers[batchIdx].id,
                city: 'Pune',
                state: 'Maharashtra',
                country: 'India',
                pincode: '4110' + String(10 + i),
                address: `Flat ${i + 1}, Kothrud`,
                qualification: i % 2 ? 'B.Sc Nursing' : 'B.Pharm',
                collegeName: colleges[i % colleges.length],
                feeOptionId: feeOptionByBatch[batchIdx],
                totalFees,
                paidFees: paid,
                pendingFees: totalFees - paid,
                totalPaidFees: paid,
                totalPendingFees: totalFees - paid,
                followUpDate: paid < totalFees ? days(7 + i) : null,
                createdAt: days(-50 + i * 3),
            },
        });
        await prisma.batchStudents.create({data: {batchId: batches[batchIdx].id, studentId: student.id}});

        if (paid > 0) {
            const accountId = i % 2 ? cash.id : bank.id;
            await prisma.feesCollect.create({
                data: {studentId: student.id, amount: paid, pendingAmount: totalFees - paid, accountId, teacherId: teachers[batchIdx].id},
            });
            await ledger(accountId, paid, paymentType.CREDIT, `Fee collected - ${fullname}`);
        }
        if (paid < totalFees) {
            await prisma.feeFollowup.create({
                data: {
                    studentId: student.id,
                    amount: Math.min(totalFees - paid, totalFees * 0.3),
                    pendingAmount: totalFees - paid,
                    notes: 'Promised to pay next installment',
                    followUpDate: days(7 + i),
                    teacherId: teachers[batchIdx].id,
                },
            });
        }
        students.push({student, batchIdx});
    }
    // One referral
    await prisma.student.update({where: {id: students[5].student.id}, data: {referId: students[0].student.id}});
    await prisma.student.update({where: {id: students[0].student.id}, data: {referrals: 1, referAmount: 1000}});

    // ---------- Leads ----------
    const leadData: [string, LeadStatus, Interested, string][] = [
        ['Manish Kale', LeadStatus.NEW, Interested.WARM, 'Instagram'],
        ['Tanvi Shah', LeadStatus.CONTACTED, Interested.WIN, 'Walk-in'],
        ['Omkar Bhosale', LeadStatus.IN_PROGRESS, Interested.WARM, 'Google'],
        ['Priyanka Iyer', LeadStatus.CONVERTED, Interested.WIN, 'Referral'],
        ['Harsh Agarwal', LeadStatus.LOST, Interested.COLD, 'Facebook'],
        ['Divya Menon', LeadStatus.NEW, Interested.COLD, 'Website'],
        ['Yash Chavan', LeadStatus.CONTACTED, Interested.WARM, 'Instagram'],
        ['Kavya Reddy', LeadStatus.IN_PROGRESS, Interested.WIN, 'Seminar'],
    ];
    for (const [i, [name, status, interested, source]] of leadData.entries()) {
        await prisma.lead.create({
            data: {
                name,
                phoneNumber: `96000000${String(i + 10)}`,
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                source,
                status,
                interested,
                courseId: courses[i % 3].id,
                batchId: batches[i % 3].id,
                teacherId: teachers[i % 3].id,
                mode: i % 2 ? BatchType.ONLINE : BatchType.OFFLINE,
                collegeName: colleges[i % colleges.length],
                qualification: 'Graduate',
                degree: i % 2 ? 'B.Sc' : 'B.Pharm',
                referId: source === 'Referral' ? students[0].student.id : null,
                leadFollowUps: {
                    create: [
                        {note: 'Called, shared course brochure', nextFollowUpDate: days(2 + i), teacherId: teachers[i % 3].id},
                    ],
                },
            },
        });
    }

    // ---------- Exams ----------
    const questions = [
        ['Which code set is used for diagnoses?', 'CPT', 'ICD-10-CM', 'HCPCS', 'NDC', 'B'],
        ['CPT codes are maintained by?', 'WHO', 'CMS', 'AMA', 'HHS', 'C'],
        ['The suffix "-itis" means?', 'Inflammation', 'Removal', 'Pain', 'Tumor', 'A'],
        ['HCPCS Level II codes begin with?', 'A number', 'A letter', 'A symbol', 'Zero', 'B'],
        ['"Cardio" refers to?', 'Lungs', 'Liver', 'Heart', 'Kidney', 'C'],
    ];
    const examDefs = [
        {name: 'Medical Terminology Test 1', course: 0, subject: 1, batches: [0, 1]},
        {name: 'ICD-10 Basics Quiz', course: 2, subject: 2, batches: [0]},
    ];
    for (const e of examDefs) {
        const exam = await prisma.exam.create({
            data: {
                adminId,
                name: e.name,
                title: e.name,
                courseId: courses[e.course].id,
                subjectId: subjects[e.subject].id,
                marks: questions.length,
                hours: 0,
                minutes: 30,
                examQuestions: {
                    create: questions.map(([question, optionA, optionB, optionC, optionD, answer]) => ({
                        question, optionA, optionB, optionC, optionD, answer, marks: 1,
                    })),
                },
                examBatches: {create: e.batches.map((b) => ({batchId: batches[b].id}))},
            },
        });
        // Results for students in the first assigned batch
        const takers = students.filter((s) => s.batchIdx === e.batches[0]);
        for (const [k, {student}] of takers.entries()) {
            const correct = Math.max(1, questions.length - k);
            await prisma.examResults.create({
                data: {
                    examId: exam.id,
                    studentId: student.id,
                    marks: correct,
                    correctAnswer: correct,
                    wrongAnswer: questions.length - correct,
                    totalAnswer: questions.length,
                    percentage: (correct / questions.length) * 100,
                    remarks: correct >= 4 ? 'Excellent' : correct >= 3 ? 'Good' : 'Needs improvement',
                },
            });
            await prisma.student.update({where: {id: student.id}, data: {totalExams: {increment: 1}}});
        }
    }

    // ---------- Daily tasks, assignments, attendance ----------
    for (const [bi, batch] of batches.slice(0, 2).entries()) {
        const batchStudentsList = students.filter((s) => s.batchIdx === bi);
        for (let d = 0; d < 3; d++) {
            const task = await prisma.dailyTasks.create({
                data: {
                    batchId: batch.id,
                    topic: ['Introduction to coding', 'Body systems overview', 'Coding guidelines'][d],
                    task: 'Read the chapter and solve the practice questions',
                    date: days(-3 + d),
                },
            });
            for (const {student} of batchStudentsList) {
                await prisma.taskCompletion.create({data: {taskId: task.id, studentId: student.id, completed: d < 2}});
            }
        }
        const assignment = await prisma.assignment.create({
            data: {
                batchId: batch.id,
                name: 'Case Study 1',
                description: 'Code the attached 10 outpatient charts',
                deadline: days(5),
            },
        });
        for (const [k, {student}] of batchStudentsList.entries()) {
            await prisma.assignmentCompletion.create({
                data: {taskId: assignment.id, studentId: student.id, completed: k % 2 === 0},
            });
        }
        for (let d = 1; d <= 2; d++) {
            const present = batchStudentsList.filter((_, k) => (k + d) % 4 !== 0);
            await prisma.attendance.create({
                data: {
                    batchId: batch.id,
                    teacherId: batch.teacherId,
                    totalStudent: batchStudentsList.length,
                    presentStudent: present.length,
                    absentStudent: batchStudentsList.length - present.length,
                    createdAt: days(-d),
                    attendanceEntries: {create: present.map(({student}) => ({studentId: student.id}))},
                },
            });
        }
    }

    // ---------- Placements ----------
    const placementDefs = [
        {companyName: 'Omega Healthcare', jobRole: 'Medical Coder', salary: '2.4 - 3.0 LPA', location: 'Pune'},
        {companyName: 'Access Healthcare', jobRole: 'AR Caller', salary: '2.0 - 2.6 LPA', location: 'Mumbai'},
    ];
    for (const [pi, p] of placementDefs.entries()) {
        const placement = await prisma.placement.create({
            data: {
                ...p,
                adminId,
                qualification: 'Any life-science graduate',
                experience: 'Fresher',
                interviewMode: pi ? 'Online' : 'Walk-in',
                workSchedule: 'Day shift, 5 days',
                interviewDate: days(10 + pi * 5),
                deadLine: days(8 + pi * 5),
                requiredSkills: 'ICD-10, CPT, communication',
                jobDescription: `${p.jobRole} position for freshers`,
            },
        });
        for (const {student} of students.slice(pi * 3, pi * 3 + 3)) {
            await prisma.placementStudent.create({
                data: {placementId: placement.id, studentId: student.id, isApplied: true, isInterview: pi === 0},
            });
        }
        if (pi === 0) {
            const statuses = [InterviewStatus.PLACED, InterviewStatus.SCHEDULED, InterviewStatus.COMPLETED];
            for (const [k, {student}] of students.slice(0, 3).entries()) {
                await prisma.placementInterview.create({
                    data: {
                        placementId: placement.id,
                        studentId: student.id,
                        interviewDate: days(k - 1),
                        interviewMode: 'Walk-in',
                        location: 'Omega Healthcare, Hinjewadi',
                        status: statuses[k],
                    },
                });
                await prisma.student.update({where: {id: student.id}, data: {interviewsGiven: {increment: 1}}});
            }
        }
    }

    // ---------- Expenditures ----------
    const expenses: [string, number, number, string][] = [
        ['Office Rent', 25000, -25, 'bank'],
        ['Electricity Bill', 4200, -18, 'cash'],
        ['Facebook Ads', 8000, -10, 'bank'],
        ['Stationery & Printing', 1800, -4, 'cash'],
    ];
    for (const [title, amount, d, acc] of expenses) {
        const accountId = acc === 'bank' ? bank.id : cash.id;
        await prisma.expenditure.create({data: {title, amount, date: days(d), adminId, accountId, description: title}});
        await ledger(accountId, amount, paymentType.DEBIT, `Expense - ${title}`);
    }
    await prisma.accounts.update({where: {id: cash.id}, data: {balance: balances[cash.id]}});
    await prisma.accounts.update({where: {id: bank.id}, data: {balance: balances[bank.id]}});

    console.log('Demo institute created:');
    console.log(`  Admin login    : ${DEMO_ADMIN.username} / ${DEMO_ADMIN.password}`);
    console.log(`  Teacher logins : ${teacherData.map((t) => t.phone).join(', ')} / ${TEACHER_PASSWORD}`);
    console.log(`  Student logins : 9700000010 ... 9700000021 / ${STUDENT_PASSWORD}`);
    console.log(
        `  ${teachers.length} teachers, ${courses.length} courses, ${subjects.length} subjects, ${batches.length} batches, ` +
            `${students.length} students, ${leadData.length} leads, ${examDefs.length} exams, ${placementDefs.length} placements, ` +
            `${expenses.length} expenditures, 2 accounts`,
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
