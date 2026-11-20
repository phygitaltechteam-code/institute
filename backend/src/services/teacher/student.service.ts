import prisma from '@client';
import studentService from '../admin/student.service';
import {studentValidation} from '@validations/index';
import {z} from 'zod';
import {Prisma, Student} from '@prisma/client';
import {computeStudentFees} from '@utils/fees';
import {ApiError, encryptPassword} from '@utils/index';
import httpStatus from 'http-status';

type PaginateStudents = z.infer<typeof studentValidation.paginateStudentsSchema>;
type collectReferal = z.infer<typeof studentValidation.referCollect>;
type UpdateStudentData = z.infer<typeof studentValidation.updateStudentSchema>;

// type createStudent = z.infer<typeof studentValidation.registerStudentSchema>;

class TeacherStudentService {
    private async handleStudentNotFound(student: Student | null) {
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }
    }
    async registerStudent(
        adminId: string,
        data: z.infer<typeof studentValidation.registerStudentSchema>,
        teacherId: string,
    ) {
        return studentService.registerStudent(adminId, data, teacherId);
    }

    async getStudents(teacherId: string, query: PaginateStudents) {
        const {page, limit, searchTerm, placementReceived, internship} = query;

        const where: Prisma.StudentWhereInput = {
            teacherId,
        };

        if (placementReceived) {
            where.placementReceived = {contains: placementReceived, mode: 'insensitive'};
        }
        if (internship) {
            where.internship = {contains: internship, mode: 'insensitive'};
        }

        if (searchTerm) {
            where.OR = [
                {
                    user: {
                        OR: [
                            {fullname: {contains: searchTerm, mode: 'insensitive'}},
                            {phoneNumber: {contains: searchTerm, mode: 'insensitive'}},
                            {email: {contains: searchTerm, mode: 'insensitive'}},
                        ],
                    },
                },
                {city: {contains: searchTerm, mode: 'insensitive'}},
                {state: {contains: searchTerm, mode: 'insensitive'}},
            ];
        }
        const [students, totalItems] = await Promise.all([
            prisma.student.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    _count: {
                        select: {
                            attendanceEntries: true,
                            placementInterviews: true,
                            examResults: true,
                        },
                    },
                    feeFollowups: {
                        take: 1,
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullname: true,
                                    phoneNumber: true,
                                    email: true,
                                    username: true,
                                    role: true,
                                    isActive: true,
                                },
                            },
                        },
                    },

                    user: {
                        select: {
                            id: true,
                            fullname: true,
                            phoneNumber: true,
                            email: true,
                            username: true,
                            role: true,
                            isActive: true,
                        },
                    },
                    batchStudents: {
                        include: {
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    batchType: true,
                                    _count: {
                                        select: {
                                            attendances: true,
                                            examBatches: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.student.count({
                where,
            }),
        ]);
        return {
            data: students,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }
    async getStudentById(id: string, adminId: string) {
        const student = await prisma.student.findFirst({
            where: {
                id,
                adminId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        phoneNumber: true,
                        email: true,
                        username: true,
                        role: true,
                        isActive: true,
                    },
                },
                batchStudents: {
                    include: {
                        batch: true,
                    },
                },
                examResults: {
                    include: {
                        exam: true,
                    },
                },
                placementStudents: {
                    include: {
                        placement: true,
                    },
                },
            },
        });
        // await this.handleStudentNotFound(student);
        return student;
    }

    async updateStudent(id: string, adminId: string, data: UpdateStudentData) {
        const student = await prisma.student.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleStudentNotFound(student);

        const {
            fullname,
            phoneNumber,
            city,
            state,
            logo,
            tagLine,
            pin,
            gst,
            country,
            collegeName,
            discount,
            qualification,

            feeOptionId,

            referId,
            pinCode,
            totalFees,
            pincode,
            address,

            paidFees,
            pendingFees,
        } = data;

        const studentUpdate: Prisma.StudentUncheckedUpdateInput = {};
        const userUpdate: Prisma.UserUpdateInput = {};

        // Map student specific fields
        if (city !== undefined) studentUpdate.city = city;
        if (state !== undefined) studentUpdate.state = state;
        if (logo !== undefined) studentUpdate.logo = logo;
        if (tagLine !== undefined) studentUpdate.tagLine = tagLine;
        if (pin !== undefined) studentUpdate.pin = pin;
        if (gst !== undefined) studentUpdate.gst = gst;
        if (country !== undefined) studentUpdate.country = country;
        if (pincode !== undefined) studentUpdate.pincode = pincode;
        if (address !== undefined) studentUpdate.address = address;
        if (qualification !== undefined) studentUpdate.qualification = qualification;
        if (collegeName !== undefined) studentUpdate.collegeName = collegeName;
        if (feeOptionId !== undefined) studentUpdate.feeOptionId = feeOptionId;
        if (referId !== undefined) studentUpdate.referId = referId;
        if (pinCode !== undefined) studentUpdate.pinCode = pinCode;
        if (totalFees !== undefined) studentUpdate.totalFees = totalFees;
        if (pincode !== undefined) studentUpdate.pincode = pincode;
        if (address !== undefined) studentUpdate.address = address;
        if (discount !== undefined) studentUpdate.discount = discount;
        // Any change to total, discount or paid recalculates pending from the merged values
        if (totalFees !== undefined || discount !== undefined || paidFees !== undefined) {
            const fees = computeStudentFees(
                totalFees ?? student!.totalFees ?? 0,
                discount ?? student!.discount ?? 0,
                paidFees ?? student!.paidFees ?? 0,
            );
            studentUpdate.paidFees = fees.paid;
            studentUpdate.totalPaidFees = fees.paid;
            studentUpdate.pendingFees = fees.pending;
            studentUpdate.totalPendingFees = fees.pending;
        } else if (pendingFees !== undefined) {
            studentUpdate.pendingFees = pendingFees;
        }
        // if (phoneNumber !== undefined) userUpdate.username = phoneNumber;
        // Map user specific fields
        if (fullname !== undefined) userUpdate.fullname = fullname;
        if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber;
        if (data.password) userUpdate.password = await encryptPassword(data.password);
        if (phoneNumber !== undefined) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phoneNumber,
                },
            });
            if (existingUser && existingUser.id !== student?.userId) {
                throw new ApiError(400, 'User with this phone number already exists');
            }
        }

        // Perform update in a transaction to update both user and student tables
        return prisma.$transaction(async (tx) => {
            if (Object.keys(userUpdate).length > 0) {
                await tx.user.update({
                    where: {id: student!.userId},
                    data: userUpdate,
                });
            }
            if (data.batchId) {
                await tx.batchStudents.deleteMany({
                    where: {studentId: id},
                });
                await tx.batchStudents.create({
                    data: {studentId: id, batchId: data.batchId},
                });
            }

            return tx.student.update({
                where: {id},
                data: studentUpdate,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullname: true,
                            phoneNumber: true,
                            email: true,
                            username: true,
                        },
                    },
                },
            });
        });
    }

    async deleteStudent(id: string, adminId: string) {
        const student = await prisma.student.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleStudentNotFound(student);

        // Delete nested relations if needed or let database handle it.
        // We delete Student and then their User profile.
        return prisma.$transaction(async (tx) => {
            // Remove from batch relations
            await tx.batchStudents.deleteMany({
                where: {studentId: id},
            });
            // Remove from exam results
            await tx.examResults.deleteMany({
                where: {studentId: id},
            });
            // Remove task completions
            await tx.taskCompletion.deleteMany({
                where: {studentId: id},
            });
            // Remove placement applications
            await tx.placementStudent.deleteMany({
                where: {studentId: id},
            });

            // Delete Student profile
            await tx.student.delete({
                where: {id},
            });

            // Delete User record
            return tx.user.delete({
                where: {id: student!.userId},
            });
        });
    }
    async collectReferal(studentId: string, data: collectReferal) {
        const student = await prisma.student.findUnique({
            where: {
                id: studentId,
            },
            select: {
                pendingFees: true,
                paidFees: true,
                referAmount: true,
                adminId: true,
            },
        });

        if (!student) {
            throw new ApiError(404, 'Student not found');
        }

        const referAmount = student.referAmount || 0;
        const pendingFees = student.pendingFees || 0;

        if (referAmount <= 0) {
            throw new ApiError(400, 'No referral amount available to collect');
        }

        // Pending fees can cover the complete referral amount
        if (pendingFees >= referAmount) {
            await prisma.student.update({
                where: {
                    id: studentId,
                },
                data: {
                    referAmount: 0,
                    pendingFees: {
                        decrement: referAmount,
                    },
                    paidFees: {
                        increment: referAmount,
                    },
                },
            });
        } else {
            // Pending fees < referral amount
            const remainingAmount = referAmount - pendingFees;

            if (!data.accountId) {
                throw new ApiError(
                    400,
                    'Account ID is required when referral amount exceeds pending fees',
                );
            }

            await prisma.$transaction(async (tx) => {
                // 1. Update student
                await tx.student.update({
                    where: {
                        id: studentId,
                    },
                    data: {
                        referAmount: 0,
                        pendingFees: 0,
                        paidFees: {
                            increment: pendingFees,
                        },
                    },
                });

                // 2. Deduct remaining amount from account
                const account = await tx.accounts.update({
                    where: {
                        id: data.accountId || '',
                    },
                    data: {
                        balance: {
                            decrement: remainingAmount,
                        },
                    },
                });

                // 3. Create account history
                await tx.accountHistory.create({
                    data: {
                        accountId: data.accountId || '',
                        amount: -remainingAmount,
                        type: 'DEBIT',
                        notes: 'Referral Amount Collected',
                        // adminId: student.adminId,
                        afterWalletBalance: account.balance,
                    },
                });
            });
        }

        return {
            message: 'Referral Amount Collected Successfully',
            success: true,
            statusCode: 200,
        };
    }
}

export default new TeacherStudentService();
