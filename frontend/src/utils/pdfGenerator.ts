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
    // Centered logo, reduced by ~35% (from 35x18 to 23x12)
    const logoWidth = 23;
    const logoHeight = 12;
    doc.addImage(logoBase64, 'JPEG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 8; // Small space between logo and banner
  } catch (e) {
    console.error("Logo introuvable");
    currentY += 15;
  }

  // --- 2. DARK BLUE BANNER ---
  doc.setFillColor(30, 64, 115); // Dark blue like in the screenshot
  const bannerHeight = 45;
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2, 2, 'F');
  
  doc.setTextColor(255);
  
  // A. TITRE
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT D'INTERVENTION", pageWidth / 2, currentY + 14, { align: 'center' });
  
  // B. SOUS-TITRE
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(reportData.interventionType || "Maintenance", pageWidth / 2, currentY + 22, { align: 'center' });

  // C. DATE & D. CLIENT
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const dateStr = `Date : ${new Date(reportData.date || new Date()).toLocaleDateString('fr-FR')}`;
  doc.text(dateStr, margin + 5, currentY + 32);
  
  const clientStr = `Client : ${reportData.clientName?.toUpperCase() || 'N/A'}`;
  doc.text(clientStr, pageWidth - margin - 5, currentY + 32, { align: 'right' });

  // E. NUMÉRO DU RAPPORT
  const reportNoStr = `N° : ${reportData.reportNumber || 'Brouillon'}`;
  doc.text(reportNoStr, margin + 5, currentY + 40);

  currentY += bannerHeight + 10;

  // --- 3. DÉTAILS INTERVENTION (AutoTable) ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 115);
  doc.text("Détails Intervention", margin, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold' },
    body: [
      [
        { content: `Type: ${reportData.interventionType || 'N/A'}` },
        { content: `Date: ${new Date(reportData.date).toLocaleDateString('fr-FR')}` },
        { content: `Début: ${reportData.startTime || '--:--'}` },
        { content: `Fin: ${reportData.endTime || '--:--'}` },
        { content: `Durée: ${reportData.duration || 0}h` }
      ],
      [
        { content: `Trimestre: ${reportData.quarter || 'N/A'}`, colSpan: 5 }
      ]
    ],
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- 4. ENTREPRISE CLIENT ---
  checkPageBreak(25);
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text('Entreprise Client', margin, currentY);
  currentY += 6;

  // Formatting identical to details table
  const clientData = [
    ['Nom:', reportData.clientName, 'Agence:', reportData.agencyName || 'N/A'],
    ['Adresse:', reportData.clientAddress, 'Département:', reportData.clientDepartment]
  ];

  autoTable(doc, {
    startY: currentY,
    body: clientData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [50, 50, 50], cellWidth: 30 },
      1: { cellWidth: 60, textColor: [50, 50, 50] },
      2: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [50, 50, 50], cellWidth: 30 },
      3: { cellWidth: 60, textColor: [50, 50, 50] }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- 5. ÉQUIPE TECHNIQUE ---
  checkPageBreak(25);
  const technicians = reportData.technicians?.length ? reportData.technicians : [{ fullName: 'Aucun', techId: '-' }];
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 115);
  doc.text(`Équipe Technique (${technicians.length})`, margin, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50] },
    styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.2 },
    head: [['Nom complet', 'Identifiant']],
    body: technicians.map((t: any) => [t.fullName, t.techId]),
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Helper for text sections
  const addTextSection = (title: string, content: string, headerColor: number[]) => {
    checkPageBreak(25);
    // Header
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, margin + 3, currentY + 5);
    currentY += 7;
    
    // Border for content
    doc.setDrawColor(200, 200, 200);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    
    const splitText = doc.splitTextToSize(content || 'Aucun', contentWidth - 6);
    const boxHeight = Math.max(12, splitText.length * 5 + 4);
    
    doc.rect(margin, currentY, contentWidth, boxHeight);
    doc.text(splitText, margin + 3, currentY + 5);
    
    currentY += boxHeight + 6;
  };

  // Helper for images sections (GRID)
  const addImagesSection = (title: string, imagesJson: string, headerColor: number[]) => {
    if (!imagesJson) return;
    try {
      const images: string[] = JSON.parse(imagesJson);
      if (images.length === 0) return;

      checkPageBreak(35);

      // Header
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(title, margin + 3, currentY + 5);
      currentY += 7 + 3;

      // 3 images per row
      const imgWidth = 55;
      const imgHeight = 40;
      const gap = (contentWidth - (imgWidth * 3)) / 2;
      
      // Group images into rows of 3
      const rows = [];
      for (let i = 0; i < images.length; i += 3) {
        rows.push(images.slice(i, i + 3));
      }
      
      rows.forEach(row => {
        checkPageBreak(imgHeight + 10);
        
        // Center the row
        const rowWidth = row.length * imgWidth + (row.length - 1) * gap;
        const startX = margin + (contentWidth - rowWidth) / 2;
        
        row.forEach((base64, idx) => {
          const x = startX + idx * (imgWidth + gap);
          
          // Frame
          doc.setDrawColor(200, 200, 200);
          doc.rect(x - 1, currentY - 1, imgWidth + 2, imgHeight + 2);
          
          const match = base64.match(/^data:image\/(png|jpeg|jpg);base64,/);
          const format = match ? match[1].toUpperCase() : 'JPEG';
          
          doc.addImage(base64, format === 'JPG' ? 'JPEG' : format, x, currentY, imgWidth, imgHeight);
        });
        
        currentY += imgHeight + 5;
      });
      
      currentY += 2;

    } catch (e) {
      console.error("Error drawing images", e);
    }
  };

  // --- 6. SECTIONS DYNAMIQUES ---
  const headerBgColor = [71, 85, 105]; // Professional, unobtrusive Slate Grey
  
  // Find presence photos (fallback to presencePhotos payload or relations)
  const presencePhotosObj = reportData.photos?.filter((p: any) => p.type === 'presence').map((p: any) => p.url) || [];
  let presencePhotosStr = '';
  if (reportData.presencePhotos) {
     presencePhotosStr = reportData.presencePhotos;
  } else if (presencePhotosObj.length > 0) {
     presencePhotosStr = JSON.stringify(presencePhotosObj);
  }

  // 1. Présence sur site
  addImagesSection('Présence sur Site', presencePhotosStr, headerBgColor);
  
  // 2. Image Avant Intervention
  addImagesSection('Avant Intervention', reportData.situationBefore, headerBgColor);
  
  // 3. Problématiques Rencontrées
  addTextSection('Problématiques Rencontrées', reportData.problemsEncountered, headerBgColor);
  
  // 4. Image Après Intervention
  addImagesSection('Après Intervention', reportData.situationAfter, headerBgColor);
  
  // 5. Solution Apportée
  addTextSection('Solution Apportée', reportData.solutionProvided, headerBgColor);
  
  // 6. Remarques et Observations
  if (reportData.remarks) {
    addTextSection('Remarques', reportData.remarks, headerBgColor);
  }

  // --- 7. SIGNATURE ---
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text('Validation Client', 14, currentY);
  currentY += 6;

  // Draw signature box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, currentY, 182, 38, 'FD');

  if (reportData.clientSignature) {
    try {
      // Scale and center signature inside the box
      doc.addImage(reportData.clientSignature, 'PNG', 30, currentY + 4, 50, 20);
    } catch (e) {
      console.error("Signature generation error", e);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text("Erreur signature", 55, currentY + 20, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune signature', 55, currentY + 20, { align: 'center' });
  }

  // Add Name, Role, Date inside the box aligned to the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(reportData.clientRepresentative?.toUpperCase() || '', 190, currentY + 15, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(reportData.representativeRole || '', 190, currentY + 22, { align: 'right' });
  doc.text(`Date: ${new Date(reportData.date).toLocaleDateString('fr-FR')}`, 190, currentY + 29, { align: 'right' });

  // Footer
  const footerY = pageHeight - 15;
  doc.setDrawColor(200);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("REGO Maintenance & Sécurité", pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} - Ce document a valeur contractuelle`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save PDF
  const filename = `rapport-intervention-${reportData.reportNumber || 'draft'}.pdf`;
  doc.save(filename);
};
