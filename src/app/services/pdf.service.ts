import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { UserPortfolio } from '../model/userPortfolio';
import { PdfResult } from '../model/pdfResult';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generatePortfolioPdf(portfolio: UserPortfolio): PdfResult {
    const doc = new jsPDF();
    let y = 25;

    this.applyMetadata(doc, portfolio);
    y = this.renderHeader(doc, portfolio, y);
    y = this.renderSummary(doc, portfolio, y);
    y = this.renderWorkExperience(doc, portfolio, y);
    y = this.renderEducation(doc, portfolio, y);
    y = this.renderProjects(doc, portfolio, y);
    y = this.renderLanguages(doc, portfolio, y);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      filename: this.buildFilename(portfolio)
    };
  }

  /* ============================
     METADATA
  ============================ */

  private applyMetadata(doc: jsPDF, portfolio: UserPortfolio) {
    doc.setProperties({
      title: `${portfolio.fullName} – Portfolio`,
      subject: 'Professional Portfolio',
      author: 'SpaceSuite',
      creator: 'SpaceSuite'
    });
  }

  /* ============================
     HEADER
  ============================ */

  private renderHeader(doc: jsPDF, p: UserPortfolio, y: number): number {
    doc.setFontSize(26).setFont('Poppins', 'bold');
    doc.setTextColor('#0e145d');
    doc.text(p.fullName, 20, y);
    y += 10;

    doc.setFontSize(10).setFont('Poppins', 'normal');
    doc.text(
      [p.email, p.phone ? `${p.phoneCountryCode ?? ''} ${p.phone}` : null]
        .filter(Boolean)
        .join(' | '),
      20,
      y
    );

    y += 8;
    return y;
  }

  /* ============================
     SUMMARY
  ============================ */

  private renderSummary(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.profileSummary) return y;

    y = this.sectionTitle(doc, 'Profile Summary', y);
    const lines = doc.splitTextToSize(p.profileSummary, 170);
    doc.text(lines, 20, y);

    return y + lines.length * 4;
  }

  /* ============================
     WORK EXPERIENCE
  ============================ */

  private renderWorkExperience(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.workExperience.length) return y;

    y = this.sectionTitle(doc, 'Work Experience', y);

    p.workExperience.forEach(item => {
      y = this.checkEnd(doc, y);

      doc.setFont('Poppins', 'bold').setFontSize(10);
      doc.text(item.title, 20, y);

      doc.setFont('Poppins', 'normal');
      doc.text(item.organization, 20, y + 4);
      y += 8;

      if (item.description) {
        const lines = doc.splitTextToSize(item.description, 170);
        doc.text(lines, 20, y);
        y += lines.length * 4;
      }

      y += 4;
    });

    return y;
  }

  /* ============================
     EDUCATION
  ============================ */

  private renderEducation(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.educationAndTraining.length) return y;

    y = this.sectionTitle(doc, 'Education & Training', y);

    p.educationAndTraining.forEach(item => {
      y = this.checkEnd(doc, y);

      doc.setFont('Poppins', 'bold').setFontSize(10);
      doc.text(item.title, 20, y);
      doc.setFont('Poppins', 'normal');
      doc.text(item.organization, 20, y + 4);

      y += 8;
    });

    return y;
  }

  /* ============================
     PROJECTS
  ============================ */

  private renderProjects(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.projects.length) return y;

    y = this.sectionTitle(doc, 'Projects', y);

    p.projects.forEach(item => {
      y = this.checkEnd(doc, y);

      doc.setFont('Poppins', 'bold').setFontSize(10);
      doc.text(item.title, 20, y);
      y += 5;

      if (item.description) {
        const lines = doc.splitTextToSize(item.description, 170);
        doc.text(lines, 20, y);
        y += lines.length * 4;
      }

      if (item.link) {
        doc.setTextColor('#3fb3f8');
        doc.textWithLink(item.link, 20, y, { url: item.link });
        doc.setTextColor('#0e145d');
        y += 5;
      }
    });

    return y;
  }

  /* ============================
     LANGUAGES
  ============================ */

  private renderLanguages(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.languageSkills.length) return y;

    y = this.sectionTitle(doc, 'Languages', y);

    p.languageSkills.forEach(ls => {
      doc.text(`• ${ls.language} – ${ls.level}`, 20, y);
      y += 4;
    });

    return y;
  }

  /* ============================
     HELPERS
  ============================ */

  private sectionTitle(doc: jsPDF, title: string, y: number): number {
    y += 8;
    doc.setFontSize(14).setFont('Poppins', 'bold');
    doc.setTextColor('#0e145d');
    doc.text(title, 20, y);
    doc.setTextColor('#0e145d');
    return y + 6;
  }

  private checkEnd(doc: jsPDF, y: number): number {
    if (y > 270) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  private buildFilename(p: UserPortfolio): string {
    return `${p.fullName.replace(/\s+/g, '_')}_Portfolio.pdf`;
  }
}
