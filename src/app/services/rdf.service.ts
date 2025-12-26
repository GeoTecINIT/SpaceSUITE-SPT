import { Injectable } from '@angular/core';
import { UserPortfolio, PortfolioItem, LanguageSkill} from '../model/userPortfolio';

@Injectable({
  providedIn: 'root'
})
export class RdfService {

  /* ============================
     Public API
     ============================ */

  getRdfTtlUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToTurtle(model)], { type: 'text/ttl' });
    return window.URL.createObjectURL(blob);
  }

  getRdfXmlUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToRdfXml(model)], { type: 'text/xml' });
    console.log('hola')
    return window.URL.createObjectURL(blob);
  }

  getRdfaUrl(model: UserPortfolio): string {
    const blob = new Blob([this.convertModelToRDFa(model)], { type: 'text/html' });
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
@prefix geospacebok: <https://geospacebok.eu/> .

`;
    
    ttl += `geospacebok:SkillPortfolio rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:WorkExperience rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:Education rdf:type rdfs:Class .\n`;
    ttl += `geospacebok:Project rdf:type rdfs:Class .\n\n`;
    ttl += `geospacebok:LanguageSkill rdf:type rdfs:Class .\n\n`;

    ttl += `<https://geospacebok.eu/portfolio/${model._id}> a geospacebok:SkillPortfolio ;\n`;

    if (model.fullName)
      ttl += `  dcterms:title "${this.escape(model.fullName)}" ;\n`;

    if (model.email)
      ttl += `  dcterms:identifier "email:${this.escape(model.email)}" ;\n`;

    if (model.phone && model.phoneCountryCode)
      ttl += `  dcterms:identifier "tel:${this.escape(model.phoneCountryCode)} - ${this.escape(model.phone)}" ;\n`;

    if (model.shortDescription)
      ttl += `  dcterms:abstract "${this.escape(model.shortDescription)}" ;\n`;

    if (model.profileSummary)
      ttl += `  dcterms:description "${this.escape(model.profileSummary)}" ;\n`;

    if (model.nativeLanguage)
      ttl += `  dcterms:language "${this.escape(model.nativeLanguage)}" ;\n`;

    if (model.updatedAt)
      ttl += `  dcterms:modified "${model.updatedAt instanceof Date ? model.updatedAt.toISOString() : model.updatedAt}" ;\n`;

    model.workExperience.forEach((item, i) => {
      const node = `_:EXPERIENCE${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, 'geospacebok:WorkExperience');
    });

    model.educationAndTraining.forEach((item, i) => {
      const node = `_:EDUCATION${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, 'geospacebok:Education');
    });

    model.projects.forEach((item, i) => {
      const node = `_:PROJECT${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.portfolioItemToTurtle(item, node, 'geospacebok:Project');
    });

    model.languageSkills.forEach((lang, i) => {
      const node = `_:LANG${i}`;
      ttl += `  dcterms:hasPart ${node} ;\n`;
      additionalObjects += this.languageSkillToTurtle(lang, node);
    });

    ttl = ttl.trim().replace(/;$/, '.') + '\n\n';
    ttl += additionalObjects;

    return ttl;
  }

  private portfolioItemToTurtle(item: PortfolioItem, node: string, type: string): string {
    let ttl = `${node} a ${type}\n`;

    if (item.title)
      ttl += `  dcterms:title "${this.escape(item.title)}" ;\n`;

    if (item.description)
      ttl += `  dcterms:description "${this.escape(item.description)}" ;\n`;

    if (item.organization)
      ttl += `  dcterms:publisher "${this.escape(item.organization)}" ;\n`;

    if (item.startDate)
      ttl += `  dcterms:date "${item.startDate}" ;\n`;

    if (item.endDate)
      ttl += `  dcterms:temporal "${item.startDate}-${item.endDate}" ;\n`;

    if (item.city && item.country)
      ttl += `  dcterms:spatial "${item.city}, ${item.country.name}" ;\n`;

    if (item.link)
      ttl += `  dcterms:references <${item.link}> ;\n`;

    item.hardSkills?.forEach(s => ttl += `  dcterms:subject "${this.escape(s)}" ;\n`);
    item.softSkills?.forEach(s => ttl += `  dcterms:subject "${this.escape(s)}" ;\n`);
    item.bokConcepts?.forEach(c => ttl += `  dcterms:relation geospacebok:${this.escape(c)} ;\n`);

    return ttl.trim().replace(/;$/, '.') + '\n\n';
  }

  private languageSkillToTurtle(lang: LanguageSkill, node: string): string {
    return `${node}
  rdf:type geospacebok:LanguageSkill ;
  dcterms:language "${this.escape(lang.language)}" ;
  dcterms:extent "${lang.level}" .

`;
  }

  /* ============================
     RDF/XML
     ============================ */

    private convertModelToRdfXml(model: UserPortfolio): string {
      const rdfNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
      const rdfsNS = 'http://www.w3.org/2000/01/rdf-schema#';
      const dcterms = 'http://purl.org/dc/terms/';
      const geospacebok = 'https://geospacebok.eu/';

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<rdf:RDF xmlns:rdf="${rdfNS}" xmlns:rdfs="${rdfsNS}" xmlns:dcterms="${dcterms}" xmlns:geospacebok="${geospacebok}">\n\n`;

      // Declare classes
      ['SkillPortfolio', 'WorkExperience', 'Education', 'Project', 'LanguageSkill'].forEach(c => {
        xml += `  <rdf:Description rdf:about="${geospacebok}${c}">\n`;
        xml += `    <rdf:type rdf:resource="${rdfsNS}Class"/>\n`;
        xml += `  </rdf:Description>\n\n`;
      });

      // Portfolio root
      const portfolioUri = `${geospacebok}portfolio/${model._id}`;
      xml += `  <rdf:Description rdf:about="${portfolioUri}">\n`;
      xml += `    <rdf:type rdf:resource="${geospacebok}SkillPortfolio"/>\n`;

      if (model.fullName) xml += `    <dcterms:title>${this.escapeXml(model.fullName)}</dcterms:title>\n`;
      if (model.email) xml += `    <dcterms:identifier>email:${this.escapeXml(model.email)}</dcterms:identifier>\n`;
      if (model.phone && model.phoneCountryCode) {
        xml += `    <dcterms:identifier>tel:${this.escapeXml(model.phoneCountryCode)}-${this.escapeXml(model.phone)}</dcterms:identifier>\n`;
      }
      if (model.shortDescription) xml += `    <dcterms:abstract>${this.escapeXml(model.shortDescription)}</dcterms:abstract>\n`;
      if (model.profileSummary) xml += `    <dcterms:description>${this.escapeXml(model.profileSummary)}</dcterms:description>\n`;
      if (model.nativeLanguage) xml += `    <dcterms:language>${this.escapeXml(model.nativeLanguage)}</dcterms:language>\n`;
      if (model.updatedAt) {
        const dt = model.updatedAt.toDate().toISOString();

        xml += `    <dcterms:modified>${this.escapeXml(dt)}</dcterms:modified>\n`;
      }

      const itemsXml: string[] = [];

      const addItem = (item: PortfolioItem, type: string, nodeId: string) => {
        xml += `    <dcterms:hasPart rdf:nodeID="${nodeId}"/>\n`;

        let x = `  <rdf:Description rdf:nodeID="${nodeId}">\n`;
        x += `    <rdf:type rdf:resource="${geospacebok}${type}"/>\n`;
        if (item.title) x += `    <dcterms:title>${this.escapeXml(item.title)}</dcterms:title>\n`;
        if (item.description) x += `    <dcterms:description>${this.escapeXml(item.description)}</dcterms:description>\n`;
        if (item.organization) x += `    <dcterms:publisher>${this.escapeXml(item.organization)}</dcterms:publisher>\n`;
        if (item.startDate) x += `    <dcterms:date>${this.escapeXml(item.startDate.toISOString())}</dcterms:date>\n`;
        if (item.endDate) x += `    <dcterms:temporal>${this.escapeXml(item.startDate.toISOString())}-${this.escapeXml(item.endDate.toISOString())}</dcterms:temporal>\n`;
        if (item.city && item.country) x += `    <dcterms:spatial>${this.escapeXml(item.city)}, ${this.escapeXml(item.country.name)}</dcterms:spatial>\n`;
        if (item.link) x += `    <dcterms:references rdf:resource="${item.link}"/>\n`;
        item.hardSkills?.forEach(s => x += `    <dcterms:subject>${this.escapeXml(s)}</dcterms:subject>\n`);
        item.softSkills?.forEach(s => x += `    <dcterms:subject>${this.escapeXml(s)}</dcterms:subject>\n`);
        item.bokConcepts?.forEach(c => x += `    <dcterms:relation rdf:resource="${geospacebok}${this.escapeXml(c)}"/>\n`);
        x += `  </rdf:Description>\n\n`;

        itemsXml.push(x);
      };

      model.workExperience.forEach((item, i) => addItem(item, 'WorkExperience', `EXPERIENCE${i}`));
      model.educationAndTraining.forEach((item, i) => addItem(item, 'Education', `EDUCATION${i}`));
      model.projects.forEach((item, i) => addItem(item, 'Project', `PROJECT${i}`));

      model.languageSkills.forEach((lang, i) => {
        const nodeId = `LANG${i}`;
        xml += `    <dcterms:hasPart rdf:nodeID="${nodeId}"/>\n`;

        let x = `  <rdf:Description rdf:nodeID="${nodeId}">\n`;
        x += `    <rdf:type rdf:resource="${geospacebok}LanguageSkill"/>\n`;
        x += `    <dcterms:language>${this.escapeXml(lang.language)}</dcterms:language>\n`;
        x += `    <dcterms:extent>${this.escapeXml(lang.level)}</dcterms:extent>\n`;
        x += `  </rdf:Description>\n\n`;

        itemsXml.push(x);
      });

      xml += `  </rdf:Description>\n\n`;
      xml += itemsXml.join('');
      xml += `</rdf:RDF>\n`;

      return xml;
    }

  /* ============================
      RDFa 
      ============================ */

    private convertModelToRDFa(model: UserPortfolio): string {
      const geospacebok = 'https://geospacebok.eu/';

      let html =
`<div
  vocab="http://purl.org/dc/terms/"
  prefix="geospacebok: ${geospacebok}"
  about="${geospacebok}portfolio/${model._id}"
  typeof="geospacebok:SkillPortfolio"
>\n`;

      if (model.fullName)
        html += `  <span property="title">${this.escapeHtml(model.fullName)}</span><br/>\n`;

      if (model.email)
        html += `  <span property="identifier">email:${this.escapeHtml(model.email)}</span><br/>\n`;

      if (model.phone && model.phoneCountryCode)
        html += `  <span property="identifier">tel:${this.escapeHtml(model.phoneCountryCode)}-${this.escapeHtml(model.phone)}</span><br/>\n`;

      if (model.shortDescription)
        html += `  <p property="abstract">${this.escapeHtml(model.shortDescription)}</p>\n`;

      if (model.profileSummary)
        html += `  <p property="description">${this.escapeHtml(model.profileSummary)}</p>\n`;

      if (model.nativeLanguage)
        html += `  <span property="language">${this.escapeHtml(model.nativeLanguage)}</span><br/>\n`;

      if (model.updatedAt) {
        const dt = model.updatedAt.toDate().toISOString();
        html += `  <time property="modified">${this.escapeHtml(dt)}</time><br/>\n`;
      }

      const addItem = (item: PortfolioItem, type: string, nodeId: string) => {
        html +=
`  <div rel="hasPart"
      typeof="geospacebok:${type}"
      about="#${nodeId}">
`;

        if (item.title)
          html += `    <span property="title">${this.escapeHtml(item.title)}</span><br/>\n`;

        if (item.description)
          html += `    <span property="description">${this.escapeHtml(item.description)}</span><br/>\n`;

        if (item.organization)
          html += `    <span property="publisher">${this.escapeHtml(item.organization)}</span><br/>\n`;

        if (item.startDate)
          html += `    <span property="date">${this.escapeHtml(item.startDate.toISOString())}</span><br/>\n`;

        if (item.endDate)
          html += `    <span property="temporal">${this.escapeHtml(item.startDate.toISOString())}-${this.escapeHtml(item.endDate.toISOString())}</span><br/>\n`;

        if (item.city && item.country)
          html += `    <span property="spatial">${this.escapeHtml(item.city)}, ${this.escapeHtml(item.country.name)}</span><br/>\n`;

        if (item.link)
          html += `    <a property="references" href="${item.link}">${item.link}</a><br/>\n`;

        item.hardSkills?.forEach(s =>
          html += `    <span property="subject">${this.escapeHtml(s)}</span><br/>\n`
        );

        item.softSkills?.forEach(s =>
          html += `    <span property="subject">${this.escapeHtml(s)}</span><br/>\n`
        );

        item.bokConcepts?.forEach(c =>
          html += `    <a property="relation" href="${geospacebok}${this.escapeHtml(c)}">${this.escapeHtml(c)}</a><br/>\n`
        );

        html += `  </div>\n`;
      };

      model.workExperience.forEach((item, i) =>
        addItem(item, 'WorkExperience', `EXPERIENCE${i}`)
      );

      model.educationAndTraining.forEach((item, i) =>
        addItem(item, 'Education', `EDUCATION${i}`)
      );

      model.projects.forEach((item, i) =>
        addItem(item, 'Project', `PROJECT${i}`)
      );

      model.languageSkills.forEach((lang, i) => {
        html +=
`  <div rel="hasPart"
      typeof="geospacebok:LanguageSkill"
      about="#LANG${i}">
    <span property="language">${this.escapeHtml(lang.language)}</span><br/>
    <span property="extent">${this.escapeHtml(lang.level)}</span><br/>
  </div>
`;
      });

      html += `</div>\n`;
      return html;
    }



  /* ============================
     Escaping helpers
     ============================ */

  private escape(str: string): string {
    console.log('Escaping string:', str);
    const inlineString: string = str
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(" ");
    return inlineString.replace(/[<>&'"]/g, c =>
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
