import {Prisma, Role, Admin} from '@prisma/client';
import prisma from '@client';
import {ApiError, encryptPassword} from '@utils/index';
import {adminValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type AddAdminData = z.infer<typeof adminValidation.registerAdminSchema>;
type PaginateAdmins = z.infer<typeof adminValidation.paginateAdminsSchema>;
type AdminWithUser = Prisma.AdminGetPayload<{
    include: {
        user: {select: {username: true; email: true; fullname: true}};
    };
}>;
// type UpdateAdminData = z.infer<typeof adminValidation.updateAdminSchema>;

class AdminService {
    private async generateIndianPhoneNumber() {
        const firstDigit = Math.floor(Math.random() * 3) + 7;
        let phoneNumber = firstDigit.toString();
        let isTrue = false;

        while (!isTrue) {
            for (let i = 0; i < 9; i++) {
                phoneNumber += Math.floor(Math.random() * 10).toString();
            }

            const user = await prisma.user.findFirst({
                where: {
                    phoneNumber,
                },
            });

            isTrue = !user;

            if (!isTrue) {
                phoneNumber = firstDigit.toString();
            }
        }

        return phoneNumber;
    }

    private buildUserData(data: AddAdminData) {
        return {
            username: data.username,
            email: data.email,
            fullname: data.fullname,
            password: data.password,
            phoneNumber: data.phoneNumber,
            role: Role.ADMIN,
        };
    }

    private buildAdminData(data: AddAdminData, userId: string) {
        return {
            userId,
            city: data.city,
            state: data.state,
            logo: data.logo,
            tagLine: data.tagLine,
            pin: data.pin,
            gst: data.gst,
            country: data.country,
            pincode: data.pincode,
            address: data.address,
            adminId: data.adminId,
        };
    }

    private async handleAdminNotFound(admin: Admin | null) {
        if (!admin) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
        }
    }

    private formatAdmin(admin: AdminWithUser) {
        const {user, ...adminData} = admin;
        return {...adminData, ...user};
    }

    async registerAdmin(data: AddAdminData) {
        const userData = this.buildUserData(data);

        const existingUser = await prisma.user.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    {username: userData.username},
                    {email: userData.email},
                    {phoneNumber: userData.phoneNumber},
                ],
            },
        });
        if (existingUser) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'A user with this username, email or phone number already exists',
            );
        }

        const hashedPassword = await encryptPassword(userData.password);

        // User + Admin are created in one transaction so a failure never leaves an orphan user
        const newAdmin = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {...userData, password: hashedPassword, isVerified: true, isActive: true},
            });
            const adminData = this.buildAdminData(data, user.id);
            const admin = await tx.admin.create({
                data: adminData,
            });

            return admin;
        });

        return newAdmin;
    }

    async getAdmins(query: PaginateAdmins) {
        const {page, limit, searchTerm} = query;

        const where: Prisma.AdminWhereInput = {
            user: {
                deletedAt: null,
                ...(searchTerm
                    ? {
                          OR: [
                              {fullname: {contains: searchTerm, mode: 'insensitive'}},
                              {username: {contains: searchTerm, mode: 'insensitive'}},
                              {email: {contains: searchTerm, mode: 'insensitive'}},
                              {phoneNumber: {contains: searchTerm}},
                          ],
                      }
                    : {}),
            },
        };

        const [admins, totalItems, activeCount, totalCount] = await Promise.all([
            prisma.admin.findMany({
                where,
                orderBy: {createdAt: 'desc'},
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true,
                            fullname: true,
                            phoneNumber: true,
                            secondaryPhoneNumber: true,
                            isActive: true,
                        },
                    },
                },
            }),
            prisma.admin.count({where}),
            prisma.admin.count({where: {user: {isActive: true, deletedAt: null}}}),
            prisma.admin.count({where: {user: {deletedAt: null}}}),
        ]);

        const formattedData = admins.map(this.formatAdmin.bind(this));
        return {
            data: formattedData,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            activeCount,
            totalCount,
        };
    }

    async getAdminById(id: string) {
        const admin = await prisma.admin.findUnique({
            where: {id},
            include: {
                user: {
                    select: {username: true, email: true, fullname: true, phoneNumber: true},
                },
            },
        });

        await this.handleAdminNotFound(admin);
        return this.formatAdmin(admin!);
    }

    async updateAdmin(id: string, data: z.infer<typeof adminValidation.editAdminSchema>) {
        const admin = await prisma.admin.findUnique({where: {id}, select: {id: true, userId: true}});
        if (!admin) throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');

        // Login details must stay unique across all users
        const clash = [
            data.username && {username: data.username},
            data.email && {email: data.email},
            data.phoneNumber && {phoneNumber: data.phoneNumber},
        ].filter(Boolean) as Prisma.UserWhereInput[];
        if (clash.length) {
            const other = await prisma.user.findFirst({
                where: {id: {not: admin.userId}, deletedAt: null, OR: clash},
                select: {username: true, email: true, phoneNumber: true},
            });
            if (other) {
                const field =
                    data.email && other.email === data.email
                        ? 'email'
                        : data.phoneNumber && other.phoneNumber === data.phoneNumber
                          ? 'phone number'
                          : 'user ID';
                throw new ApiError(httpStatus.CONFLICT, `Another account already uses this ${field}`);
            }
        }

        const updated = await prisma.admin.update({
            where: {id},
            data: {
                city: data.city,
                state: data.state,
                country: data.country,
                pincode: data.pincode,
                address: data.address,
                adminId: data.adminId,
                gst: data.gst,
                tagLine: data.tagLine,
                user: {
                    update: {
                        fullname: data.fullname,
                        username: data.username,
                        email: data.email,
                        phoneNumber: data.phoneNumber,
                        isActive: data.isActive,
                        ...(data.password ? {password: await encryptPassword(data.password)} : {}),
                    },
                },
            },
            include: {
                user: {
                    select: {username: true, email: true, fullname: true, phoneNumber: true, isActive: true},
                },
            },
        });
        return this.formatAdmin(updated);
    }

    async deleteAdmin(id: string) {
        const admin = await prisma.admin.findUnique({where: {id}});
        await this.handleAdminNotFound(admin);

        // Soft delete: the Admin row is referenced by batches, students, etc., so it is kept.
        // The login is disabled and the username is freed so it can be reused.
        const user = await prisma.user.findUnique({where: {id: admin!.userId}});
        await prisma.user.update({
            where: {id: admin!.userId},
            data: {
                deletedAt: new Date(),
                isActive: false,
                refreshToken: null,
                username: `${user?.username}__deleted__${Date.now()}`,
            },
        });
        return admin;
    }
}

export default new AdminService();
