import {Prisma, Role, Teacher} from '@prisma/client';
import prisma from '@client';
import {ApiError} from '@utils/index';
import {teacherValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {userService} from '@services/index';

type AddTeacherData = z.infer<typeof teacherValidation.registerTeacherSchema>;
type PaginateTeachers = z.infer<typeof teacherValidation.paginateTeachersSchema>;
type TeacherWithUser = Prisma.TeacherGetPayload<{
    include: {
        user: {
            select: {
                username: true;
                email: true;
                fullname: true;
                phoneNumber: true;
                secondaryPhoneNumber: true;
            };
        };
    };
}>;
// type UpdateTeacherData = z.infer<typeof teacherValidation.updateTeacherSchema>;

class TeacherService {
    private buildUserData(data: AddTeacherData) {
        return {
            username: data.username,
            email: data.email,
            fullname: data.fullname,
            password: data.password,
            phoneNumber: data.phoneNumber,
            role: Role.TEACHER,
        };
    }

    private buildTeacherData(data: AddTeacherData, userId: string) {
        return {
            userId,
            address: data.address,
            subject: data.subject,
            salary: data.salary,
            adharcard: data.adharcard,
            addressProof: data.addressProof,
            panproof: data.panproof,
            emergencyContact: data.emergencyContact,
            Relationship: data.Relationship,
            emergencyContactNumber: data.emergencyContactNumber,
        };
    }

    private async handleTeacherNotFound(teacher: Teacher | null) {
        if (!teacher) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
        }
    }

    private formatTeacher(teacher: TeacherWithUser) {
        const {user, ...teacherData} = teacher;
        return {...teacherData, ...user};
    }

    async registerTeacher(adminId: string, data: AddTeacherData) {
        const userData = this.buildUserData(data);

        const newTeacher = await prisma.$transaction(async (tx) => {
            const user = await userService.registerUser(userData);
            const teacherData = this.buildTeacherData(data, user.id);
            const teacher = await tx.teacher.create({
                data: {...teacherData, adminId},
            });

            return teacher;
        });

        return newTeacher;
    }

    async getTeachers(query: PaginateTeachers) {
        const {page, limit, searchTerm} = query;

        const [teachers, totalItems, activeCount, totalCount] = await Promise.all([
            prisma.teacher.findMany({
                where: {
                    user: {
                        isActive: true,
                        fullname: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    batches: true,
                    user: {
                        select: {
                            username: true,
                            email: true,
                            fullname: true,
                            phoneNumber: true,
                            secondaryPhoneNumber: true,
                        },
                    },
                },
            }),
            prisma.teacher.count({
                where: {
                    user: {
                        isActive: true,
                        fullname: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                },
            }),
            prisma.teacher.count({
                where: {
                    user: {
                        isActive: true,
                    },
                },
            }),
            prisma.teacher.count(),
        ]);

        const formattedData = teachers.map(this.formatTeacher.bind(this));
        return {
            data: formattedData,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            activeCount,
            totalCount,
        };
    }

    async getTeacherById(id: string) {
        const teacher = await prisma.teacher.findUnique({
            where: {id},
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        secondaryPhoneNumber: true,
                    },
                },
            },
        });

        this.handleTeacherNotFound(teacher);
        return this.formatTeacher(teacher!);
    }

    async updateTeacher(
        id: string,
        data: {
            fullname?: string;
            phoneNumber?: string;
            secondaryPhoneNumber?: string | null;
            address?: string;
            subject?: string | null;
            salary?: number | null;
            adharcard?: string | null;
            addressProof?: string | null;
            panproof?: string | null;
            emergencyContact?: string | null;
            Relationship?: string | null;
            emergencyContactNumber?: string | null;
        },
    ) {
        const updatedTeacher = await prisma.teacher.update({
            where: {id},
            data: {
                address: data.address,
                subject: data.subject,
                salary: data.salary,
                adharcard: data.adharcard !== undefined ? data.adharcard : undefined,
                addressProof: data.addressProof !== undefined ? data.addressProof : undefined,
                panproof: data.panproof !== undefined ? data.panproof : undefined,
                emergencyContact: data.emergencyContact,
                Relationship: data.Relationship,
                emergencyContactNumber: data.emergencyContactNumber,
                user: {
                    update: {
                        username: data.phoneNumber,
                        fullname: data.fullname,
                        phoneNumber: data.phoneNumber,
                        secondaryPhoneNumber: data.secondaryPhoneNumber,
                    },
                },
            },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        secondaryPhoneNumber: true,
                    },
                },
            },
        });

        return updatedTeacher;
    }

    async deleteTeacher(id: string) {
        const teacher = await prisma.teacher.findUnique({where: {id}});
        this.handleTeacherNotFound(teacher);

        return await prisma.$transaction(async (tx) => {
            await tx.teacher.delete({where: {id}});
            await tx.user.update({
                where: {id: teacher!.userId},
                data: {deletedAt: new Date()},
            });
            return teacher;
        });
    }
}

export default new TeacherService();
