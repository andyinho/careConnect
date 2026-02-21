import express from 'express';
import {
    listClinics,
    listClinicUploads,
} from '../controllers/clinics.controller.js';

const router = express.Router();

router.get('/', listClinics);
router.get('/:clinicId/uploads', listClinicUploads);

export default router;
