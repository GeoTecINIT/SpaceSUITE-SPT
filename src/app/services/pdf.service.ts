import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { PortfolioItem, UserPortfolio } from '../model/userPortfolio';
import { PdfResult } from '../model/pdfResult';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, concatMap, filter, finalize, first, forkJoin, from, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { FormDataService } from './formData.service';

@Injectable({ providedIn: 'root' })
export class PdfService {

  private poppinsRegular?: string;
  private poppinsItalic?: string;
  private poppinsBold?: string;
  private spaceSuiteWhiteLogo?: string;
  private EULogo?: string;
  private watermark?: string;

  private resourcesLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private scaleFactor: number = 1.5;

  constructor(private http: HttpClient, private bokUtils: BokInformationService, private formDataService: FormDataService) {
    const poppinsRegular$ = this.loadFont('assets/fonts/poppins/Poppins-Regular.ttf').pipe(
      first(), 
      map(font => this.poppinsRegular = font)
    );
    const poppinsBold$ = this.loadFont('assets/fonts/poppins/Poppins-Bold.ttf').pipe(
      first(), 
      map(font => this.poppinsBold = font)
    );
    const poppinsItalic$ = this.loadFont('assets/fonts/poppins/Poppins-Italic.ttf').pipe(
      first(), 
      map(font => this.poppinsItalic = font),
    );
    const footerImage$ = this.http.get('assets/images/SpaceSUITE_horizontal_white.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.spaceSuiteWhiteLogo = image)
    );
    const footerImage2$ = this.http.get('assets/images/EU_Funding.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.EULogo = image)
    );
    const watermarkImage$ = this.http.get('assets/images/watermark.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.watermark = image)
    );
    forkJoin([poppinsRegular$, poppinsBold$, poppinsItalic$, footerImage$, footerImage2$, watermarkImage$]).pipe(finalize(() => this.resourcesLoaded.next(true))).subscribe();
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

  generatePortfolioPdf(portfolio: UserPortfolio): Observable<PdfResult> {
    const portfolioToPrint: UserPortfolio = new UserPortfolio(portfolio);
    const parseBokConcepts$ = this.safeForkJoin([
      this.safeForkJoin(
        portfolioToPrint.workExperience.map(exp =>
          this.parseBokConcepts(exp.bokConcepts).pipe(
            tap(parsed => exp.bokConcepts = parsed || [])
          )
        )
      ),
      this.safeForkJoin(
        portfolioToPrint.educationAndTraining.map(exp =>
          this.parseBokConcepts(exp.bokConcepts).pipe(
            tap(parsed => exp.bokConcepts = parsed || [])
          )
        )
      ),
      this.safeForkJoin(
        portfolioToPrint.projects.map(exp =>
          this.parseBokConcepts(exp.bokConcepts).pipe(
            tap(parsed => exp.bokConcepts = parsed || [])
          )
        )
      ),
      this.formDataService.getCountry(portfolioToPrint.phoneCountryCode || '').pipe(
        tap( country => portfolioToPrint.phoneCountryCode = country?.phoneCode || '')
      )
    ]);
    return this.resourcesLoaded.pipe(filter(value => value === true), take(1), concatMap(() => parseBokConcepts$), map( () => {
      const doc = new jsPDF();
      this.addWatermark(doc);
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

      this.applyMetadata(doc, portfolioToPrint);
      y = this.renderHeader(doc, portfolioToPrint, y);
      y = this.renderSummary(doc, portfolioToPrint, y);
      y = this.renderWorkExperience(doc, portfolioToPrint, y);
      y = this.renderEducation(doc, portfolioToPrint, y);
      y = this.renderProjects(doc, portfolioToPrint, y);
      y = this.renderLanguages(doc, portfolioToPrint, y);
      this.renderFooter(doc);

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      return {
        blob,
        url,
        filename: this.buildFilename(portfolioToPrint)
      };
    }));
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
    FOOTER
  ============================ */

  private renderFooter(doc: jsPDF, y = 275): void {
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

    if (this.EULogo) {
      const props = doc.getImageProperties(this.EULogo);
      const imgWidthPx = props.width;
      const imgHeightPx = props.height
      const targetWidth = 30;
      const ratio = imgHeightPx / imgWidthPx;
      const targetHeight = targetWidth * ratio;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(
        this.EULogo,
        'PNG',
        pageWidth - targetWidth - 20,
        y + footerHeight / 2 - targetHeight / 2,
        targetWidth,
        targetHeight
      );
    }

    if (this.spaceSuiteWhiteLogo) {
      const props = doc.getImageProperties(this.spaceSuiteWhiteLogo);
      const imgWidthPx = props.width;
      const imgHeightPx = props.height
      const targetWidth = 30;
      const ratio = imgHeightPx / imgWidthPx;
      const targetHeight = targetWidth * ratio;
      doc.addImage(
        this.spaceSuiteWhiteLogo,
        'PNG',
        20,
        y + footerHeight / 2 - targetHeight / 2,
        targetWidth,
        targetHeight
      );
    }
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

  private checkEnd(doc: jsPDF, y: number, contentSize: number = 0): number {
    if (y + contentSize > 270) {
      this.renderFooter(doc);
      doc.addPage();
      this.addWatermark(doc);
      return 20;
    }
    return y;
  }

  private addWatermark(doc: jsPDF): void {
    if (this.watermark) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(this.watermark, 'PNG', 0, 0, pageWidth, pageHeight);
    }
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
    let date: string = item.startDate.toLocaleDateString() + ' - ';
    if (item.endDate !== null && item.endDate != undefined) {
      date += item.endDate.toLocaleDateString();
    } else{
      date += 'current';
    }
    doc.text(date, 20, y);
    doc.setFont('Poppins', 'normal')

    y += 4 * 1.35;
    y = this.checkEnd(doc, y);
    doc.text(item.organization, 20, y);

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
      const lines = doc.splitTextToSize(item.description, 170);
      const linesSize = lines.length * 4 * 1.35;
      y = this.checkEnd(doc, y, linesSize);
      doc.text(lines, 20, y);
      y += linesSize;
    }

    const knowledge = item.hardSkills.concat(item.bokConcepts);

    if (knowledge && knowledge.length != 0) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.setFont('Poppins', 'italic');
      doc.text('Knowledge:', 20, y);
      doc.setFont('Poppins', 'normal')
      y += 4 * 1.35;
      const lines = doc.splitTextToSize(knowledge.join('; ') + '.', 170);
      const linesSize = lines.length * 4 * 1.35;
      y = this.checkEnd(doc, y, linesSize);
      doc.text(lines, 20, y);
      y += linesSize;
    }

    if (item.softSkills && item.softSkills.length != 0) {
      y += 4 * 1.35;
      y = this.checkEnd(doc, y);
      doc.setFont('Poppins', 'italic');
      doc.text('Transversal Skills:', 20, y);
      doc.setFont('Poppins', 'normal')
      y += 4 * 1.35;
      const lines = doc.splitTextToSize(item.softSkills.join('; ') + '.', 170);
      const linesSize = lines.length * 4 * 1.35;
      y = this.checkEnd(doc, y, linesSize);
      doc.text(lines, 20, y);
      y += linesSize;
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

  private parseBokConcepts(concepts: string[]): Observable<string[] | null> {
    const conceptsObservables = concepts.map(value => this.bokUtils.getConceptName(value).pipe(first()));
    return this.safeForkJoin(conceptsObservables);
  }

  safeForkJoin = (sources: Observable<any>[]) =>
      sources.length ? forkJoin(sources) : of(null);
}
