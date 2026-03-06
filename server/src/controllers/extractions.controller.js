import { prisma } from '../db/prisma.js';

const ROLE_STAFF = 'STAFF';

class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}

export async function startExtraction(req, res) {
    try {
        const uploadId = req.params.uploadId;
        const { clinicId, userId } = req.body;

        if (!clinicId || !userId || !uploadId) {
            return res.status(400).json({
                error: 'Missing Fields',
                required: ['clinicId', 'userId', 'uploadId'],
            });
        }

        const upload = await prisma.upload.findUnique({
            where: {
                id: uploadId,
            },
            select: {
                id: true,
                clinicId: true,
                status: true,
            },
        });

        if (!upload) {
            return res.status(404).json({
                error: 'Upload not found',
            });
        }

        if (upload.clinicId !== clinicId) {
            return res.status(403).json({
                error: 'Upload does not belong to clinic',
            });
        }

        // fetch user scoped to clinic
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                clinicId: clinicId,
            },
            select: {
                id: true,
                clinicId: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        // STAFF allowed to unblock development, v2: Refine roles (FRONTDESK, CLINICIANS)
        if (user.role !== ROLE_STAFF) {
            return res.status(403).json({
                error: 'User not authorized',
            });
        }

        const startable =
            upload.status === 'RECEIVED' || upload.status === 'FAILED';
        if (!startable) {
            return res.status(409).json({
                error: 'Upload not in a startable state',
                allowed: ['RECEIVED', 'FAILED'],
            });
        }

        /*
        - Try to update the Upload only if it’s still startable
        - Inspect whether that update actually succeeded
        - If it didn’t → throw a conflict
        - If it did → create the ExtractionJob
        */
        const job = await prisma.$transaction(async (tx) => {
            const updateResult = await tx.upload.updateMany({
                where: {
                    id: uploadId,
                    clinicId: clinicId,
                    status: {
                        in: ['RECEIVED', 'FAILED'],
                    },
                },
                data: {
                    status: 'PENDING_EXTRACTION',
                },
            });
            if (updateResult.count === 0) {
                throw new ConflictError(
                    'Extraction already started or upload not startable',
                );
            }
        });
    } catch (error) {
        if (error.name === 'ConflictError') {
            return res.status(409).json({
                error: error.message,
            });
        }
        console.error('POST /extractions failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
