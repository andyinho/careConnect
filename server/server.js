import dotenv from 'dotenv';
import express from 'express';
import uploadsRouter from './src/routes/uploads.routes.js';
import clinicsRouter from './src/routes/clinics.routes.js';

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
    res.json({ status: 'alive' });
});

app.use('/uploads', uploadsRouter);
app.use('/clinics', clinicsRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
