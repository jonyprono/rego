import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createReport, getReports, getReportById, updateReport, deleteReport } from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.use(authenticateToken); // Protect all report routes

router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

// Endpoint to handle photo uploads separately if needed
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  // Logic to save photo URLs to the database linked to the report
  // This will be implemented in the controller later if needed, 
  // or handled within createReport if we upload everything as base64 or multipart.
  res.json({ message: 'Photos uploaded successfully', files: req.files });
});

export default router;
