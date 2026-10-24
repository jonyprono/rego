import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
};

export const generateReportPDF = async (reportData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = 15;

  // Helper for page breaks
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // --- 1. LOGO & HEADER ---
  try {
    const logoBase64 = await getBase64ImageFromURL('/logo rego.jpg');
    const logoWidth = 28;
    const logoHeight = 14;
    doc.addImage(logoBase64, 'JPEG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 10;
  } catch (e) {
    console.error("Logo introuvable");
    currentY += 15;
  }

  // --- 2. PREMIUM BANNER ---
  doc.setFillColor(15, 38, 70); // Very elegant dark slate blue
  const bannerHeight = 45;
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 3, 3, 'F');
  
  doc.setTextColor(255);
  
  // A. TITRE
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT D'INTERVENTION", pageWidth / 2, currentY + 16, { align: 'center' });
  
  // B. SOUS-TITRE
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 230);
  doc.text(reportData.interventionType?.toUpperCase() || "MAINTENANCE", pageWidth / 2, currentY + 24, { align: 'center' });

  // C. DATE & D. CLIENT
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255);
  const dateStr = `Date : ${new Date(reportData.date || new Date()).toLocaleDateString('fr-FR')}`;
  doc.text(dateStr, margin + 8, currentY + 36);
  
  const clientStr = `Client : ${reportData.clientName?.toUpperCase() || 'N/A'}`;
  doc.text(clientStr, pageWidth - margin - 8, currentY + 36, { align: 'right' });

  currentY += bannerHeight + 12;

  // --- 3. DÉTAILS INTERVENTION ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 38, 70);
  doc.text("Détails Intervention", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5, lineColor: [220, 220, 220], lineWidth: 0.1 },
    headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: 'bold' },
    body: [
      [
        { content: `Type: ${reportData.interventionType || 'N/A'}` },
        { content: `Date: ${new Date(reportData.date).toLocaleDateString('fr-FR')}` },
        { content: `Début: ${reportData.startTime || '--:--'}` },
        { content: `Fin: ${reportData.endTime || '--:--'}` },
        { content: `Durée: ${reportData.duration || 0}h` }
      ],
      [
        { content: `N° de Rapport: ${reportData.reportNumber || 'Brouillon'}`, colSpan: 2 },
        { content: `Trimestre: ${reportData.quarter || 'N/A'}`, colSpan: 3 }
      ]
    ],
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 4. ENTREPRISE CLIENT ---
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 38, 70);
  doc.text('Entreprise Client', margin, currentY);
  currentY += 5;

  const deptCommune = reportData.clientDepartment + (reportData.clientCommune ? ` (${reportData.clientCommune})` : '');
  const clientData = [
    ['Nom complet:', reportData.clientName, 'Agence:', reportData.agencyName || 'N/A'],
    ['Adresse postale:', reportData.clientAddress, 'Département:', deptCommune]
  ];

  autoTable(doc, {
    startY: currentY,
    body: clientData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5, lineColor: [220, 220, 220], lineWidth: 0.1 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [30, 41, 59], cellWidth: 35 },
      1: { cellWidth: 55, textColor: [50, 50, 50] },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [30, 41, 59], cellWidth: 35 },
      3: { cellWidth: 55, textColor: [50, 50, 50] }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 5. ÉQUIPE TECHNIQUE ---
  checkPageBreak(25);
  const technicians = reportData.technicians?.length ? reportData.technicians : [{ fullName: 'Aucun', techId: '-' }];
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 38, 70);
  doc.text(`Équipe Technique (${technicians.length})`, margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.1 },
    head: [['Nom complet', 'Identifiant', 'Rôle']],
    body: technicians.map((t: any) => [t.fullName, t.techId || 'N/A', 'Technicien']),
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Helper for text sections
  const addTextSection = (title: string, content: string, headerColor: number[]) => {
    checkPageBreak(30);
    // Header
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, margin + 4, currentY + 5.5);
    currentY += 6;
    
    // Border for content
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 250);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    
    const splitText = doc.splitTextToSize(content || 'Aucune information fournie.', contentWidth - 8);
    const boxHeight = Math.max(14, splitText.length * 5 + 6);
    
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1, 1, 'FD');
    doc.text(splitText, margin + 4, currentY + 6);
    
    currentY += boxHeight + 4;
  };

  // Helper for images sections (GRID)
  const addImagesSection = async (title: string, imagesJson: string, headerColor: number[]) => {
    if (!imagesJson) return;
    try {
      const images: string[] = JSON.parse(imagesJson);
      if (images.length === 0) return;

      checkPageBreak(45);

      // Header
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'F');
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(title, margin + 4, currentY + 5.5);
      currentY += 8 + 3;

      // 4 images per row
      const imgWidth = 40;
      const imgHeight = 30;
      const gap = 4;
      
      const rows = [];
      for (let i = 0; i < images.length; i += 4) {
        rows.push(images.slice(i, i + 4));
      }
      
      for (const row of rows) {
        checkPageBreak(imgHeight + 15);
        
        const rowWidth = row.length * imgWidth + (row.length - 1) * gap;
        const startX = margin + (contentWidth - rowWidth) / 2;
        
        for (let idx = 0; idx < row.length; idx++) {
          const base64 = row[idx];
          const x = startX + idx * (imgWidth + gap);
          
          // Frame
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(x - 1, currentY - 1, imgWidth + 2, imgHeight + 2, 1, 1, 'FD');
          
          const match = base64.match(/^data:image\/(png|jpeg|jpg);base64,/i);
          const format = match ? match[1].toUpperCase() : 'JPEG';
          
          // Get dimensions to preserve aspect ratio
          const {w, h} = await new Promise<{w: number, h: number}>(resolve => {
            const img = new Image();
            img.onload = () => resolve({w: img.width, h: img.height});
            img.onerror = () => resolve({w: imgWidth, h: imgHeight});
            img.src = base64;
          });
          
          const intrinsicRatio = w / h;
          const targetRatio = imgWidth / imgHeight;
          let drawW = imgWidth;
          let drawH = imgHeight;
          let offsetX = 0;
          let offsetY = 0;
          
          if (intrinsicRatio > targetRatio) {
            drawH = imgWidth / intrinsicRatio;
            offsetY = (imgHeight - drawH) / 2;
          } else {
            drawW = imgHeight * intrinsicRatio;
            offsetX = (imgWidth - drawW) / 2;
          }
          
          doc.addImage(base64, format === 'JPG' ? 'JPEG' : format, x + offsetX, currentY + offsetY, drawW, drawH);
        }
        
        currentY += imgHeight + 4;
      }
      
      currentY += 2;

    } catch (e) {
      console.error("Error drawing images", e);
    }
  };

  // --- 6. SECTIONS DYNAMIQUES ---
  const headerBgColor = [51, 65, 85]; // Slate 700
  
  const presencePhotosObj = reportData.photos?.filter((p: any) => p.type === 'presence').map((p: any) => p.url) || [];
  let presencePhotosStr = '';
  if (reportData.presencePhotos) {
     presencePhotosStr = reportData.presencePhotos;
  } else if (presencePhotosObj.length > 0) {
     presencePhotosStr = JSON.stringify(presencePhotosObj);
  }

  await addImagesSection('Présence sur Site', presencePhotosStr, headerBgColor);
  await addImagesSection('Avant Intervention', reportData.situationBefore, headerBgColor);
  
  addTextSection('Problématiques Rencontrées', reportData.problemsEncountered, headerBgColor);
  
  await addImagesSection('Après Intervention', reportData.situationAfter, headerBgColor);
  
  addTextSection('Solution Apportée', reportData.solutionProvided, headerBgColor);
  
  if (reportData.remarks) {
    addTextSection('Remarques', reportData.remarks, headerBgColor);
  }

  // --- 7. TROIS BLOCS DE VISAS & SIGNATURES ---
  const boxHeight = 44;
  checkPageBreak(boxHeight + 15);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 38, 70);
  doc.text('Visas & Signatures', margin, currentY);
  currentY += 4;

  const gap = 4;
  const boxWidth = (contentWidth - (gap * 2)) / 3;

  const drawSignatureBox = async (
    title: string,
    signerName: string,
    roleOrDept: string,
    signatureUrl: string | undefined | null,
    dateStr: string,
    x: number,
    y: number
  ) => {
    // Fond et bordure globale
    doc.setDrawColor(215, 222, 230);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

    // Bandeau d'en-tête du bloc
    doc.setFillColor(235, 241, 248);
    doc.roundedRect(x, y, boxWidth, 7, 2, 2, 'F');
    doc.rect(x, y + 4, boxWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 38, 70);
    doc.text(title, x + (boxWidth / 2), y + 4.8, { align: 'center' });

    // Nom & Rôle / Département
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    doc.text(doc.splitTextToSize(signerName, boxWidth - 6)[0] || '', x + 3, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(roleOrDept, boxWidth - 6)[0] || '', x + 3, y + 15);

    // Espace de signature image
    const sigY = y + 17;
    const sigH = boxHeight - 23;
    const sigW = boxWidth - 6;

    if (signatureUrl) {
      try {
        const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 60, h: 25 });
          img.src = signatureUrl;
        });

        const intrinsicRatio = w / h;
        let drawW = sigW;
        let drawH = sigH;
        let offsetX = 0;
        let offsetY = 0;

        if (intrinsicRatio > sigW / sigH) {
          drawH = sigW / intrinsicRatio;
          offsetY = (sigH - drawH) / 2;
        } else {
          drawW = sigH * intrinsicRatio;
          offsetX = (sigW - drawW) / 2;
        }

        doc.addImage(signatureUrl, 'PNG', x + 3 + offsetX, sigY + offsetY, drawW, drawH);
      } catch (e) {
        doc.setFontSize(7);
        doc.setTextColor(180, 50, 50);
        doc.text("Erreur signature", x + (boxWidth / 2), sigY + (sigH / 2), { align: 'center' });
      }
    } else {
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text("En attente de signature", x + (boxWidth / 2), sigY + (sigH / 2), { align: 'center' });
    }

    // Date en bas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(100, 116, 139);
    doc.text(dateStr, x + 3, y + boxHeight - 2);
  };

  // 1. Technicien REGO
  const techName = reportData.technicianName || reportData.technicians?.[0]?.fullName || 'Technicien REGO';
  const techDate = reportData.technicianSignedAt 
    ? `Signé le : ${new Date(reportData.technicianSignedAt).toLocaleDateString('fr-FR')}`
    : `Date : ${new Date(reportData.date).toLocaleDateString('fr-FR')}`;
  const techSig = reportData.technicianSignature || null;

  // 2. Responsable Informatique
  const itName = reportData.itManagerName || 'Responsable Informatique';
  const itDept = reportData.itManagerDepartment 
    ? `Dép. ${reportData.itManagerDepartment}`
    : (reportData.clientDepartment ? `Dép. ${reportData.clientDepartment}` : 'Système d\'Information');
  const itDate = reportData.itManagerSignedAt
    ? `Signé le : ${new Date(reportData.itManagerSignedAt).toLocaleDateString('fr-FR')}`
    : (reportData.itManagerSignature ? `Signé le : ${new Date(reportData.date).toLocaleDateString('fr-FR')}` : 'En attente de visa');
  const itSig = reportData.itManagerSignature || null;

  // 3. Client
  const clientRepName = reportData.clientRepresentative || 'Représentant Client';
  const clientRepRole = reportData.representativeRole || 'Client Bénéficiaire';
  const clientDate = reportData.validationDate
    ? `Signé le : ${new Date(reportData.validationDate).toLocaleDateString('fr-FR')}`
    : (reportData.clientSignature ? `Signé le : ${new Date(reportData.date).toLocaleDateString('fr-FR')}` : 'En attente de signature');
  const clientSig = reportData.clientSignature || null;

  const col1X = margin;
  const col2X = margin + boxWidth + gap;
  const col3X = margin + (boxWidth * 2) + (gap * 2);

  await drawSignatureBox("1. Technicien REGO", techName, "Intervenant certifié", techSig, techDate, col1X, currentY);
  await drawSignatureBox("2. Resp. Informatique", itName, itDept, itSig, itDate, col2X, currentY);
  await drawSignatureBox("3. Représentant Client", clientRepName, clientRepRole, clientSig, clientDate, col3X, currentY);

  currentY += boxHeight + 8;

  // Footer
  const footerY = pageHeight - 15;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("REGO Maintenance & Sécurité", pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} - Ce document a valeur contractuelle`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save PDF
  const filename = `rapport-intervention-${reportData.reportNumber || 'draft'}.pdf`;
  doc.save(filename);
};
