import {Role} from '@prisma/client';
import prisma from '../client';

const updateRoleToAdmin = async (identifier: string) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{id: identifier}, {username: identifier}, {email: identifier}],
            },
        });

        if (!user) {
            console.error('User not found.');
            return;
        }

        //console.log(`User found: Username: ${user.username}, ID: ${user.id}, Email: ${user.email}`);

        if (user.role === Role.ADMIN) {
            //console.log(`User ${user.username} (ID: ${user.id}) is already an ADMIN.`);
            return;
        }

        await prisma.user.update({
            where: {id: user.id},
            data: {role: Role.ADMIN},
        });

        console.log(`Role updated to ADMIN for user ${user.username} (ID: ${user.id}).`);
    } catch (error) {
        console.error('Error updating role:', error);
    } finally {
        await prisma.$disconnect();
    }
};

const [, , identifier] = process.argv;

if (!identifier) {
    console.error('Usage: npm run updateRoleToAdmin <identifier>');
    //     console.log('Where <identifier> can be one of the following:');
    //     console.log('  - User ID');
    //     console.log('  - Username');
    //     console.log('  - Email address');
} else {
    updateRoleToAdmin(identifier);
}
