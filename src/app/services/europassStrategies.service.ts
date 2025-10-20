import { firstValueFrom, from, lastValueFrom, map, Observable } from "rxjs";
import { CEFRLevel, Country, LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { PDFDocumentProxy } from "pdfjs-dist";
import { FormDataService } from "./formData.service";
import { inject, Injectable } from "@angular/core";
import { StringSimilarityService } from "./stringSimilarity.service";

export interface EuropassStrategy {
	templateId: string;
  	extractData(pdf: PDFDocumentProxy): Observable<UserPortfolio>;
}

type PortfolioMode = 'work' | 'education';

@Injectable({
    providedIn: 'root',
})
export class WhiteEuropassStrategy implements EuropassStrategy {
	templateId: string = '4';

	private formDataService: FormDataService = inject(FormDataService)

	private emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
	private phoneRegex = /\(\+(\d{2})\)\s?(\d{9})/;
	private motherTongueRegex = /mother tongue\(s\):\s*([A-Za-z ,|]+)/i;
	private otherLanguagesRegex = /Other language\(s\):\s*([\s\S]*)/i;

	private stringSimilarityService: StringSimilarityService = inject(StringSimilarityService);

	public extractData(pdf: PDFDocumentProxy): Observable<UserPortfolio> {
		return from(this.parsePortfolioAsync(pdf));
	}

	private async parsePortfolioAsync(pdf: PDFDocumentProxy): Promise<UserPortfolio> {
		const text = await this.extractText(pdf);

		const fullName = this.extractFullName(text);
		const email = this.extractEmail(text);
		const { phoneNumber, countryCode } = await this.extractPhoneNumber(text);
		const motherTongues = this.extractMotherTongues(text);
		const otherLanguages = this.extractOtherLanguages(text);
		const nativeLanguage = motherTongues.length > 0 ? motherTongues[0] : undefined;
		const combinedLanguages: LanguageSkill[] = [
			...motherTongues.slice(1).map(lang => new LanguageSkill({
				language: lang,
				level: 'C2'
			})),
			...otherLanguages
		];
		const workLines = this.getSectionLines(
			text,
			/^WORK EXPERIENCE/i,
			[/^EDUCATION/i, /^LANGUAGE/i]
		);
		const workExperience = await this.extractPortfolioItems(workLines, 'work');

		const educationLines = this.getSectionLines(
			text,
			/^EDUCATION AND TRAINING/i,
			[/^LANGUAGE/i]
		);
		const education = await this.extractPortfolioItems(educationLines, 'education');

		const portfolio: UserPortfolio = new UserPortfolio({
			fullName,
			email,
			phone: phoneNumber,
			phoneCountryCode: countryCode,
			nativeLanguage,
			languageSkills: combinedLanguages,
			workExperience: workExperience,
			educationAndTraining: education
		});

		return portfolio;
	}

	private async extractText(pdf: PDFDocumentProxy): Promise<string> {
		let text = '';
		let orgFont: string | undefined;

		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const content = await page.getTextContent();
			const lines: Map<number, any[]> = this.clusterYPositions(content.items as any[]);
			if (!orgFont) orgFont = this.getOrgFont(lines);
			const sortedLines = this.sortLines(lines, orgFont);
			sortedLines.forEach(line => {
				if (line.endsWith('-') || line.endsWith('‐')) text += line.slice(0, -1).trim();
				else text += line.trim() + '\n';
			});
		}
		return this.normalizeText(text);
	}

	private getOrgFont(lines: Map<number, any[]>): string | undefined {
		let prevLine = ''
		for (const items of lines.values()) {
			items.sort((a, b) => a.transform[4] - b.transform[4]);
			const line = items.map(item => item.str).join('');
			if (prevLine === 'WORK EXPERIENCE') {
				return items[0]?.fontName;
			}
			prevLine = line
		}
		return undefined
	}

	private clusterYPositions(items: any[]): Map<number, any[]> {
		const lines: Map<number, any[]> = new Map();
		for (const item of items) {
			const y = Math.round(item.transform[5]);
			if (!lines.has(y)) lines.set(y, []);
			lines.get(y)!.push(item);
		}
		return lines;
	}

	private sortLines(lines: Map<number, any[]>, orgFont: string | undefined): string[] {
		const sortedLines = Array.from(lines.entries())
			.sort((a, b) => b[0] - a[0]); // PDF y-axis is inverted

		return sortedLines.map(([_, items]) => {
			items.sort((a, b) => a.transform[4] - b.transform[4]);
			let line = '';
			let lastX: number | null = null;
			for (const item of items) {
				if (lastX === null && item.fontName == orgFont) line += 'Organization: ';
				if (lastX !== null && item.transform[4] - lastX > 5) line += ' ';
				line += item.str;
				lastX = item.transform[4] + item.width;
			}
			return line.endsWith('-') ? line.slice(0, -1).trim() : line.trim();
		});
	}

	private normalizeText(raw: string): string {
		return raw
		.replace(/\s+\n/g, '\n')
		.replace(/\n{2,}/g, '\n')
		.trim();
	}

	private extractFullName(raw: string): string {
		const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
		return lines[0];
	}

	private extractEmail(raw: string): string {
		const emailMatch = raw.match(this.emailRegex);
		return emailMatch ? emailMatch[0] : '';
	}

	private async extractPhoneNumber(raw: string): Promise<{ phoneNumber?: string; countryCode?: string; }> {
		const phoneMatch = raw.match(this.phoneRegex);
		const countryCode = phoneMatch ? phoneMatch[1] : undefined;
		const phoneNumber = phoneMatch ? phoneMatch[2] : undefined;

		const format$ = this.formDataService.getCountries().pipe(
			map(countries => {
				const country = countries.find(value => value.phoneCode.slice(1) === countryCode);
				const finalCountryCode = country ? country.iso2 : undefined;
				return { phoneNumber, countryCode: finalCountryCode };
			})
		);

		return await firstValueFrom(format$);
	}

	private extractMotherTongues(raw: string): string[] {
		const match = raw.match(this.motherTongueRegex);
		let languages: string[] = [];
		if (match) languages = match[1].split(/[,|\s]+/).map(lang => lang.trim()).filter(Boolean);
		return languages.map(value => this.capitalizeFirstLetter(value))
	}

	private capitalizeFirstLetter(str: string): string {
		if (!str) return '';
		str = str.toLowerCase();
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	private getPredominantLevel(levels: CEFRLevel[]): CEFRLevel | undefined {
		if (levels.length === 0) return undefined;
		const count: Record<CEFRLevel, number> = {
			A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0
		};
		levels.forEach(l => count[l]++);
		let maxLevel: CEFRLevel = 'A1';
		let maxCount = 0;
		for (const level in count) {
			const lvl = level as CEFRLevel;
			if (count[lvl] > maxCount) {
				maxCount = count[lvl];
				maxLevel = lvl;
			}
		}
		return maxCount > 0 ? maxLevel : undefined;
	}

	private extractOtherLanguages(text: string): LanguageSkill[] {
		const knownLanguages = this.formDataService.getLanguageList();
		const otherMatch = text.match(this.otherLanguagesRegex);
		if (!otherMatch) return [];

		const block = otherMatch[1].trim();
		const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);

		const result: LanguageSkill[] = [];
		let currentLang = '';
		let levels: CEFRLevel[] = [];

		for (const line of lines) {
			const matchedLang = knownLanguages.find(lang =>
				line.toLowerCase().startsWith(lang.toLowerCase())
			);

			if (matchedLang) {
				if (currentLang) {
					result.push(new LanguageSkill({
						language: currentLang,
						level: this.getPredominantLevel(levels)
					}));
				}
				currentLang = matchedLang;
				levels = [];
			} else {
				const foundLevels = line.match(/\b(A1|A2|B1|B2|C1|C2)\b/g) as CEFRLevel[] | null;
				if (foundLevels) levels.push(...foundLevels);
			}
		}

		if (currentLang) {
			result.push(new LanguageSkill({
				language: currentLang,
				level: this.getPredominantLevel(levels)
			}));
		}

		return result;
	}

	private async extractPortfolioItems(lines: string[], mode: PortfolioMode): Promise<PortfolioItem[]> {
		const items: PortfolioItem[] = [];
		let current: {
			organization?: string;
			city?: string;
			country?: Country;
			startDate?: Date;
			endDate?: Date;
			title?: string;
			link?: string;
		} = {};

		for (const line of lines) {
			// --- Title and Date ---
			const dateTitleMatch = line.match(/\[\s*([\d/]+)\s*[-–]\s*(Current|[\d/]+)\s*\]\s*(.*)/);
			if (dateTitleMatch) {
				if (mode === 'education' && current.title) {
					items.push(new PortfolioItem(current));
					current = {};
				}
				current.startDate = this.parseDateEU(dateTitleMatch[1].trim());
				current.endDate = dateTitleMatch[2].trim() !== 'Current' ? this.parseDateEU(dateTitleMatch[2].trim()) : undefined;
				current.title = dateTitleMatch[3].trim();
			}

			// --- Organization and URL ---
			const organizationMatch = line.match(/(?<=Organization:\s).*/);
			if (organizationMatch) {
				let organization = organizationMatch[0].trim();
				const urlRegex = /\b((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:[\/\\][^\s]*)?[\/\\]?)/g;
				const urls = organization.match(urlRegex) || [];
				organization = organization.replace(urlRegex, '').trim();

				if (mode === 'work' && current.country) current.organization = organization;
				else current.organization = current.organization ? current.organization + ' ' + organization : organization;
				if (urls.length) current.link = urls[0];
			}

			// --- City and Country ---
			const cityCountryMatch = line.match(/(?:City:\s*([^|]+?)\s*\|\s*)?Country:\s*([^|]+?)(?:\s*\||$)/);
			if (cityCountryMatch) {
				const country$ = this.formDataService.getCountryByName(cityCountryMatch[2].trim());
				const country = await lastValueFrom(country$);
				if (country) {
					current.country = country;
					if (cityCountryMatch[1]) {
						const cities$ = this.formDataService.getCities(country.iso2);
						const cities = await lastValueFrom(cities$);
						const city = this.stringSimilarityService.findBestMatch(cityCountryMatch[1].trim(), cities);
						current.city = city.bestMatch.rating >= 0.9 ? city.bestMatch.target : undefined;
					}
				}
			}
			if (mode === 'work' && current.title) {
				items.push(new PortfolioItem(current));
				current = {};
			}
		}
		if (mode === 'education') items.push(new PortfolioItem(current));
		return items;
	}

	private getSectionLines(
		text: string,
		startPattern: RegExp,
		endPatterns: RegExp[]
	): string[] {
		const lines = text
			.replace(/\r\n|\r/g, "\n")
			.split("\n")
			.map(line => line.trim())
			.filter(line => line.length > 0);

		let inSection = false;
		const sectionLines: string[] = [];

		for (const line of lines) {
			if (startPattern.test(line)) {
				inSection = true;
				continue;
			}
			if (inSection && endPatterns.some(pattern => pattern.test(line))) {
				break;
			}
			if (inSection) {
				sectionLines.push(line);
			}
		}

		return sectionLines;
	}

	private parseDateEU(dateStr: string): Date | undefined {
		const parts = dateStr.split("/"); // ["dd", "mm", "yyyy"]
		if (parts.length !== 3) return undefined;

		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1; // JS months 0-11
		const year = parseInt(parts[2], 10);

		return new Date(year, month, day);
	}
}