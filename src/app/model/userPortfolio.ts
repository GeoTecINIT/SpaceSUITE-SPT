export class UserPortfolio {
  _id: string = '';
  personalInformation: PersonalInformation = new PersonalInformation();
  workExperience: PortfolioItem[] = [];
  educationAndTraining: PortfolioItem[] = [];
  languageSkills: LanguageSkill[] = [];
  projects: PortfolioItem[] = [];
  interests: string[] = [];
  updatedAt: any;

  constructor(data?: Partial<UserPortfolio>) {
    if (!data) return;
    this._id = data._id || '';
    this.personalInformation = new PersonalInformation(data.personalInformation);
    this.workExperience = data.workExperience?.map(item => new PortfolioItem(item)) || [];
    this.educationAndTraining = data.educationAndTraining?.map(item => new PortfolioItem(item)) || [];
    this.languageSkills = data.languageSkills?.map(item => new LanguageSkill(item)) || [];
    this.projects = data.projects?.map(item => new PortfolioItem(item)) || [];
    this.interests = data.interests || [];
    this.updatedAt = data.updatedAt || null;
  }
  toFirestore(): any {
    return {
      personalInformation: this.personalInformation.toFirestore(),
      workExperience: this.workExperience.map(value => value.toFirestore()),
      educationAndTraining: this.educationAndTraining.map(value => value.toFirestore()),
      languageSkills: this.languageSkills.map(value => value.toFirestore()),
      projects: this.projects.map(value => value.toFirestore()),
      interests: this.interests,
      updatedAt: this.updatedAt,
      _id: this._id
    };
  }
}

export class PersonalInformation {
  fullName: string = '';
  email: string = '';
  phone: string = '';
  shortDescription: string = '';
  profileSummary: string = '';
  nativeLanguage?: string;
  image: string = '';

  constructor(data?: Partial<PersonalInformation>) {
    Object.assign(this, data);
  }

  toFirestore(): any {
    return {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      shortDescription: this.shortDescription,
      profileSummary: this.profileSummary,
      nativeLanguage: this.nativeLanguage || null,
      image: this.image
    }
  }
}

export class PortfolioItem {
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

  toFirestore(): any {
    return {
      title: this.title,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate || null,
      city: this.city || null,
      country: this.country?.toFirestore() || null,
      hardSkills: this.hardSkills,
      softSkills: this.softSkills,
      bokConcepts: this.bokConcepts,
      organization: this.organization,
      link: this.link
    }
  }
}

export class LanguageSkill {
  language: string = '';
  level: CEFRLevel = 'A1';

  constructor(data?: Partial<LanguageSkill>) {
    Object.assign(this, data);
  }

  toFirestore(): any {
    return {
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

  toFirestore(): any {
    return {
      name: this.name,
      iso2: this.iso2
    }
  }
}
