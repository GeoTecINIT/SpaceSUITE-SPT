import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    private languages: Record<string, string> = {
        English: "en",
        Spanish: "es",
        French: "fr",
        German: "de",
        Italian: "it",
        Portuguese: "pt",
        Dutch: "nl",
        Russian: "ru",
        Chinese: "zh",
        Japanese: "ja",
        Korean: "ko",
        Arabic: "ar",
        Hindi: "hi",
        Bengali: "bn",
        Turkish: "tr",
        Greek: "el",
        Hebrew: "he",
        Polish: "pl",
        Swedish: "sv",
        Norwegian: "no",
        Finnish: "fi",
        Danish: "da",
        Czech: "cs",
        Hungarian: "hu",
        Thai: "th",
        Vietnamese: "vi",
        Indonesian: "id",
        Malay: "ms",
        Filipino: "tl",
        Ukrainian: "uk",
        Romanian: "ro",
        Bulgarian: "bg",
        Serbian: "sr",
        Croatian: "hr",
        Slovak: "sk",
        Slovenian: "sl",
        Lithuanian: "lt",
        Latvian: "lv",
        Estonian: "et",
        Persian: "fa",
        Urdu: "ur",
        Swahili: "sw",
        Tamil: "ta",
        Telugu: "te",
        Marathi: "mr",
        Kannada: "kn",
        Malayalam: "ml",
        Sinhala: "si",
        Burmese: "my",
        Lao: "lo",
        Khmer: "km",
        Georgian: "ka",
        Armenian: "hy",
        Azerbaijani: "az",
        Kazakh: "kk",
        Uzbek: "uz",
        Mongolian: "mn",
        Pashto: "ps",
        Kurdish: "ku",
        Yoruba: "yo",
        Hausa: "ha",
        Igbo: "ig",
        Zulu: "zu",
        Xhosa: "xh",
        Malagasy: "mg",
        Maori: "mi",
        Samoan: "sm"
    };
      
    public getIsoCode(value: string): string {
        return this.languages[value];
    }

    public getLanguage(value: string): string | undefined {
        const lowerCaseValue = value.toLowerCase()
        for (const [name, code] of Object.entries(this.languages)) {
            if (code === lowerCaseValue) {
                return name;
            }
        }
        return undefined;
    }

    public getLanguageList(): string[] {
        return Object.keys(this.languages);
    }
    
}