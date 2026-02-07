import express from 'express';
import pkg from 'pg';

const app = express();
const { Pool } = pkg;

const PORT = process.env.PORT || 4000;
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'careconnect',
    password: 'careconnect_password',
    database: 'careconnect_db',
});

// simple health check route
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
