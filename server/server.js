import express from 'express';

const app = express();

const PORT = process.env.PORT || 4000;

// simple health check route
app.get('/health', (req, res) => {
    res.json({ status: 'alive' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
