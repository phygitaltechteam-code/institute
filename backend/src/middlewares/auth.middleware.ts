import {Request, Response, NextFunction} from 'express';
import {catchAsync, ApiError} from '@utils/index';
import prisma from '../client';
import {tokenService} from '@services/index';
import httpStatus from 'http-status';
import {Role, User} from '@prisma/client';
import {commonValidation} from '@validations/index';

type SelectedUser = Pick<
    User,
    'id' | 'username' | 'email' | 'fullname' | 'phoneNumber' | 'secondaryPhoneNumber' | 'role'
>;
const getTokenFromRequest = (req: Request): string => {
    const token =
        req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '') || '';
    commonValidation.tokenSchema.parse(token);
    return token;
};

const assignRoleData = async (user: SelectedUser, req: Request) => {
    if (user.role === Role.ADMIN) {
        const admin = await prisma.admin.findUnique({
            where: {userId: user.id},
            select: {id: true},
        });
        if (!admin) throw new ApiError(httpStatus.UNAUTHORIZED, 'Admin not found');
        req.user = {...user, adminId: admin.id};
    } else if (user.role === Role.TEACHER) {
        const teacher = await prisma.teacher.findUnique({
            where: {userId: user.id},
            select: {id: true, adminId: true},
        });
        if (!teacher) throw new ApiError(httpStatus.UNAUTHORIZED, 'Teacher not found');
        req.user = {...user, teacherId: teacher.id, adminId: teacher.adminId};
    } else if (user.role === Role.STUDENT) {
        const student = await prisma.student.findUnique({
            where: {userId: user.id},
            select: {id: true, adminId: true},
        });
        if (!student) throw new ApiError(httpStatus.UNAUTHORIZED, 'Student not found');
        req.user = {...user, studentId: student.id, adminId: student.adminId};
    } else {
        req.user = {...user};
    }
};

const verifyJWT = catchAsync(async (req, res, next) => {
    const token = getTokenFromRequest(req);
    const decodedToken = tokenService.verifyToken(token);

    const user = await prisma.user.findUnique({
        where: {id: decodedToken.id},
        select: {
            id: true,
            username: true,
            email: true,
            fullname: true,
            role: true,
            phoneNumber: true,
            secondaryPhoneNumber: true,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    await assignRoleData(user, req);
    next();
});

const checkRole = (requiredRoles: Role | Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(user.role)) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                `Access denied: Your role (${user.role}) does not have permission. Required role(s): ${roles.join(', ')}.`,
            );
        }

        next();
    };
};
const checkSuperAdmin = checkRole(Role.SUPERADMIN);
const checkAdmin = checkRole(Role.ADMIN);
const checkTeacher = checkRole(Role.TEACHER);
const checkStudent = checkRole(Role.STUDENT);

export {verifyJWT, checkRole, checkSuperAdmin, checkAdmin, checkTeacher, checkStudent};
