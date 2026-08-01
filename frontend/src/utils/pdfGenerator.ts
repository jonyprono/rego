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
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Modern colors
  const primaryColor: [number, number, number] = [20, 40, 75]; // Dark professional blue
  const accentColor: [number, number, number] = [240, 244, 248]; // Light gray-blue
  const textColor: [number, number, number] = [60, 60, 60];

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 10) { // leave room for footer
      doc.addPage();
      currentY = margin + 5;
      return true;
    }
    return false;
  };

  // --- 1. HEADER (Compact & Modern) ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  try {
    const logoBase64 = await getBase64ImageFromURL('/logo rego.jpg');
    doc.addImage(logoBase64, 'JPEG', margin, 5, 32, 16);
  } catch (e) {
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REGO", margin, 18);
  }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RAPPORT D'INTERVENTION", pageWidth - margin, 12, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${reportData.reportNumber || 'Brouillon'}  |  ${new Date(reportData.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, 19, { align: 'right' });
  
  currentY = 35;

  // --- 2. INFORMATIONS (Unified 2-column layout) ---
  autoTable(doc, {
    startY: currentY,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: textColor },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 25 },
      1: { cellWidth: 68 },
      2: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 25 },
      3: { cellWidth: 68 }
    },
    body: [
      ['Client:', reportData.clientName || 'N/A', 'Intervention:', reportData.interventionType || 'N/A'],
      ['Agence:', reportData.agencyName || 'N/A', 'Horaires:', `${reportData.startTime || '--:--'} à ${reportData.endTime || '--:--'}`],
      ['Adresse:', reportData.clientAddress || 'N/A', 'Trimestre:', reportData.quarter || 'N/A'],
      ['Départ/', reportData.clientDepartment || 'N/A', 'Techniciens:', reportData.technicians?.map((t:any) => t.fullName).join(', ') || 'N/A']
    ]
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Divider
  doc.setDrawColor(230);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // --- 3. TEXT SECTIONS (Compact) ---
  const addCompactText = (title: string, content: string) => {
    if (!content) return;
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, margin, currentY + 4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const splitText = doc.splitTextToSize(content, contentWidth);
    doc.text(splitText, margin, currentY + 9);
    currentY += 9 + (splitText.length * 4) + 2;
  };

  addCompactText('PROBLÉMATIQUES RENCONTRÉES :', reportData.problemsEncountered);
  addCompactText('SOLUTION APPORTÉE :', reportData.solutionProvided);
  if (reportData.remarks) addCompactText('REMARQUES :', reportData.remarks);

  currentY += 2;

  // --- 4. IMAGES SECTIONS (4 per row to save space) ---
  const addCompactImages = async (title: string, imagesJson: string) => {
    if (!imagesJson) return;
    try {
      const images: string[] = JSON.parse(imagesJson);
      if (images.length === 0) return;

      checkPageBreak(35);
      
      // Title bar
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(margin, currentY, contentWidth, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(title.toUpperCase(), margin + 2, currentY + 4.2);
      currentY += 9;

      const imgWidth = 43; // 4 images fit in 186 width (43*4 = 172 + gaps = 186)
      const imgHeight = 32;
      const gap = (contentWidth - (imgWidth * 4)) / 3;
      
      let x = margin;
      let count = 0;

      for (let i = 0; i < images.length; i++) {
        if (count === 4) {
          x = margin;
          currentY += imgHeight + 4;
          count = 0;
          checkPageBreak(imgHeight + 10);
        }
        
        const base64 = images[i];
        
        // Image Frame
        doc.setDrawColor(220);
        doc.rect(x - 0.5, currentY - 0.5, imgWidth + 1, imgHeight + 1);
        
        const match = base64.match(/^data:image\/(png|jpeg|jpg);base64,/i);
        const format = match ? match[1].toUpperCase() : 'JPEG';
        
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
        
        x += imgWidth + gap;
        count++;
      }
      currentY += imgHeight + 6;
      
    } catch (e) {
      console.error("Erreur images", e);
    }
  };

  const presencePhotosObj = reportData.photos?.filter((p: any) => p.type === 'presence').map((p: any) => p.url) || [];
  let presencePhotosStr = reportData.presencePhotos || (presencePhotosObj.length > 0 ? JSON.stringify(presencePhotosObj) : '');

  await addCompactImages('Présence sur Site', presencePhotosStr);
  await addCompactImages('Avant Intervention', reportData.situationBefore);
  await addCompactImages('Après Intervention', reportData.situationAfter);

  // --- 5. SIGNATURE ---
  checkPageBreak(30);
  doc.setDrawColor(220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("VALIDATION CLIENT", margin, currentY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Signataire : ${reportData.clientRepresentative || 'N/A'}`, margin, currentY + 10);
  doc.text(`Fonction : ${reportData.representativeRole || 'N/A'}`, margin, currentY + 15);

  if (reportData.clientSignature) {
    try {
      doc.addImage(reportData.clientSignature, 'PNG', margin + 80, currentY, 40, 20);
    } catch (e) {
      doc.text("Erreur signature", margin + 80, currentY + 10);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune signature numérique', margin + 80, currentY + 10);
  }

  // --- 6. ADD FOOTER & PAGE NUMBERS ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 6;
    doc.setDrawColor(220);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("REGO Maintenance & Sécurité - Document généré automatiquement", margin, footerY);
    doc.text(`Page ${i}/${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  doc.save(`rapport-intervention-${reportData.reportNumber || 'draft'}.pdf`);
};
