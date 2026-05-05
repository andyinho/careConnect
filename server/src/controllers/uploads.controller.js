import { prisma } from '../db/prisma.js';
import { assertClinicStaffUser } from '../services/access.service.js';

const UPLOAD_STATUS_RECEIVED = 'RECEIVED';

export async function createUpload(req, res) {
    try {
        const { clinicId, uploadedByUserId, originalFilename, mimeType } =
            req.body;

        if (!clinicId || !uploadedByUserId || !originalFilename || !mimeType) {
            return res.status(400).json({
                error: 'Missing Fields',
                required: [
                    'clinicId',
                    'uploadedByUserId',
                    'originalFilename',
                    'mimeType',
                ],
            });
        }

        const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowedMimeTypes.includes(mimeType)) {
            return res.status(400).json({
                error: 'Invalid mimeType',
                allowed: allowedMimeTypes,
                received: mimeType,
            });
        }

        await assertClinicStaffUser({
            userId: uploadedByUserId,
            clinicId,
        });

        const upload = await prisma.upload.create({
            data: {
                clinicId,
                uploadedByUserId,
                originalFilename,
                mimeType,
                storageKey: `placeholder/${Date.now()}_${originalFilename}`,
                status: UPLOAD_STATUS_RECEIVED,
            },
        });

        res.status(201).json({ upload });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.message,
            });
        }
        console.error('POST /uploads failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
