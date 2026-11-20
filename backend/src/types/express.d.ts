import {File} from 'multer';
import {Role} from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                email: string;
                fullname: string;
                role: Role;
                phoneNumber?: string;
                adminId?: string;
                teacherId?: string;
                studentId?: string;
            };
            file?: File;
            files?:
                | {
                      [fieldname: string]: Express.Multer.File[];
                  }
                | Express.Multer.File[];
        }
    }
}
