import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from './ApiError';

/**
 * Local file storage for the online academy (thumbnails, lesson videos, resources, blog covers).
 * Files land in public/uploads/academy and are served by express.static('public'),
 * so the stored URL is the path "/uploads/academy/<file>".
 */
const PUBLIC_DIR = path.join(__dirname, '../../public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'academy');
export const ACADEMY_URL_PREFIX = '/uploads/academy/';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, {recursive: true});

const ALLOWED_EXT = new Set([
    // images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    // documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip',
    // audio / video
    '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm', '.mov', '.mkv',
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${base || 'file'}${ext}`);
    },
});

export const academyUpload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_EXT.has(ext)) cb(null, true);
        else cb(new ApiError(400, `File type ${ext || 'unknown'} is not allowed`));
    },
    limits: {fileSize: 1024 * 1024 * 1024}, // 1 GB (lesson videos)
});

export const fileKind = (fileName: string) => {
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    return ext || 'file';
};

/** Best-effort removal of a file we stored; ignores external URLs and missing files. */
export const removeAcademyFile = (url?: string | null) => {
    if (!url || !url.startsWith(ACADEMY_URL_PREFIX)) return;
    const name = path.basename(url);
    const full = path.join(UPLOAD_DIR, name);
    fs.promises.unlink(full).catch(() => undefined);
};
