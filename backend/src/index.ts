// import 'module-alias/register';
import {Server} from 'http';
import app from './app';
import prisma from './client';
import {config, logger} from '@config/index';
import ensureSuperAdmin from './utils/ensureSuperAdmin';

let server: Server;
prisma.$connect().then(async () => {
    const dbName = await prisma.$queryRaw<{current_database: string}[]>`SELECT current_database()`;

    if (dbName && dbName[0]) {
        logger.info(`Connected to SQL Database: ${dbName[0].current_database}`);
    }

    try {
        await ensureSuperAdmin();
    } catch (error) {
        logger.error('Failed to ensure default super admin', error);
    }

    server = app.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error: unknown) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
