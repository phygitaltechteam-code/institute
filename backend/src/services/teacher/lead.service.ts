/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {leadValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateLeadData = z.infer<typeof leadValidation.createLeadSchema>;
type UpdateLeadData = z.infer<typeof leadValidation.updateLeadSchema>;
type PaginateLeads = z.infer<typeof leadValidation.paginateLeadSchema>;

class LeadService {
    private async handleLeadNotFound(lead: any) {
        if (!lead) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
        }
    }

    async createLead(data: CreateLeadData) {
        return prisma.lead.create({
            data: {
                ...data,
                // adminId,
            },
            include: {
                course: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
                batch: true,
            },
        });
    }

    async getLeads(query: PaginateLeads) {
        const {page, limit, searchTerm, status, courseId, batchId, teacherId, batchType} = query;

        const where: any = {
            // adminId,
        };

        if (status) {
            where.status = status;
        }
        if (courseId) {
            where.courseId = courseId;
        }
        if (batchId) {
            where.batchId = batchId;
        }
        if (teacherId) {
            where.teacherId = teacherId;
        }
        if (batchType) {
            where.batchType = batchType;
        }

        if (searchTerm) {
            where.OR = [
                {name: {contains: searchTerm, mode: 'insensitive'}},
                {phoneNumber: {contains: searchTerm, mode: 'insensitive'}},
                {source: {contains: searchTerm, mode: 'insensitive'}},
                {collegeName: {contains: searchTerm, mode: 'insensitive'}},
                {qualification: {contains: searchTerm, mode: 'insensitive'}},
            ];
        }

        const [leads, totalItems] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    course: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                    batch: true,
                    leadFollowUps: {
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 1,
                    },
                },
            }),
            prisma.lead.count({
                where,
            }),
        ]);

        return {
            data: leads,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getLeadById(id: string) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                // adminId,
            },
            include: {
                course: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
                batch: true,
                leadFollowUps: {
                    include: {
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        await this.handleLeadNotFound(lead);
        return lead;
    }

    async updateLead(id: string, data: UpdateLeadData) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                // adminId,
            },
        });
        await this.handleLeadNotFound(lead);

        return prisma.lead.update({
            where: {id},
            data,
            include: {
                course: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
                batch: true,
            },
        });
    }

    async deleteLead(id: string) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                // adminId,
            },
        });
        await this.handleLeadNotFound(lead);

        return prisma.lead.delete({
            where: {id},
        });
    }

    async createLeadFollowUp(
        teacherId: string,
        data: z.infer<typeof leadValidation.createLeadFollowUpSchema>,
    ) {
        const lead = await prisma.lead.findFirst({
            where: {id: data.leadId},
        });
        if (!lead) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                "Lead not found or does not belong to this teacher's admin",
            );
        }

        return prisma.leadFollowUp.create({
            data: {
                leadId: data.leadId,
                note: data.note,
                nextFollowUpDate: data.nextFollowUpDate || null,
                teacherId,
            },
            include: {
                lead: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async getLeadFollowUps(
        // teacherId: string,
        query: z.infer<typeof leadValidation.paginateLeadSchema>,
    ) {
        const {page, limit, searchTerm} = query;

        const where: any = {
            // teacherId,
        };

        if (searchTerm) {
            where.OR = [
                {
                    followUp: {contains: searchTerm, mode: 'insensitive'},
                },
                {
                    lead: {
                        name: {contains: searchTerm, mode: 'insensitive'},
                    },
                },
            ];
        }

        const [followUps, totalItems] = await Promise.all([
            prisma.leadFollowUp.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    lead: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
            }),
            prisma.leadFollowUp.count({
                where,
            }),
        ]);

        return {
            data: followUps,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getLeadFollowUpById(id: string) {
        const record = await prisma.leadFollowUp.findFirst({
            where: {
                id,
                // teacherId,
            },
            include: {
                lead: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Lead follow up not found');
        }
        return record;
    }

    async updateLeadFollowUp(
        id: string,
        teacherId: string,
        data: z.infer<typeof leadValidation.updateLeadFollowUpSchema>,
    ) {
        const record = await prisma.leadFollowUp.findFirst({
            where: {
                id,
                teacherId,
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Lead follow up not found');
        }

        return prisma.leadFollowUp.update({
            where: {id},
            data,
            include: {
                lead: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async deleteLeadFollowUp(id: string, teacherId: string) {
        const record = await prisma.leadFollowUp.findFirst({
            where: {
                id,
                teacherId,
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Lead follow up not found');
        }

        return prisma.leadFollowUp.delete({
            where: {id},
        });
    }
}

export default new LeadService();
