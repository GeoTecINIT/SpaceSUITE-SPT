import { Injectable } from "@angular/core";
import * as pdfjsLib from 'pdfjs-dist';
import { CEFRLevel, LanguageSkill, UserPortfolio } from "../model/userPortfolio";
import { FormDataService } from "./formData.service";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class EuropassService {

    private emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    private phoneRegex = /\(\+(\d{2})\)\s?(\d{9})/;
    private motherTongueRegex = /mother tongue\(s\):\s*([A-Za-z ,|]+)/i;
    private otherLanguagesRegex = /Other language\(s\):\s*([\s\S]*)/i;

    constructor(private formDataService: FormDataService) {}

    public parseUserPortfolio(file: File): Observable<UserPortfolio> {
        return from(this.parsePortfolioAsync(file));
    }

    private async parsePortfolioAsync(file: File): Promise<UserPortfolio> {
        const text = await this.extractText(file);

        const email = this.extractEmail(text);
        const { phoneNumber, countryCode } = this.extractPhoneNumber(text);
        const motherTongues = this.extractMotherTongues(text);
        const otherLanguages = this.extractOtherLanguages(text);
        const nativeLanguage = motherTongues.length > 0 ? motherTongues[0] : undefined;
        const combinedLanguages: LanguageSkill[] = [
            ...otherLanguages,
            ...motherTongues.slice(1).map(lang => new LanguageSkill({
                language: lang,
                level: 'C2'
            }))
        ];

        const portfolio: UserPortfolio = new UserPortfolio({
            email,
            phone: phoneNumber,
            phoneCountryCode: countryCode,
            nativeLanguage,
            languageSkills: combinedLanguages
        });

        return portfolio;
    }

    private async extractText(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join('') + '\n';
        }

        return this.normalizeText(text);
    }

    private normalizeText(raw: string): string {
        return raw
        .replace(/\s+\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    }

    private extractEmail(raw: string): string {
        const emailMatch = raw.match(this.emailRegex);
        return emailMatch ? emailMatch[0] : '';
    }

    private extractPhoneNumber(raw: string): {phoneNumber?: string, countryCode?: string} {
        const phoneMatch = raw.match(this.phoneRegex);
        const countryCode = phoneMatch ? phoneMatch[1] : undefined;
        const phoneNumber = phoneMatch ? phoneMatch[2] : undefined;
        return {phoneNumber: phoneNumber, countryCode: countryCode}
    }

    private extractMotherTongues(raw: string): string[] {
        const match = raw.match(this.motherTongueRegex);
        let languages: string[] = [];
        if (match) languages = match[1].split(/[,|]/).map(lang => lang.trim()).filter(Boolean);
        return languages
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
}