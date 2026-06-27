"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure Multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.use(auth_middleware_1.authenticateToken); // Protect all report routes
router.post('/', reports_controller_1.createReport);
router.get('/', reports_controller_1.getReports);
router.get('/:id', reports_controller_1.getReportById);
// Endpoint to handle photo uploads separately if needed
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
    // Logic to save photo URLs to the database linked to the report
    // This will be implemented in the controller later if needed, 
    // or handled within createReport if we upload everything as base64 or multipart.
    res.json({ message: 'Photos uploaded successfully', files: req.files });
});
exports.default = router;
