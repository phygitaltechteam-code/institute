import prisma from '../client';
import {tokenService} from '@services/index';
import emailService from '../services/email.service';
import {ApiError, encryptPassword, isPasswordMatch, pick} from '@utils/index';
import {UserProfile} from 'types/response';
import {userValidation} from '@validations/index';
import {Role, User} from '@prisma/client';
import {z} from 'zod';
import {DecodedToken} from './token.service';

type RegisterUser = z.infer<typeof userValidation.registerUserSchema>;
type LoginUser = z.infer<typeof userValidation.loginUserSchema>;
type ChangePassword = z.infer<typeof userValidation.changePasswordSchema>;
type UpdateUser = z.infer<typeof userValidation.updateUserSchema>;
type VerifyVerificationCode = z.infer<typeof userValidation.verifyVerificationCodeSchema>;

class UserService {
    private async findUserById(userId: string): Promise<User> {
        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    private async buildUserObject(user: UserProfile): Promise<UserProfile> {
        if (user.role === Role.ADMIN) {
            const admin = await prisma.admin.findUnique({
                where: {userId: user.id},
                include: {user: true},
            });

            if (!admin) {
                throw new ApiError(404, 'Admin not found');
            }

            const {user: adminUser, id: adminId} = admin;

            return {
                id: adminUser.id,
                username: adminUser.username,
                email: adminUser.email,
                fullname: adminUser.fullname,
                plan: 'admin.plan',

                role: user.role,
                adminId,

                phoneNumber: adminUser.phoneNumber,
            };
        }
        if (user.role === Role.TEACHER) {
            const teacher = await prisma.teacher.findUnique({
                where: {userId: user.id},
                include: {user: true},
            });

            if (!teacher) {
                throw new ApiError(404, 'teacher not found');
            }

            const {user: teacherUser, id: teacherId} = teacher;

            return {
                id: teacherUser.id,
                username: teacherUser.username,
                email: teacherUser.email,
                fullname: teacherUser.fullname,
                role: user.role,
                teacherId,
                phoneNumber: teacherUser.phoneNumber,
                // googleRating: admin.googleRating ?? '',
            };
        }

        return pick(user, ['id', 'username', 'email', 'fullname', 'role', 'phoneNumber', 'plan']);
    }

    public async registerUser(data: RegisterUser) {
        const {fullname, email, username, password, phoneNumber, secondaryPhoneNumber, role} = data;

        const existingUser = await prisma.user.findFirst({where: {OR: [{username}, {email}]}});
        const verifyCode = this.generateVerificationCode();

        if (existingUser) {
            return await this.handleExistingUser(existingUser, password, verifyCode);
        } else {
            return await this.createUser({
                fullname,
                email,
                username,
                password,
                verifyCode,
                phoneNumber,
                secondaryPhoneNumber: secondaryPhoneNumber ?? null,
                role: role ?? Role.STUDENT,
            });
        }
    }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async handleExistingUser(user: User, password: string, verifyCode: string) {
        if (user.isVerified) {
            throw new ApiError(409, 'User with this username or email already exists');
        } else {
            const hashedPassword = await encryptPassword(password);
            return await prisma.user.update({
                where: {id: user.id},
                data: {
                    password: hashedPassword,
                    verifyCode,
                    verifyCodeExpiry: new Date(Date.now() + 3600000), // 1 hour
                },
            });
        }
    }

    private async createUser(
        data: Pick<
            User,
            | 'fullname'
            | 'email'
            | 'username'
            | 'password'
            | 'verifyCode'
            | 'phoneNumber'
            | 'role'
            | 'secondaryPhoneNumber'
        >,
    ) {
        const hashedPassword = await encryptPassword(data.password!);
        return prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                verifyCodeExpiry: new Date(Date.now() + 3600000), // 1 hour
                isVerified: true,
                isActive: true,
            },
        });
    }

    public async loginUser(data: LoginUser) {
        const {email, username, password} = data;
        const user = await prisma.user.findFirst({where: {OR: [{username}, {email}]}});
        if (!user) throw new ApiError(404, 'User does not exist');
        if (!user.isVerified)
            throw new ApiError(403, 'User account is not verified. Please verify your email!');

        if (!user.isActive)
            throw new ApiError(403, 'User account is not active. Please contact support!');

        await this.verifyPassword(password, user.password!);
        const checkForStudio = await this.buildUserObject(user);
        // // let modules: null | modules = null;
        // if (user.role === Role.SHOP) {
        //     modules = await this.getShopModules(checkForStudio.shopId!);
        // }
        const {accessToken, refreshToken} =
            await tokenService.generateAccessAndRefreshToken(checkForStudio);
        return {accessToken, refreshToken, user: checkForStudio};
    }
    // public async getShopModules(shopId: string) {
    //     const modules = await prisma.modules.upsert({
    //         where: {
    //             shopId,
    //         },
    //         update: {},
    //         create: {
    //             shopId,
    //         },
    //     });
    //     if (!modules) throw new ApiError(404, 'modules does not exist');
    //     return modules;
    // }

    private async verifyPassword(password: string, hashedPassword: string) {
        if (!(await isPasswordMatch(password, hashedPassword))) {
            throw new ApiError(401, 'Invalid credentials');
        }
    }

    public async logoutUser(userId: string) {
        await prisma.user.update({where: {id: userId}, data: {refreshToken: null}});
    }

    public async refreshAccessToken(refreshToken: string) {
        const decodedToken = tokenService.verifyToken(refreshToken) as DecodedToken;
        const user = await this.findUserById(decodedToken.id);

        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }

        const checkForStudio = await this.buildUserObject(user);

        return tokenService.generateAccessAndRefreshToken(checkForStudio);
    }

    public async getCurrentUser(userId: string): Promise<User> {
        return this.findUserById(userId);
    }

    public async changeCurrentPassword(userId: string, data: ChangePassword) {
        const user = await this.findUserById(userId);
        await this.verifyUserVerification(user);

        await this.verifyPassword(data.currentPassword, user.password!);
        const hashedNewPassword = await encryptPassword(data.newPassword);
        return await prisma.user.update({
            where: {id: user.id},
            data: {password: hashedNewPassword},
        });
    }

    private async verifyUserVerification(user: User) {
        if (!user.isVerified) throw new ApiError(403, 'User account is not verified.');
    }

    public async updateUser(userId: string, data: UpdateUser) {
        return await prisma.user.update({
            where: {id: userId},
            data,
            select: {id: true, username: true, email: true, fullname: true},
        });
    }

    public async verifyVerificationCode(data: VerifyVerificationCode) {
        const user = await prisma.user.findUnique({where: {username: data.username}});
        if (!user) throw new ApiError(404, 'User not found');

        await this.checkVerificationCode(user, data.code);
        await prisma.user.update({
            where: {id: user.id},
            data: {isVerified: true, verifyCode: null, verifyCodeExpiry: null},
        });
    }

    private async checkVerificationCode(user: User, code: string) {
        if (user.verifyCode !== code || new Date(user.verifyCodeExpiry!) <= new Date()) {
            throw new ApiError(400, 'Invalid or expired verification code');
        }
    }

    public async requestPasswordReset(username: string) {
        const user = await prisma.user.findUnique({where: {username}});
        if (!user) throw new ApiError(404, 'User not found');
        await this.verifyUserVerification(user);

        const accessToken = tokenService.generateAccessToken(user);
        const emailResponse = await emailService.sendResetPasswordEmail(user.email, accessToken);
        if (!emailResponse.success) throw new ApiError(500, emailResponse.message);
    }

    public async resetPassword(userId: string, newPassword: string) {
        const hashedPassword = await encryptPassword(newPassword);
        await prisma.user.update({where: {id: userId}, data: {password: hashedPassword}});
    }

    public async findUserByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return await prisma.user.findFirst({
            where: {
                OR: [{email}, {username}],
            },
        });
    }

    public async updateUnverifiedUser(userId: string, data: Partial<User>): Promise<User> {
        if (data.password) {
            data.password = await encryptPassword(data.password);
        } else {
            delete data.password;
        }

        data.verifyCode = this.generateVerificationCode();
        data.verifyCodeExpiry = new Date(Date.now() + 3600000);
        data.isVerified = false;

        return await prisma.user.update({
            where: {id: userId},
            data,
        });
    }

    public async deactivateUser(userId: string): Promise<void> {
        await prisma.user.update({
            where: {id: userId},
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
    }
}

export default new UserService();
