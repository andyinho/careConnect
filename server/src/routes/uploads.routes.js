import express from 'express';
import { createUpload } from '../controllers/uploads.controller.js';
import { startExtraction } from '../controllers/extractions.controller.js';

const router = express.Router();

router.post('/', createUpload);
router.post('/:uploadId/extractions', startExtraction);

export default router;
