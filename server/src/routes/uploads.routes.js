import express from 'express';
import { createUpload } from '../controllers/uploads.controller.js';

const router = express.Router();

router.post('/', createUpload);

export default router;
