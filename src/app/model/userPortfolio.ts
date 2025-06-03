export class UserPortfolio {
  personalInformation: PersonalInformation;
  workExperience: PortfolioItem[];
  educationAndTraining: PortfolioItem[];
  languageSkills: LanguageSkill[];
  projects: PortfolioItem[];
  certifications: PortfolioItem[];
  interests: string[];

  constructor() {
    this.personalInformation = new PersonalInformation();
    this.workExperience = [];
    this.educationAndTraining = [];
    this.languageSkills = [];
    this.projects = [];
    this.certifications = [];
    this.interests = [];
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
}

export class PortfolioItem {
  title: string = '';
  description?: string = '';
  startDate: string = '';
  endDate?: string;
  city?: string; 
  country?: string;
  hardSkills?: string[] = [];
  softSkills?: string[] = [];
  bokConcepts?: string[] = [];
  organization?: string = '';
  link?: string = '';
}

export class LanguageSkill {
  language: string = '';
  level: CEFRLevel = 'A1';
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';