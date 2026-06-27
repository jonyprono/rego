"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportById = exports.getReports = exports.createReport = void 0;
const db_1 = __importDefault(require("../config/db"));
const createReport = async (req, res) => {
    try {
        const { date, interventionType, startTime, endTime, duration, price, quarter, clientName, agencyName, clientAddress, clientDepartment, problemsEncountered, situationBefore, solutionProvided, situationAfter, remarks, clientRepresentative, representativeRole, clientSignature, technicians // Array of { fullName, techId }
         } = req.body;
        console.log("Body reçu :", req.body);
        console.log("Files reçus :", req.files);
        // @ts-ignore
        console.log("User :", req.user);
        // @ts-ignore
        const userId = req.user?.id;
        // Generate report number (e.g., REP-YYYYMMDD-XXXX)
        const count = await db_1.default.report.count();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const reportNumber = `REP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
        const newReport = await db_1.default.report.create({
            data: {
                reportNumber,
                date: new Date(date),
                interventionType,
                startTime,
                endTime,
                duration: parseFloat(duration),
                price: price ? parseFloat(price) : null,
                quarter,
                clientName,
                agencyName,
                clientAddress,
                clientDepartment,
                problemsEncountered,
                situationBefore,
                solutionProvided,
                situationAfter,
                remarks,
                clientRepresentative,
                representativeRole,
                validationDate: clientSignature ? new Date() : null,
                clientSignature, // Base64 signature
                userId,
                technicians: {
                    create: technicians || []
                }
            },
            include: {
                technicians: true
            }
        });
        res.status(201).json(newReport);
    }
    catch (error) {
        console.error("Erreur complète :", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
};
exports.createReport = createReport;
const getReports = async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        // @ts-ignore
        const role = req.user?.role;
        // If admin, can see all reports. If technician, only theirs.
        const query = role === 'ADMIN' ? {} : { userId };
        const reports = await db_1.default.report.findMany({
            where: query,
            include: {
                technicians: true,
                user: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};
exports.getReports = getReports;
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;
        // @ts-ignore
        const role = req.user?.role;
        const report = await db_1.default.report.findUnique({
            where: { id: Number(id) },
            include: {
                technicians: true,
                photos: true,
                user: { select: { firstName: true, lastName: true } }
            }
        });
        if (!report) {
            res.status(404).json({ message: 'Report not found' });
            return;
        }
        if (role !== 'ADMIN' && report.userId !== userId) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        res.json(report);
    }
    catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Error fetching report' });
    }
};
exports.getReportById = getReportById;
