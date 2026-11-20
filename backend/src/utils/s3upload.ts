import {S3Client, DeleteObjectCommand} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import {BUCKET_NAME} from './s3constants';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
    },
});
interface data {
    link: string;
    key: string;
}

async function uploadFileToS3(
    filePath: string,
    bucketName: string = BUCKET_NAME,
    key: string,
): Promise<data | null> {
    try {
        if (!filePath) return null;
        await deleteFileFromS3(bucketName, key);
        const fileStream = fs.createReadStream(filePath);
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: fileStream,
                ContentType: getContentType(filePath),
            },
        });

        const result = await upload.done();
        const obj = {
            link: result?.Location || '',
            key: result?.Key || '',
        };
        return obj || null;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
}

export const uploadImageToS3 = async (
    file: string,
    bucketName: string = BUCKET_NAME,
    key: string,
) => {
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: bucketName,
            Key: key,
            Body: Buffer.from(file, 'base64'),
            ContentType: 'image/jpeg',
        },
    });
    const result = await upload.done();
    const obj = {
        link: result?.Location || '',
        key: result?.Key || '',
    };
    return obj || null;
};

function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.jpg':
            return 'image/jpg';
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.pdf':
            return 'application/pdf';
        case '.txt':
            return 'text/plain';
        case '.mp4':
            return 'video/mp4';
        case '.avi':
            return 'video/x-msvideo';
        case '.mkv':
            return 'video/x-matroska';
        case '.webm':
            return 'video/webm';
        case '.mov':
            return 'video/quicktime';
        case '.flv':
            return 'video/x-flv';
        case '.wmv':
            return 'video/x-ms-wmv';
        // Add other content types as needed
        default:
            return 'application/octet-stream';
    }
}
async function deleteFileFromS3(bucketName: string, key: string): Promise<void> {
    try {
        const deleteParams = {Bucket: bucketName, Key: key};
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
    } catch (error) {
        console.warn(`File not found or could not be deleted:`, error);
    }
}

export {uploadFileToS3, deleteFileFromS3};
