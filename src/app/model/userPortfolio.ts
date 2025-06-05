export class UserPortfolio {
  _id: string = '';
  personalInformation: PersonalInformation;
  workExperience: PortfolioItem[];
  educationAndTraining: PortfolioItem[];
  languageSkills: LanguageSkill[];
  projects: PortfolioItem[];
  interests: string[];
  updatedAt: any;

  constructor(data?: Partial<UserPortfolio>) {
    this._id = data?._id || '';

    this.personalInformation = data?.personalInformation
      ? Object.assign(new PersonalInformation(), data.personalInformation)
      : new PersonalInformation();

    this.workExperience = data?.workExperience?.map(
      item => Object.assign(new PortfolioItem(), item)
    ) || [];

    this.educationAndTraining = data?.educationAndTraining?.map(
      item => Object.assign(new PortfolioItem(), item)
    ) || [];

    this.languageSkills = data?.languageSkills?.map(
      item => Object.assign(new LanguageSkill(), item)
    ) || [];

    this.projects = data?.projects?.map(
      item => Object.assign(new PortfolioItem(), item)
    ) || [];

    this.interests = data?.interests || [];

    this.updatedAt = data?.updatedAt || undefined;
  }

  toPlain() {
    return {
      personalInformation: this.personalInformation.toPlain(),
      workExperience: this.workExperience.map(item => item.toPlain()),
      educationAndTraining: this.educationAndTraining.map(item => item.toPlain()),
      languageSkills: this.languageSkills.map(item => item.toPlain()),
      projects: this.projects.map(item => item.toPlain()),
      interests: this.interests
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
  image?: string;

  toPlain() {
    return {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      shortDescription: this.shortDescription,
      profileSummary: this.profileSummary,
      nativeLanguage: this.nativeLanguage || null,
      image: this.image || null
    };
  }
}

export class PortfolioItem {
  title: string = '';
  description?: string = '';
  startDate: any;
  endDate?: any;
  city?: string; 
  country?: string;
  hardSkills: string[] = [];
  softSkills: string[] = [];
  bokConcepts: string[] = [];
  organization: string = '';
  link?: string = '';

  toPlain() {
    return {
      title: this.title,
      description: this.description || null,
      startDate: this.startDate,
      endDate: this.endDate || null,
      city: this.city || null,
      country: this.country || null,
      hardSkills: this.hardSkills,
      softSkills: this.softSkills,
      bokConcepts: this.bokConcepts,
      organization: this.organization,
      link: this.link || null
    };
  }
}

export class LanguageSkill {
  language: string = '';
  level: CEFRLevel = 'A1';

  toPlain() {
    return {
      language: this.language,
      level: this.level
    };
  }
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';