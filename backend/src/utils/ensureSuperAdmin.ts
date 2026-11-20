import {Role} from '@prisma/client';
import prisma from '../client';
import {encryptPassword} from './encryption';
import {logger} from '@config/index';

/**
 * Default super admin, created on server start if it does not exist yet.
 * Can be overridden with SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD / SUPERADMIN_EMAIL in .env.
 * The password is only used at creation time; an existing account is never modified.
 */
const DEFAULT_SUPERADMIN = {
    username: process.env.SUPERADMIN_USERNAME || '9022359873',
    password: process.env.SUPERADMIN_PASSWORD || 'Pass@123',
    email: process.env.SUPERADMIN_EMAIL || 'superadmin@medcodeninja.com',
    fullname: 'Super Admin',
};

const ensureSuperAdmin = async () => {
    const {username, password, email, fullname} = DEFAULT_SUPERADMIN;

    const existing = await prisma.user.findUnique({where: {username}});
    if (existing) {
        if (existing.role !== Role.SUPERADMIN) {
            logger.warn(`User "${username}" exists but is ${existing.role}, not SUPERADMIN`);
        }
        return;
    }

    await prisma.user.create({
        data: {
            username,
            email,
            fullname,
            phoneNumber: /^[6-9]\d{9}$/.test(username) ? username : '9000000000',
            password: await encryptPassword(password),
            role: Role.SUPERADMIN,
            isVerified: true,
            isActive: true,
        },
    });
    logger.info(`Default super admin created (username: ${username})`);
};

export default ensureSuperAdmin;
