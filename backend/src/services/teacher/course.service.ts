import prisma from '@client';
import {ApiError} from '@utils/index';
import {courseValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateCourseData = z.infer<typeof courseValidation.createCourseSchema>;
type UpdateCourseData = z.infer<typeof courseValidation.updateCourseSchema>;
type PaginateCourses = z.infer<typeof courseValidation.paginateCourseSchema>;

class CourseService {
    private async handleCourseNotFound(course: any) {
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }
    }

    async createCourse(adminId: string, data: CreateCourseData) {
        return prisma.course.create({
            data: {
                ...data,
                adminId,
            },
        });
    }

    async getCourses(adminId: string, query: PaginateCourses) {
        const {page, limit, searchTerm} = query;

        const [courses, totalItems] = await Promise.all([
            prisma.course.findMany({
                where: {
                    adminId,
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    name: 'asc',
                },
            }),
            prisma.course.count({
                where: {
                    adminId,
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            }),
        ]);

        return {
            data: courses,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getCourseById(id: string, adminId: string) {
        const course = await prisma.course.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleCourseNotFound(course);
        return course;
    }

    async updateCourse(id: string, adminId: string, data: UpdateCourseData) {
        const course = await prisma.course.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleCourseNotFound(course);

        return prisma.course.update({
            where: {id},
            data,
        });
    }

    async deleteCourse(id: string, adminId: string) {
        const course = await prisma.course.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleCourseNotFound(course);

        return prisma.course.delete({
            where: {id},
        });
    }
}

export default new CourseService();
