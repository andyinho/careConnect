import { prisma } from '../db/prisma.js';

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

        const clinic = await prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { id: true },
        });
        if (!clinic) {
            return res.status(404).json({
                error: 'Clinic not found',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: uploadedByUserId },
            select: {
                id: true,
                clinicId: true,
                role: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.clinicId !== clinicId) {
            return res
                .status(403)
                .json({ error: 'User does not belong to this clinic' });
        }
        if (user.role !== 'STAFF') {
            return res
                .status(403)
                .json({ error: 'Only staff can upload intake forms' });
        }

        const upload = await prisma.upload.create({
            data: {
                clinicId,
                uploadedByUserId,
                originalFilename,
                mimeType,
                storageKey: `placeholder/${Date.now()}_${originalFilename}`,
                status: 'RECEIVED',
            },
        });

        res.status(201).json({ upload });
    } catch (error) {
        console.error('POST /uploads failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
