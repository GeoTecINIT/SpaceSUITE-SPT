/// <reference lib="webworker" />

import jsPDF from 'jspdf';
import { PdfWorkerPayload } from '../model/pdfWorkerPayload';
import { PortfolioItem, UserPortfolio } from '../model/userPortfolio';

addEventListener('message', ({data}: {data: PdfWorkerPayload}) => {
  const { portfolio, assets, scaleFactor } = data;
  const doc = new jsPDF();

  if (!assets.watermark) assets.watermark = '';

  addWatermark(doc, assets.watermark);
  let y = 25;

  if (assets.poppinsRegular) {
    doc.addFileToVFS('Poppins-Regular.ttf', assets.poppinsRegular);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
  }
  if (assets.poppinsBold) {
    doc.addFileToVFS('Poppins-Bold.ttf', assets.poppinsBold);
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
  } 
  if (assets.poppinsItalic) {
    doc.addFileToVFS('Poppins-Italic.ttf', assets.poppinsItalic);
    doc.addFont('Poppins-Italic.ttf', 'Poppins', 'italic');
  }

  doc.setLineHeightFactor(scaleFactor);

  applyMetadata(doc, portfolio);
  y = renderHeader(doc, portfolio, y, assets);
  y = renderSummary(doc, portfolio, y, assets);
  y = renderWorkExperience(doc, portfolio, y, assets);
  y = renderEducation(doc, portfolio, y, assets);
  y = renderProjects(doc, portfolio, y, assets);
  y = renderLanguages(doc, portfolio, y, assets);
  renderFooter(doc, assets);

  const blob = doc.output('blob');

  postMessage({
    blob,
    filename: buildFilename(portfolio)
  });
});

/* ============================
    METADATA
============================ */

function applyMetadata(doc: jsPDF, portfolio: UserPortfolio) {
  doc.setProperties({
    title: `${portfolio.fullName} – Portfolio`,
    subject: getSubjectMetadata(portfolio),
    author: 'SpaceSuite',
    creator: 'SpaceSuite Skill Portfolio',
    keywords: 'spacesuite, skill portfolio, portfolio, cv',
  });
}

function getSubjectMetadata(portfolio: UserPortfolio) {
  let subject = '@prefix dc: <http://purl.org/dc/terms/> . @prefix geospacebok: <https://geospacebok.eu/> . ';
  subject = subject + '<> dc:type "Portfolio"; <> dc:title "' + portfolio.fullName + '"';
  portfolio.educationAndTraining.concat(portfolio.projects).concat(portfolio.workExperience).forEach((item: PortfolioItem) => {
    item.bokConcepts.forEach(know => {
      const bokCode = know.split(']', 1)[0].split('[', 2)[1];
      if (bokCode) {
        subject = subject + '; dc:relation geospacebok:' + bokCode;
      }
    });
  });
  subject = subject + '  .';
  return subject;
}

/* ============================
    HEADER
============================ */

function renderHeader(doc: jsPDF, p: UserPortfolio, y: number,  assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  doc.setFontSize(26).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');

  const lines = doc.splitTextToSize(p.fullName, 170);
  const linesSize = lines.length * 10.4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.text(
    [p.email, p.phone ? `${p.phoneCountryCode ?? ''} ${p.phone}` : null]
      .filter(Boolean)
      .join(' | '),
    20,
    y
  );

  y += 4 * 1.35;
  return y;
}

/* ============================
  FOOTER
============================ */

function renderFooter(doc: jsPDF, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }, y = 275): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerHeight = doc.internal.pageSize.getHeight() - y;

  doc.setFillColor('#0e145d');
  doc.rect(0, y, pageWidth, footerHeight, 'F');

  const page = doc.getCurrentPageInfo().pageNumber;
  doc.setFontSize(9).setFont('Poppins', 'normal');
  doc.setTextColor('#ffffff');
  doc.text(page.toString(), pageWidth / 2, y + footerHeight / 2 + 1) // + 1 
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');

  if (assets.euLogo) {
    const props = doc.getImageProperties(assets.euLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(
      assets.euLogo,
      'PNG',
      pageWidth - targetWidth - 20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight,
      undefined,
      'FAST'
    );
  }

  if (assets.spaceSuiteLogo) {
    const props = doc.getImageProperties(assets.spaceSuiteLogo);
    const imgWidthPx = props.width;
    const imgHeightPx = props.height
    const targetWidth = 30;
    const ratio = imgHeightPx / imgWidthPx;
    const targetHeight = targetWidth * ratio;
    doc.addImage(
      assets.spaceSuiteLogo,
      'PNG',
      20,
      y + footerHeight / 2 - targetHeight / 2,
      targetWidth,
      targetHeight,
      undefined,
      'FAST'
    );
  }
}

/* ============================
    SUMMARY
============================ */

function renderSummary(doc: jsPDF, p: UserPortfolio, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (!p.profileSummary) return y;

  y = sectionTitle(doc, 'Profile Summary', y, assets);

  y += 4 * 1.35;
  const lines = doc.splitTextToSize(p.profileSummary, 170);
  const linesSize = lines.length * 4 * 1.35;
  y = checkEnd(doc, y, linesSize, assets);
  doc.text(lines, 20, y);
  y += linesSize;

  return y;
}

/* ============================
    WORK EXPERIENCE
============================ */

function renderWorkExperience(doc: jsPDF, p: UserPortfolio, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (!p.workExperience.length) return y;

  y = sectionTitle(doc, 'Work Experience', y, assets);

  p.workExperience.forEach(item => {
    y = itemContent(doc, item, y, assets);
  });

  return y;
}

/* ============================
    EDUCATION
============================ */

function renderEducation(doc: jsPDF, p: UserPortfolio, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (!p.educationAndTraining.length) return y;

  y = sectionTitle(doc, 'Education & Training', y, assets);

  p.educationAndTraining.forEach(item => {
    y = itemContent(doc, item, y, assets);
  });

  return y;
}

/* ============================
    PROJECTS
============================ */

function renderProjects(doc: jsPDF, p: UserPortfolio, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (!p.projects.length) return y;

  y = sectionTitle(doc, 'Projects', y, assets);

  p.projects.forEach(item => {
    y = itemContent(doc, item, y, assets);
  });

  return y;
}

/* ============================
    LANGUAGES
============================ */

function renderLanguages(doc: jsPDF, p: UserPortfolio, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (!p.languageSkills.length) return y;

  y = sectionTitle(doc, 'Languages', y, assets);

  if (p.nativeLanguage) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.text(`• ${p.nativeLanguage} – Native`, 20, y);
  }

  p.languageSkills.forEach(ls => {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.text(`• ${ls.language} - ${ls.level}`, 20, y);
  });

  return y;
}

/* ============================
    HELPERS
============================ */

function sectionTitle(doc: jsPDF, title: string, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y += 8 * 1.35;
  y = checkEnd(doc, y, 0, assets);  
  doc.setFontSize(14).setFont('Poppins', 'bold');
  doc.setTextColor('#0e145d');
  doc.text(title, 20, y);
  doc.setFontSize(10).setFont('Poppins', 'normal');
  doc.setTextColor('#0e145d');
  return y + 2 * 1.35;
}

function checkEnd(doc: jsPDF, y: number, contentSize: number = 0, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  if (y + contentSize > 270) {
    renderFooter(doc, assets);
    doc.addPage();
    addWatermark(doc, assets.watermark || '');
    return 20;
  }
  return y;
}

function addWatermark(doc: jsPDF, watermark: string): void {
  if (watermark) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.addImage(watermark, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  }
}

function buildFilename(p: UserPortfolio): string {
  return `${p.fullName.replace(/\s+/g, '_')}_Portfolio.pdf`;
}

function itemContent(doc: jsPDF, item: PortfolioItem, y: number, assets: {
    poppinsRegular?: string | undefined;
    poppinsBold?: string | undefined;
    poppinsItalic?: string | undefined;
    watermark?: string | undefined;
    euLogo?: string | undefined;
    spaceSuiteLogo?: string | undefined;
  }): number {
  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'bold').setFontSize(10);
  doc.text(item.title, 20, y);
  
  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.setFont('Poppins', 'italic');
  let date: string = item.startDate.toLocaleDateString() + ' - ';
  if (item.endDate !== null && item.endDate != undefined) {
    date += item.endDate.toLocaleDateString();
  } else{
    date += 'current';
  }
  doc.text(date, 20, y);
  doc.setFont('Poppins', 'normal')

  y += 4 * 1.35;
  y = checkEnd(doc, y, 0, assets);
  doc.text(item.organization, 20, y);

  if (item.city || item.country) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);

    const parts = [];
    if (item.city) parts.push(item.city);
    if (item.country?.name) parts.push(item.country.name);

    doc.text(parts.join(' - '), 20, y);
  }

  y += 2 * 1.35;
  
  if (item.description) {
    y += 4 * 1.35;
    const lines = doc.splitTextToSize(item.description, 170);
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    doc.text(lines, 20, y);
    y += linesSize;
  }

  const knowledge = item.hardSkills.concat(item.bokConcepts);

  if (knowledge && knowledge.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Knowledge:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    const lines = doc.splitTextToSize(knowledge.join('; ') + '.', 170);
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    doc.text(lines, 20, y);
    y += linesSize;
  }

  if (item.softSkills && item.softSkills.length != 0) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0 , assets);
    doc.setFont('Poppins', 'italic');
    doc.text('Transversal Skills:', 20, y);
    doc.setFont('Poppins', 'normal')
    y += 4 * 1.35;
    const lines = doc.splitTextToSize(item.softSkills.join('; ') + '.', 170);
    const linesSize = lines.length * 4 * 1.35;
    y = checkEnd(doc, y, linesSize, assets);
    doc.text(lines, 20, y);
    y += linesSize;
  }

  if (item.link) {
    y += 4 * 1.35;
    y = checkEnd(doc, y, 0, assets);
    doc.setTextColor('#3fb3f8');
    doc.textWithLink(item.link, 20, y, { url: item.link });
    doc.setTextColor('#0e145d');
    y += 4 * 1.35;
  }

  return y;
}