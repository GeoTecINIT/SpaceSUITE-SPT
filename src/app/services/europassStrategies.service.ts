import { firstValueFrom, from, lastValueFrom, map, Observable, of } from "rxjs";
import { CEFRLevel, Country, LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { PDFDocumentProxy } from "pdfjs-dist";
import { FormDataService } from "./formData.service";
import { inject, Injectable } from "@angular/core";

export interface EuropassStrategy {
	templateId: string;
  	extractData(pdf: PDFDocumentProxy): Observable<UserPortfolio>;
}

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
		const workExperience = await this.extractExperience(text);

		const portfolio: UserPortfolio = new UserPortfolio({
			fullName,
			email,
			phone: phoneNumber,
			phoneCountryCode: countryCode,
			nativeLanguage,
			languageSkills: combinedLanguages,
			workExperience: workExperience
		});

		return portfolio;
	}

	private async extractText(pdf: PDFDocumentProxy): Promise<string> {
		let text = '';

		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const content = await page.getTextContent();
			const lines: Map<number, any[]> = this.clusterYPositions(content.items as any[]);
			const sortedLines = this.sortLines(lines);
			sortedLines.forEach(line => {
				if (line.endsWith('-') || line.endsWith('‐')) text += line.slice(0, -1).trim();
				else text += line.trim() + '\n';
			});
		}
		return this.normalizeText(text);
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

	private sortLines(lines: Map<number, any[]>): string[] {
		const sortedLines = Array.from(lines.entries())
			.sort((a, b) => b[0] - a[0]); // PDF y-axis is inverted

		return sortedLines.map(([_, items]) => {
			items.sort((a, b) => a.transform[4] - b.transform[4]);
			let line = '';
			let lastX: number | null = null;
			for (const item of items) {
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

	private async extractExperience(text: string): Promise<PortfolioItem[]> {
		const workExpLines = this.getWorkExperienceLines(text);
		const experiences: PortfolioItem[] = [];
		let current: {
				organization?: string;
				city?: string;
				country?: Country;
				startDate?: Date;
				endDate?: Date;
				title?: string;
			} = {};
		for (const line of workExpLines) {
			// TODO - Extract organization
    		const cityCountryMatch = line.match(/^City:\s*(.+?)\s*\|\s*Country:\s*(.+)$/);
			if (cityCountryMatch) {
				const country$ = this.formDataService.getCountryByName(cityCountryMatch[2].trim());
				const country = await lastValueFrom(country$);
				// TODO - Check the city in a city list
				current.city = cityCountryMatch[1].trim(),
				current.country = country
			}
			const dateTitleMatch = line.match(/\[\s*([\d/]+)\s*[-–]\s*(Current|[\d/]+)\s*\]\s*(.*)/);
			if (dateTitleMatch) {
				current.startDate = this.parseDateEU(dateTitleMatch[1].trim());
				current.endDate = dateTitleMatch[2].trim() != 'Current' ? this.parseDateEU(dateTitleMatch[2].trim()) : undefined;
				current.title = dateTitleMatch[3].trim();
			}
			if (current.title) {
				experiences.push(new PortfolioItem(current));
				current = {};
			}
		}
		return experiences;
	}

	private getWorkExperienceLines(text: string): string[] {
		const lines = text
			.replace(/\r\n|\r/g, "\n")
			.split("\n")
			.map(line => line.trim())
			.filter(line => line.length > 0);
		
		let inWork = false;
		const workLines: string[] = [];

		for (const line of lines) {
			if (/^WORK EXPERIENCE/i.test(line)) {
				inWork = true;
				continue;
			}
			if (inWork && /^(EDUCATION|LANGUAGE)/i.test(line)) {
				break;
			}
			if (inWork) {
				workLines.push(line);
			}
		}
		return workLines;
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