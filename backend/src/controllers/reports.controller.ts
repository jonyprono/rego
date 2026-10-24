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
      clientName, agencyName, clientAddress, clientDepartment, clientCommune,
      problemsEncountered, situationBefore, solutionProvided, situationAfter, remarks,
      clientRepresentative, representativeRole, clientSignature, presencePhotos,
      technicianName, technicianSignature,
      itManagerName, itManagerDepartment, itManagerSignature,
      status,
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
    const processedClientSignature = await processSignature(clientSignature);
    const processedTechnicianSignature = await processSignature(technicianSignature);
    const processedItManagerSignature = await processSignature(itManagerSignature);

    const calculatedStatus = processedItManagerSignature ? 'VALIDE' : (status || 'EN_ATTENTE_SIGNATURE');

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
        clientCommune: clientCommune || null,
        problemsEncountered,
        situationBefore: processedSituationBefore,
        solutionProvided,
        situationAfter: processedSituationAfter,
        remarks,
        status: calculatedStatus,
        technicianName: technicianName || null,
        technicianSignature: processedTechnicianSignature || null,
        technicianSignedAt: processedTechnicianSignature ? new Date() : null,
        itManagerName: itManagerName || null,
        itManagerDepartment: itManagerDepartment || clientDepartment,
        itManagerSignature: processedItManagerSignature || null,
        itManagerSignedAt: processedItManagerSignature ? new Date() : null,
        clientRepresentative,
        representativeRole,
        validationDate: processedClientSignature ? new Date() : null,
        clientSignature: processedClientSignature,
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
    // @ts-ignore
    const department = req.user?.department;

    let query: any = {};
    if (role === 'RESPONSABLE_INFO') {
      if (department) {
        query = {
          clientDepartment: {
            equals: department,
            mode: 'insensitive'
          }
        };
      }
    } else if (role !== 'ADMIN') {
      query = { userId };
    }

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
    // @ts-ignore
    const department = req.user?.department;

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

    const isAuthorized = 
      role === 'ADMIN' ||
      report.userId === userId ||
      (role === 'RESPONSABLE_INFO' && (!department || report.clientDepartment.toLowerCase() === department.toLowerCase()));

    if (!isAuthorized) {
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
    // @ts-ignore
    const department = req.user?.department;

    const existingReport = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: { technicians: true }
    });

    if (!existingReport) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    const isAuthorized = 
      role === 'ADMIN' || 
      existingReport.userId === userId ||
      (role === 'RESPONSABLE_INFO' && (!department || existingReport.clientDepartment.toLowerCase() === department.toLowerCase()));

    if (!isAuthorized) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const {
      date, interventionType, startTime, endTime, duration, price, quarter,
      clientName, agencyName, clientAddress, clientDepartment, clientCommune,
      problemsEncountered, situationBefore, solutionProvided, situationAfter, remarks,
      clientRepresentative, representativeRole, clientSignature, presencePhotos,
      technicianName, technicianSignature,
      itManagerName, itManagerDepartment, itManagerSignature,
      status,
      technicians
    } = req.body;

    // Delete existing technicians to replace them if provided
    if (technicians) {
      await prisma.technician.deleteMany({
        where: { reportId: Number(id) }
      });
    }

    // Upload new photos to Cloudinary if they are base64 strings
    const processedSituationBefore = situationBefore !== undefined ? await processPhotoArray(situationBefore) : existingReport.situationBefore;
    const processedSituationAfter = situationAfter !== undefined ? await processPhotoArray(situationAfter) : existingReport.situationAfter;
    const processedPresencePhotos = presencePhotos !== undefined ? await processPhotoArray(presencePhotos) : existingReport.presencePhotos;
    const processedClientSignature = clientSignature !== undefined ? await processSignature(clientSignature) : existingReport.clientSignature;
    const processedTechnicianSignature = technicianSignature !== undefined ? await processSignature(technicianSignature) : existingReport.technicianSignature;
    const processedItManagerSignature = itManagerSignature !== undefined ? await processSignature(itManagerSignature) : existingReport.itManagerSignature;

    const calculatedStatus = processedItManagerSignature ? 'VALIDE' : (status || existingReport.status || 'EN_ATTENTE_SIGNATURE');

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        date: date ? new Date(date) : existingReport.date,
        interventionType: interventionType || existingReport.interventionType,
        startTime: startTime || existingReport.startTime,
        endTime: endTime || existingReport.endTime,
        duration: duration ? parseFloat(duration) : existingReport.duration,
        price: price !== undefined ? (price ? parseFloat(price) : null) : existingReport.price,
        quarter: quarter !== undefined ? quarter : existingReport.quarter,
        clientName: clientName || existingReport.clientName,
        agencyName: agencyName !== undefined ? agencyName : existingReport.agencyName,
        clientAddress: clientAddress || existingReport.clientAddress,
        clientDepartment: clientDepartment || existingReport.clientDepartment,
        clientCommune: clientCommune !== undefined ? clientCommune : existingReport.clientCommune,
        problemsEncountered: problemsEncountered !== undefined ? problemsEncountered : existingReport.problemsEncountered,
        situationBefore: processedSituationBefore,
        solutionProvided: solutionProvided !== undefined ? solutionProvided : existingReport.solutionProvided,
        situationAfter: processedSituationAfter,
        remarks: remarks !== undefined ? remarks : existingReport.remarks,
        status: calculatedStatus,
        technicianName: technicianName !== undefined ? technicianName : existingReport.technicianName,
        technicianSignature: processedTechnicianSignature,
        technicianSignedAt: processedTechnicianSignature && !existingReport.technicianSignature ? new Date() : existingReport.technicianSignedAt,
        itManagerName: itManagerName !== undefined ? itManagerName : existingReport.itManagerName,
        itManagerDepartment: itManagerDepartment !== undefined ? itManagerDepartment : existingReport.itManagerDepartment,
        itManagerSignature: processedItManagerSignature,
        itManagerSignedAt: processedItManagerSignature && !existingReport.itManagerSignature ? new Date() : existingReport.itManagerSignedAt,
        clientRepresentative: clientRepresentative !== undefined ? clientRepresentative : existingReport.clientRepresentative,
        representativeRole: representativeRole !== undefined ? representativeRole : existingReport.representativeRole,
        validationDate: processedClientSignature ? new Date() : existingReport.validationDate,
        clientSignature: processedClientSignature,
        presencePhotos: processedPresencePhotos,
        ...(technicians ? {
          technicians: {
            create: technicians
          }
        } : {})
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

export const signReportByItManager = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const role = req.user?.role;
    // @ts-ignore
    const department = req.user?.department;
    // @ts-ignore
    const userFirstName = req.user?.firstName || '';
    // @ts-ignore
    const userLastName = req.user?.lastName || '';
    
    const { itManagerName, itManagerSignature, itManagerDepartment } = req.body;

    const existingReport = await prisma.report.findUnique({
      where: { id: Number(id) }
    });

    if (!existingReport) {
      res.status(404).json({ message: 'Rapport introuvable' });
      return;
    }

    if (role === 'RESPONSABLE_INFO' && department && existingReport.clientDepartment.toLowerCase() !== department.toLowerCase()) {
      res.status(403).json({ 
        message: `Accès refusé : vous êtes assigné(e) au département ${department}, ce rapport concerne ${existingReport.clientDepartment}.` 
      });
      return;
    }

    const processedSignature = await processSignature(itManagerSignature);

    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        itManagerName: itManagerName || `${userFirstName} ${userLastName}`.trim() || 'Responsable Informatique',
        itManagerDepartment: itManagerDepartment || department || existingReport.clientDepartment,
        itManagerSignature: processedSignature,
        itManagerSignedAt: new Date(),
        status: 'VALIDE'
      },
      include: {
        technicians: true,
        user: { select: { firstName: true, lastName: true } }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erreur signature Responsable Informatique:', error);
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
