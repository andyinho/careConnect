import dotenv from 'dotenv';
import { prisma } from './src/db/prisma.js';
import express from 'express';
import pkg from 'pg';

dotenv.config();
const app = express();
const { Pool } = pkg;

app.use(express.json());

const PORT = process.env.PORT || 4000;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get('/health', (req, res) => {
    res.json({ status: 'alive' });
});
app.get('/db-check', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1');
        res.json({ db: 'ok' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ db: 'error' });
    }
});
app.get('/clinics', async (req, res) => {
    try {
        const clinics = await prisma.clinic.findMany({
            include: {
                users: true,
            },
        });

        res.json({ clinics });
    } catch (error) {
        console.error('GET /clinics failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/clinics/:clinicId/uploads', async (req, res) => {
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
});

app.post('/uploads', async (req, res) => {
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

        const allowedMimeTypes = new Set([
            'application/pdf',
            'image/png',
            'image/jpeg',
        ]);
        if (!allowedMimeTypes.has(mimeType)) {
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
