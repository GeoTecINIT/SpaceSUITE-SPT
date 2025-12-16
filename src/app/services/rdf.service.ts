import { Injectable } from '@angular/core';
import { UserPortfolio, PortfolioItem, LanguageSkill} from '../model/userPortfolio';

@Injectable({
  providedIn: 'root'
})
export class UserPortfolioRdfConverterService {

  /* ============================
     Public API
     ============================ */

  getRdfTtlUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToTurtle(model)], { type: 'text/ttl' });
    return window.URL.createObjectURL(blob);
  }

  getRdfXmlUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToRdfXml(model)], { type: 'text/xml' });
    return window.URL.createObjectURL(blob);
  }

  getRdfaUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToRdfa(model)], { type: 'text/html' });
    return window.URL.createObjectURL(blob);
  }

  /* ============================
     Turtle
     ============================ */

  private convertModelToTurtle(model: UserPortfolio): string {
    let additionalObjects = '';

    let ttl =
        `@prefix dcterms: <http://purl.org/dc/terms/> .
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
        @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
        @prefix ex: <https://example.com/portfolio/> .

        `;

    ttl += `_:UserPortfolio rdf:type rdfs:Class .\n`;
    ttl += `_:WorkExperience rdf:type rdfs:Class .\n`;
    ttl += `_:Education rdf:type rdfs:Class .\n`;
    ttl += `_:Project rdf:type rdfs:Class .\n\n`;

    const subjectUri = `ex:user/${model._id}`;

    ttl += `<${subjectUri}>\n`;
    ttl += `  rdf:type _:UserPortfolio ;\n`;

    if (model.fullName)
      ttl += `  dcterms:title "${this.escape(model.fullName)}" ;\n`;

    if (model.email)
      ttl += `  dcterms:identifier "${this.escape(model.email)}" ;\n`;

    if (model.shortDescription)
      ttl += `  dcterms:description "${this.escape(model.shortDescription)}" ;\n`;

    if (model.profileSummary)
      ttl += `  dcterms:abstract "${this.escape(model.profileSummary)}" ;\n`;

    if (model.nativeLanguage)
      ttl += `  dcterms:language "${this.escape(model.nativeLanguage)}" ;\n`;

    if (model.updatedAt)
      ttl += `  dcterms:modified "${model.updatedAt instanceof Date ? model.updatedAt.toISOString() : model.updatedAt}" ;\n`;

    model.workExperience.forEach((item, i) => {
      const node = `_:EXPERIENCE${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, '_:WorkExperience');
    });

    model.educationAndTraining.forEach((item, i) => {
      const node = `_:EDUCATION${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, '_:Education');
    });

    model.projects.forEach((item, i) => {
      const node = `_:PROJECT${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, '_:Project');
    });

    model.languageSkills.forEach((lang, i) => {
      const node = `_:LANG${i}`;
      ttl += `  dcterms:language ${node} ;\n`;
      additionalObjects += this.languageSkillToTurtle(lang, node);
    });

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';
    ttl += additionalObjects;

    return ttl;
  }

  private portfolioItemToTurtle(item: PortfolioItem, node: string, type: string): string {
    let ttl = `${node}\n`;
    ttl += `  rdf:type ${type} ;\n`;

    if (item.title)
      ttl += `  dcterms:title "${this.escape(item.title)}" ;\n`;

    if (item.description)
      ttl += `  dcterms:description "${this.escape(item.description)}" ;\n`;

    if (item.organization)
      ttl += `  dcterms:publisher "${this.escape(item.organization)}" ;\n`;

    if (item.startDate)
      ttl += `  dcterms:date "${item.startDate}" ;\n`;

    if (item.endDate)
      ttl += `  dcterms:temporal "${item.startDate}–${item.endDate}" ;\n`;

    if (item.link)
      ttl += `  dcterms:references <${item.link}> ;\n`;

    item.hardSkills?.forEach(s => ttl += `  dcterms:subject "${this.escape(s)}" ;\n`);
    item.softSkills?.forEach(s => ttl += `  dcterms:subject "${this.escape(s)}" ;\n`);
    item.bokConcepts?.forEach(c => ttl += `  dcterms:relation "${this.escape(c)}" ;\n`);

    return ttl.trim().replace(/;$/, '.') + '\n\n';
  }

  private languageSkillToTurtle(lang: LanguageSkill, node: string): string {
    return `${node}
  rdf:type rdfs:Resource ;
  dcterms:language "${this.escape(lang.language)}" ;
  dcterms:extent "${lang.level}" .

`;
  }

  /* ============================
     RDF/XML
     ============================ */

  private convertModelToRdfXml(model: UserPortfolio): string {
    const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const dcterms = 'http://purl.org/dc/terms/';
    const rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
    const ex = 'https://example.com/portfolio/';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rdf:RDF xmlns:rdf="${rdf}" xmlns:dcterms="${dcterms}" xmlns:rdfs="${rdfs}">\n`;

    const subjectUri = `${ex}user/${model._id}`;

    xml += `  <rdf:Description rdf:about="${subjectUri}">\n`;
    xml += `    <rdf:type rdf:resource="${rdfs}Class"/>\n`;

    if (model.fullName)
      xml += `    <dcterms:title>${this.escapeXml(model.fullName)}</dcterms:title>\n`;

    if (model.email)
      xml += `    <dcterms:identifier>${this.escapeXml(model.email)}</dcterms:identifier>\n`;

    if (model.shortDescription)
      xml += `    <dcterms:description>${this.escapeXml(model.shortDescription)}</dcterms:description>\n`;

    if (model.profileSummary)
      xml += `    <dcterms:abstract>${this.escapeXml(model.profileSummary)}</dcterms:abstract>\n`;

    this.appendItemsXml(xml, model.workExperience, 'WorkExperience');
    this.appendItemsXml(xml, model.educationAndTraining, 'Education');
    this.appendItemsXml(xml, model.projects, 'Project');

    xml += `  </rdf:Description>\n`;
    xml += `</rdf:RDF>\n`;

    return xml;
  }

  private appendItemsXml(xml: string, items: PortfolioItem[], type: string): void {
    items.forEach(item => {
      xml += `    <dcterms:hasPart>\n`;
      xml += `      <rdf:Description>\n`;
      xml += `        <rdf:type rdf:resource="${type}"/>\n`;
      if (item.title)
        xml += `        <dcterms:title>${this.escapeXml(item.title)}</dcterms:title>\n`;
      xml += `      </rdf:Description>\n`;
      xml += `    </dcterms:hasPart>\n`;
    });
  }

  /* ============================
     RDFa
     ============================ */

  private convertModelToRdfa(model: UserPortfolio): string {
    const subjectUri = `https://example.com/portfolio/user/${model._id}`;

    let html = `<div vocab="http://purl.org/dc/terms/"
      typeof="http://www.w3.org/2000/01/rdf-schema#Class"
      about="${subjectUri}">\n`;

    if (model.fullName)
      html += `  <span property="title">${this.escapeHtml(model.fullName)}</span><br/>\n`;

    html += this.renderItemsRdfa(model.workExperience, 'WorkExperience');
    html += this.renderItemsRdfa(model.educationAndTraining, 'Education');
    html += this.renderItemsRdfa(model.projects, 'Project');

    html += `</div>`;
    return html;
  }

  private renderItemsRdfa(items: PortfolioItem[], type: string): string {
    let html = '';
    items.forEach(item => {
      html += `  <div rel="hasPart"><div typeof="${type}">\n`;
      if (item.title)
        html += `    <span property="title">${this.escapeHtml(item.title)}</span>\n`;
      html += `  </div></div>\n`;
    });
    return html;
  }

  /* ============================
     Escaping helpers
     ============================ */

  private escape(str: string): string {
    return str.replace(/[<>&'"]/g, c =>
      ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '\'':'&apos;', '"':'&quot;' }[c]!)
    );
  }

  private escapeXml(str: string): string {
    return this.escape(str);
  }

  private escapeHtml(str: string): string {
    return str.replace(/[<>&]/g, c =>
      ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]!)
    );
  }
}
