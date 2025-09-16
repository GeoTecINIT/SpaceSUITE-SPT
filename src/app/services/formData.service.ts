import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable, of, tap } from "rxjs";
import { Country, LanguageSkill, UserPortfolio } from "../model/userPortfolio";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class FormDataService {
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

  private countries: Country[] = [];
  private cities: Map<string, string[]> = new Map<string, string[]>();

  constructor(private http: HttpClient) {}
    
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
  
  public getCountries(): Observable<Country[]> {
    if (this.countries.length != 0) return of(this.countries);
    var headers = new HttpHeaders({'X-CSCAPI-KEY': environment.CSC_API_KEY});
    return this.http.get('https://api.countrystatecity.in/v1/countries', { headers: headers}).pipe(
      map( results => {
        if (Array.isArray(results)) return results.map(country => new Country({name: country.name, iso2: country.iso2}))
        return [];
      }),
      tap( results => this.countries = results )
    );
  }

  public getCities(name: string): Observable<string[]> {
    const localCities = this.cities.get(name);
    if (localCities != undefined) return of(localCities)
    var headers = new HttpHeaders({'X-CSCAPI-KEY': environment.CSC_API_KEY});
    return this.http.get(`https://api.countrystatecity.in/v1/countries/${name}/cities`, { headers: headers}).pipe(
      map( results => {
        if (Array.isArray(results)) return results.map(city => city.name)
        return [];
      }),
      tap( results => this.cities.set(name, results) )
    );
  }

  public validate(portfolio: UserPortfolio): Map<string, string | undefined> {
    const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/\S*)?$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;

    const errors: Map<string, string | undefined> = new Map();
  
    const setError = (field: string, condition: boolean, message: string) => {
      errors.set(field, condition ? message : undefined);
    };
  
    // General Information fields
    setError('fullName', !portfolio.fullName.trim(), 'Name is required.');
    setError('email', portfolio.email.trim() != '' && !emailRegex.test(portfolio.email), 'Invalid email format.');
    setError('phone', portfolio.phone != '' && !phoneRegex.test(portfolio.phone), 'Invalid phone number.');
    setError('lang', !portfolio.nativeLanguage, 'Native Language is required.');
    if (portfolio.languageSkills.some( value => value.language === portfolio.nativeLanguage)) {
      errors.set('langSkills', 'The native language cannot be added as a Language Skill.');
    }
    const langSet: Set<string> = new Set<string>(portfolio.languageSkills.map(value => value.language))
    if (portfolio.languageSkills.length != langSet.size) {
            errors.set('langSkills', 'A language cannot be added more than once.');
    }

    // Education fields
    portfolio.educationAndTraining.forEach((item, index) => {
      setError('E' + index + 'Title', !item.title.trim(), 'Title is required.');
      setError('E' + index + 'Org', !item.organization.trim(), 'Institution is required.');
      setError('E' + index + 'startDate', !item.startDate, 'Start date is required.');
      if (item.startDate && isNaN(Date.parse(item.startDate.toISOString()))) {
        errors.set('E' + index + 'startDate', 'Start date format is invalid.');
      }
      if (item.startDate && item.startDate > new Date()) {
        errors.set('E' + index + 'startDate', 'Start date can not be later than today.');
      }
      if (item.endDate && isNaN(Date.parse(item.endDate.toISOString()))) {
        errors.set('E' + index + 'endDate', 'End date format is invalid.');
      }
      if (item.endDate && item.endDate > new Date()) {
        errors.set('E' + index + 'endDate', 'End date can not be later than today.');
      }
      if (item.startDate && item.endDate && item.startDate > item.endDate) {
        errors.set('E' + index + 'endDate', 'End date can not be earlier than the start date.');
      }
      if (item.link) setError('E' + index + 'Link', !urlRegex.test(item.link), 'Invalid url format.');
    })

    // Experience fields
    portfolio.workExperience.forEach((item, index) => {
      setError('W' + index + 'Title', !item.title.trim(), 'Title is required.');
      setError('W' + index + 'Org', !item.organization.trim(), 'Title is required.');
      setError('W' + index + 'startDate', !item.startDate, 'Start date is required.');
      if (item.startDate && isNaN(Date.parse(item.startDate.toISOString()))) {
        errors.set('W' + index + 'startDate', 'Start date format is invalid.');
      }
      if (item.startDate && item.startDate > new Date()) {
        errors.set('W' + index + 'startDate', 'Start date can not be later than today.');
      }
      if (item.endDate && isNaN(Date.parse(item.endDate.toISOString()))) {
        errors.set('W' + index + 'endDate', 'End date format is invalid.');
      }
      if (item.endDate && item.endDate > new Date()) {
        errors.set('W' + index + 'endDate', 'End date can not be later than today.');
      }
      if (item.startDate && item.endDate && item.startDate > item.endDate) {
        errors.set('W' + index + 'endDate', 'End date can not be earlier than the start date.');
      }
      if (item.link) setError('W' + index + 'Link', !urlRegex.test(item.link), 'Invalid url format.');
    })

    // Project fields
    portfolio.projects.forEach((item, index) => {
      setError('P' + index + 'Title', !item.title.trim(), 'Title is required.');
      setError('P' + index + 'Org', !item.organization.trim(), 'Title is required.');
      setError('P' + index + 'startDate', !item.startDate, 'Start date is required.');
      if (item.startDate && isNaN(Date.parse(item.startDate.toISOString()))) {
        errors.set('P' + index + 'startDate', 'Start date format is invalid.');
      }
      if (item.startDate && item.startDate > new Date()) {
        errors.set('P' + index + 'startDate', 'Start date can not be later than today.');
      }
      if (item.endDate && isNaN(Date.parse(item.endDate.toISOString()))) {
        errors.set('P' + index + 'endDate', 'End date format is invalid.');
      }
      if (item.endDate && item.endDate > new Date()) {
        errors.set('P' + index + 'endDate', 'End date can not be later than today.');
      }
      if (item.startDate && item.endDate && item.startDate > item.endDate) {
        errors.set('P' + index + 'endDate', 'End date can not be earlier than the start date.');
      }
      if (item.link) setError('P' + index + 'Link', !urlRegex.test(item.link), 'Invalid url format.');
    })
  
    return errors;
  }
}