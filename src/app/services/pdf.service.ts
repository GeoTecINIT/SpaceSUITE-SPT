import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { PortfolioItem, UserPortfolio } from '../model/userPortfolio';
import { PdfResult } from '../model/pdfResult';
import { HttpClient } from '@angular/common/http';
import { first, from, map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfService {

  private poppinsRegular?: string;
  private poppinsItalic?: string;
  private poppinsBold?: string;
  private spaceSuiteLogo?: string;
  private scaleFactor: number = 1.5;
  private readonly baseScaleFactor: number = 1.15;

  constructor(private http: HttpClient) {
    this.loadFont('assets/fonts/poppins/Poppins-Regular.ttf').pipe(
      first(), 
      map(font => this.poppinsRegular = font)
    ).subscribe();

    this.loadFont('assets/fonts/poppins/Poppins-Bold.ttf').pipe(
      first(), 
      map(font => this.poppinsBold = font)
    ).subscribe();

    this.loadFont('assets/fonts/poppins/Poppins-Italic.ttf').pipe(
      first(), 
      map(font => this.poppinsItalic = font),
    ).subscribe();

    this.http.get('assets/images/SpaceSUITE_horizontal_color.png', { responseType: 'blob' }).pipe(
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.spaceSuiteLogo = image)
    ).subscribe();
  }

  private loadFont(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'arraybuffer' }).pipe(
      map(buffer => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      })
    );
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  generatePortfolioPdf(portfolio: UserPortfolio): PdfResult {
    const doc = new jsPDF();
    let y = 25;

    if (this.poppinsRegular) {
      doc.addFileToVFS('Poppins-Regular.ttf', this.poppinsRegular);
      doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    }
    if (this.poppinsBold) {
      doc.addFileToVFS('Poppins-Bold.ttf', this.poppinsBold);
      doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
    } 
    if (this.poppinsItalic) {
      doc.addFileToVFS('Poppins-Italic.ttf', this.poppinsItalic);
      doc.addFont('Poppins-Italic.ttf', 'Poppins', 'italic');
    }

    doc.setLineHeightFactor(this.scaleFactor);

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
    if (this.spaceSuiteLogo) {
      const props = doc.getImageProperties(this.spaceSuiteLogo);
      const imgWidthPx = props.width;
      const imgHeightPx = props.height
      const targetWidth = 80;
      const ratio = imgHeightPx / imgWidthPx;
      const targetHeight = targetWidth * ratio;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(
        this.spaceSuiteLogo,
        'PNG',
        (pageWidth / 2) - (targetWidth / 2),
        y - targetHeight / 2,
        targetWidth,
        targetHeight
      );
      y += (targetHeight + 4) * 1.35
    }

    doc.setFontSize(26).setFont('Poppins', 'bold');
    doc.setTextColor('#0e145d');
    doc.text(p.fullName, 20, y);
    y += 8 * 1.35;

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
     SUMMARY
  ============================ */

  private renderSummary(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.profileSummary) return y;

    y = this.sectionTitle(doc, 'Profile Summary', y);

    y += 4 * 1.35;
    const lines = doc.splitTextToSize(p.profileSummary, 170);
    doc.text(lines, 20, y);

    return y + lines.length * 4 * 1.35;
  }

  /* ============================
     WORK EXPERIENCE
  ============================ */

  private renderWorkExperience(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.workExperience.length) return y;

    y = this.sectionTitle(doc, 'Work Experience', y);

    p.workExperience.forEach(item => {
      y = this.itemContent(doc, item, y);
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
      y = this.itemContent(doc, item, y);
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
      y = this.itemContent(doc, item, y);
    });

    return y;
  }

  /* ============================
     LANGUAGES
  ============================ */

  private renderLanguages(doc: jsPDF, p: UserPortfolio, y: number): number {
    if (!p.languageSkills.length) return y;

    y = this.sectionTitle(doc, 'Languages', y);

    if (p.nativeLanguage) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.text(`• ${p.nativeLanguage} – Native`, 20, y);
    }

    p.languageSkills.forEach(ls => {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.text(`• ${ls.language} - ${ls.level}`, 20, y);
    });

    return y;
  }

  /* ============================
     HELPERS
  ============================ */

  private sectionTitle(doc: jsPDF, title: string, y: number): number {
    y += 8 * 1.35;
    y = this.checkEnd(doc, y);  
    doc.setFontSize(14).setFont('Poppins', 'bold');
    doc.setTextColor('#0e145d');
    doc.text(title, 20, y);
    doc.setFontSize(10).setFont('Poppins', 'normal');
    doc.setTextColor('#0e145d');
    return y + 2 * 1.35;
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

  private itemContent(doc: jsPDF, item: PortfolioItem, y: number): number {
    y += 4 * 1.35;
    y = this.checkEnd(doc, y);
    doc.setFont('Poppins', 'bold').setFontSize(10);
    doc.text(item.title, 20, y);
    
    y += 4 * 1.35;
    y = this.checkEnd(doc, y);
    doc.setFont('Poppins', 'italic');
    doc.text(item.organization, 20, y);
    doc.setFont('Poppins', 'normal')

    if (item.city || item.country) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);

      const parts = [];
      if (item.city) parts.push(item.city);
      if (item.country?.name) parts.push(item.country.name);

      doc.text(parts.join(' - '), 20, y);
    }

    y += 2 * 1.35;
    
    if (item.description) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      const lines = doc.splitTextToSize(item.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 * 1.35;
    }

    const knowledge = item.hardSkills.concat(item.bokConcepts);

    if (knowledge && knowledge.length != 0) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.setFont('Poppins', 'italic');
      doc.text('Knowledge:', 20, y);
      doc.setFont('Poppins', 'normal')
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      const lines = doc.splitTextToSize(knowledge.join('; ') + '.', 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 * 1.35;
    }

    if (item.softSkills && item.softSkills.length != 0) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.setFont('Poppins', 'italic');
      doc.text('Transversal Skills:', 20, y);
      doc.setFont('Poppins', 'normal')
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      const lines = doc.splitTextToSize(item.softSkills.join('; ') + '.', 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 * 1.35;
    }

    if (item.link) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.setTextColor('#3fb3f8');
      doc.textWithLink(item.link, 20, y, { url: item.link });
      doc.setTextColor('#0e145d');
      y += 4 * 1.35;
    }

    return y;
  }
}
