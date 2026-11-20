/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const HOSTED_BACKEND_URL = process.env.HOSTED_BACKEND_URL || 'https://upload.phygitaltech.in/';
const UPLOAD_TIMEOUT = 15000; // 15 seconds

interface UploadResponse {
    link: string;
    key: string;
}

/**
 * Helper to safely delete local temp file after upload attempt
 */
function cleanupTempFile(filePath: string) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', filePath, err);
        });
    }
}

/**
 * Upload using file path (replace your S3 file upload)
 */
export async function uploadFileToHostedServer(filePath: string): Promise<UploadResponse | null> {
    try {
        if (!filePath) return null;

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const res = await axios.post(`${HOSTED_BACKEND_URL}/upload`, form, {
            headers: form.getHeaders(),
            timeout: UPLOAD_TIMEOUT,
        });

        const data = res.data?.data;

        return {
            link: data?.url || '',
            key: data?.filename || '',
        };
    } catch (error: any) {
        console.error('UPLOAD ERROR:', error?.message || error);
        throw error;
    } finally {
        cleanupTempFile(filePath);
    }
}

/**
 * Upload using BASE64 (replace uploadImageToS3)
 */
export async function uploadBase64ToHostedServer(
    base64: string,
    filename: string,
): Promise<UploadResponse | null> {
    try {
        const buffer = Buffer.from(base64, 'base64');

        const form = new FormData();
        form.append('file', buffer, {
            filename,
            contentType: 'image/jpeg',
        });

        const res = await axios.post(`${HOSTED_BACKEND_URL}/upload`, form, {
            headers: form.getHeaders(),
            timeout: UPLOAD_TIMEOUT,
        });

        const data = res.data?.data;

        return {
            link: data?.url || '',
            key: data?.filename || '',
        };
    } catch (error: any) {
        console.error('BASE64 UPLOAD ERROR:', error?.message || error);
        throw error;
    }
}

/**
 * Upload PDF using BASE64
 */
export async function uploadPdfBase64ToHostedServer(
    base64: string,
    filename: string,
): Promise<UploadResponse | null> {
    try {
        const buffer = Buffer.from(base64, 'base64');

        const form = new FormData();
        form.append('file', buffer, {
            filename,
            contentType: 'application/pdf',
        });

        const res = await axios.post(`${HOSTED_BACKEND_URL}/upload`, form, {
            headers: form.getHeaders(),
            timeout: UPLOAD_TIMEOUT,
        });

        const data = res.data?.data;

        return {
            link: data?.url || '',
            key: data?.filename || '',
        };
    } catch (error: any) {
        console.error('PDF BASE64 UPLOAD ERROR:', error?.message || error);
        throw error;
    }
}
