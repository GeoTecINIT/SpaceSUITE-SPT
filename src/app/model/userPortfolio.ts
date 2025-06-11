export class UserPortfolio implements FirebaseObject {
  _id: string = '';
  fullName: string = '';
  email: string = '';
  phone: string = '';
  shortDescription: string = '';
  profileSummary: string = '';
  nativeLanguage?: string;
  image: string = '';
  workExperience: PortfolioItem[] = [];
  educationAndTraining: PortfolioItem[] = [];
  languageSkills: LanguageSkill[] = [];
  projects: PortfolioItem[] = [];
  updatedAt: any;

  constructor(data?: Partial<UserPortfolio>) {
    if (!data) return;
    this._id = data._id || '';
    this.fullName = data.fullName || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.shortDescription = data.shortDescription || '';
    this.profileSummary = data.profileSummary || '';
    this.nativeLanguage = data.nativeLanguage;
    this.image = data.image || '';
    this.workExperience = data.workExperience?.map(item => new PortfolioItem(item)) || [];
    this.educationAndTraining = data.educationAndTraining?.map(item => new PortfolioItem(item)) || [];
    this.languageSkills = data.languageSkills?.map(item => new LanguageSkill(item)) || [];
    this.projects = data.projects?.map(item => new PortfolioItem(item)) || [];
    this.updatedAt = data.updatedAt || null;
  }

  toFirebase() {
    return {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      shortDescription: this.shortDescription,
      profileSummary: this.profileSummary,
      nativeLanguage: this.nativeLanguage || null,
      image: this.image,
      updatedAt: this.updatedAt
    }
  }
}

export class PortfolioItem implements FirebaseObject {
  _id: string = '';
  title: string = '';
  description: string = '';
  startDate: any;
  endDate?: any;
  city?: string;
  country?: Country;
  hardSkills: string[] = [];
  softSkills: string[] = [];
  bokConcepts: string[] = [];
  organization: string = '';
  link: string = '';

  constructor(data?: Partial<PortfolioItem>) {
    Object.assign(this, data);
    if (data?.country) {
      this.country = new Country(data.country);
    }
  }

  toFirebase() {
    return {
      _id: this._id,
      title: this.title,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate || null,
      city: this.city || null,
      country: this.country ? {
        name: this.country?.name || null,
        iso2: this.country?.iso2 || null
      } : null,
      hardSkills: this.hardSkills,
      softSkills: this.softSkills,
      bokConcepts: this.bokConcepts,
      organization: this.organization,
      link: this.link
    }
  }
}

export class LanguageSkill implements FirebaseObject {
  _id: string = '';
  language: string = '';
  level: CEFRLevel = 'A1';

  constructor(data?: Partial<LanguageSkill>) {
    Object.assign(this, data);
  }

  toFirebase() {
    return {
      _id: this._id,
      language: this.language,
      level: this.level
    }
  }
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export class Country {
  name: string = '';
  iso2: string = '';

  constructor(data?: Partial<Country> | Country) {
    Object.assign(this, data);
  }
}

export interface FirebaseObject {
  _id: string;
  toFirebase(): Object;
}
