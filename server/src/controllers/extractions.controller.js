import { prisma } from '../db/prisma.js';

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
        if (user.role !== 'STAFF') {
            return res.status(403).json({
                error: 'User not authorized',
            });
        }
    } catch (error) {
        console.error('POST /extractions failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
