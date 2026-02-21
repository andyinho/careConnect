import { prisma } from '../db/prisma.js';

export async function listClinics(req, res) {
    try {
        const clinics = await prisma.clinic.findMany({
            include: {
                users: true,
            },
        });

        return res.status(200).json({ clinics });
    } catch (error) {
        console.error('GET /clinics failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function listClinicUploads(req, res) {
    try {
        const clinicId = req.params.clinicId;

        const clinic = await prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { id: true },
        });
        if (!clinic) {
            return res.status(404).json({
                error: 'Clinic not found',
            });
        }

        const uploads = await prisma.upload.findMany({
            where: {
                clinicId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                originalFilename: true,
                status: true,
                createdAt: true,
                uploadedBy: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        return res.status(200).json({
            uploads,
        });
    } catch (error) {
        console.error('GET /uploads failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
