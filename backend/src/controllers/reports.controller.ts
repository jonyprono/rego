import { Request, Response } from 'express';
import prisma from '../config/db';
import { uploadBase64Image } from '../utils/cloudinary';

const processPhotoArray = async (photoJsonString?: string): Promise<string | undefined> => {
  if (!photoJsonString) return undefined;
  try {
    const photos: string[] = JSON.parse(photoJsonString);
    const uploadedUrls = await Promise.all(
      photos.map(async (base64) => {
        if (base64.startsWith('data:image')) {
          return await uploadBase64Image(base64);
        }
        return base64;
      })
    );
    return JSON.stringify(uploadedUrls);
  } catch (error) {
    console.error("Erreur lors du traitement des photos:", error);
    return photoJsonString;
  }
};

const processSignature = async (signature?: string): Promise<string | undefined> => {
  if (!signature) return undefined;
  if (signature.startsWith('data:image')) {
    return await uploadBase64Image(signature);
  }
  return signature;
};

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      date, interventionType, startTime, endTime, duration, price, quarter,
      clientName, agencyName, clientAddress, clientDepartment,
      problemsEncountered, situationBefore, solutionProvided, situationAfter, remarks,
      clientRepresentative, representativeRole, clientSignature, presencePhotos,
      technicians // Array of { fullName, techId }
    } = req.body;
    
    // @ts-ignore
    const userId = req.user?.id;

    // Generate report number (e.g., REP-YYYYMMDD-XXXX)
    const count = await prisma.report.count();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reportNumber = `REP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // Upload photos to Cloudinary
    const processedSituationBefore = await processPhotoArray(situationBefore);
    const processedSituationAfter = await processPhotoArray(situationAfter);
    const processedPresencePhotos = await processPhotoArray(presencePhotos);
    const processedSignature = await processSignature(clientSignature);

    const newReport = await prisma.report.create({
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
        situationBefore: processedSituationBefore,
        solutionProvided,
        situationAfter: processedSituationAfter,
        remarks,
        clientRepresentative,
        representativeRole,
        validationDate: processedSignature ? new Date() : null,
        clientSignature: processedSignature,
        presencePhotos: processedPresencePhotos,
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
  } catch (error: any) {
    console.error("Erreur complète :", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const role = req.user?.role;

    // If admin, can see all reports. If technician, only theirs.
    const query = role === 'ADMIN' ? {} : { userId };

    const reports = await prisma.report.findMany({
      where: query,
      include: {
        technicians: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const role = req.user?.role;

    const report = await prisma.report.findUnique({
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
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const role = req.user?.role;

    const existingReport = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: { technicians: true }
    });

    if (!existingReport) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    if (role !== 'ADMIN' && existingReport.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const {
      date, interventionType, startTime, endTime, duration, price, quarter,
      clientName, agencyName, clientAddress, clientDepartment,
      problemsEncountered, situationBefore, solutionProvided, situationAfter, remarks,
      clientRepresentative, representativeRole, clientSignature, presencePhotos,
      technicians
    } = req.body;

    // Delete existing technicians to replace them
    await prisma.technician.deleteMany({
      where: { reportId: Number(id) }
    });

    // Upload new photos to Cloudinary if they are base64 strings
    const processedSituationBefore = situationBefore !== undefined ? await processPhotoArray(situationBefore) : existingReport.situationBefore;
    const processedSituationAfter = situationAfter !== undefined ? await processPhotoArray(situationAfter) : existingReport.situationAfter;
    const processedPresencePhotos = presencePhotos !== undefined ? await processPhotoArray(presencePhotos) : existingReport.presencePhotos;
    const processedSignature = clientSignature !== undefined ? await processSignature(clientSignature) : existingReport.clientSignature;

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data: {
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
        situationBefore: processedSituationBefore,
        solutionProvided,
        situationAfter: processedSituationAfter,
        remarks,
        clientRepresentative,
        representativeRole,
        validationDate: processedSignature ? new Date() : existingReport.validationDate,
        clientSignature: processedSignature,
        presencePhotos: processedPresencePhotos,
        technicians: {
          create: technicians || []
        }
      },
      include: {
        technicians: true
      }
    });

    res.json(updatedReport);
  } catch (error: any) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const role = req.user?.role;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) }
    });

    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    if (role !== 'ADMIN' && report.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await prisma.report.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report' });
  }
};
