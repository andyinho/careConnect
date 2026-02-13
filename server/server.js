import dotenv from 'dotenv';
import { prisma } from './src/db/prisma.js';
import express from 'express';
import pkg from 'pg';

dotenv.config();
const app = express();
const { Pool } = pkg;

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
