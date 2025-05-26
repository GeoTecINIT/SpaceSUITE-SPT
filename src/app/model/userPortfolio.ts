export class UserPortfolio {
  personalInformation: PersonalInformation;
  workExperience: WorkExperience[];
  educationAndTraining: Education[];
  languageSkills: LanguageSkill[];
  hardSkills: string[];
  softSkills: string[];
  projects: Project[];
  certifications: Certification[];
  interests: string[];

  constructor() {
    this.personalInformation = new PersonalInformation();
    this.workExperience = [];
    this.educationAndTraining = [];
    this.languageSkills = [];
    this.hardSkills = [];
    this.softSkills = [];
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
  image?: string;
}

export class WorkExperience {
  jobTitle: string = '';
  employer: string = '';
  startDate: string = '';
  endDate?: string;
  city: string = '';
  country: string = '';
  responsibilities: string[] = [];
  description: string = '';
}

export class Education {
  qualification: string = '';
  institution: string = '';
  startDate: string = '';
  endDate?: string;
  city: string = '';
  country: string = '';
  subjects: string[] = [];
  description: string = '';
}

export class LanguageSkill {
  language: string = '';
  level: CEFRLevel = 'A1';
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export class Project {
  title: string = '';
  description: string = '';
  startDate: string = '';
  endDate?: string;
  technologies: string[] = [];
  link?: string;
}

export class Certification {
  name: string = '';
  issuer: string = '';
  issueDate: string = '';
}
