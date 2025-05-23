import { CommonModule } from '@angular/common';
import {Component} from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { Education, UserPortfolio, WorkExperience } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { TimelineObject } from '../../model/timelineObject';

@Component({
  standalone: true,
  selector: 'portfolio-page',
  templateUrl: './portfolioPage.component.html',
  styleUrls: ['./portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent],
})
export class PortfolioPageComponent {
  public userPlaceholder: UserPortfolio = {
    personalInformation: {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      phone: '+44 7911 123456',
      shortDescription: 'Full-stack developer',
      profileSummary: `Creative and detail-oriented software developer with over 8 years of experience in full-stack development, agile methodologies, and project leadership. Passionate about building inclusive and accessible technology.`
    },
    workExperience: [
      {
        jobTitle: 'Senior Software Engineer',
        employer: 'TechNova Ltd.',
        startDate: '2020-01-01',
        endDate: '',
        city: 'London',
        country: 'UK',
        responsibilities: [
          'Led front-end development with React and TypeScript',
          'Collaborated with UX designers to improve accessibility',
          'Mentored junior developers and led code reviews'
        ]
      },
      {
        jobTitle: 'Full Stack Developer',
        employer: 'CreativeCoders Inc.',
        startDate: '2016-06-01',
        endDate: '2019-12-01',
        city: 'Manchester',
        country: 'UK',
        responsibilities: [
          'Developed REST APIs in Node.js',
          'Implemented CI/CD pipelines with GitHub Actions',
          'Worked closely with clients to define feature specs'
        ]
      }
    ],
    educationAndTraining: [
      {
        qualification: 'BSc in Computer Science',
        institution: 'University of Manchester',
        startDate: '2012-09-01',
        endDate: '2015-06-30',
        city: 'Manchester',
        country: 'UK',
        subjects: ['Software Engineering', 'Human-Computer Interaction', 'AI']
      }
    ],
    languageSkills: [
      { language: 'English', understanding: 'C2', speaking: 'C2', writing: 'C2' },
      { language: 'Spanish', understanding: 'B2', speaking: 'B1', writing: 'B1' }
    ],
    hardSkills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js',
      'Docker', 'Git', 'Figma', 'SQL'
    ],
    softSkills: ['Agile methodologies', 'Public speaking', 'Accessibility auditing'],
    projects: [
      {
        title: 'OpenEdu Platform',
        description: 'An open-source learning management system for community colleges.',
        startDate: '2021-03-01',
        technologies: ['React', 'Firebase', 'Tailwind CSS'],
        link: 'https://github.com/alexmorgan/openedu'
      },
      {
        title: 'Inclusive Design Toolkit',
        description: 'A set of tools and components for building accessible UIs.',
        startDate: '2022-05-01',
        technologies: ['Vue.js', 'SCSS', 'Storybook'],
        link: 'https://alexmorgan.dev/inclusivedesign'
      }
    ],
    certifications: [
      {
        name: 'Certified Accessibility Specialist',
        issuer: 'IAAP',
        issueDate: '2023-04-10',
        credentialUrl: 'https://certs.iaap.org/verify?id=123456'
      }
    ],
    interests: ['Open source', 'UX design', 'Inclusive education', 'Cycling'],
    references: [
      {
        name: 'Jamie Lee',
        position: 'Engineering Manager',
        organization: 'TechNova Ltd.',
        email: 'jamie.lee@technova.co.uk',
        phone: '+44 7911 654321'
      }
    ]
  }

  public workExperienceToTimelineObject(experienceArray: WorkExperience[]): TimelineObject[] {
    return experienceArray.map( experience => {
      const newObject: TimelineObject = {
        title: experience.jobTitle,
        startDate: experience.startDate,
        endDate: experience.endDate,
        organization: experience.employer,
        city: experience.city,
        country: experience.country,
        body: experience.responsibilities.join(', ')
      }
      return newObject;
    })
  }

  public educationToTimelineObject(experienceArray: Education[]): TimelineObject[] {
    return experienceArray.map( experience => {
      const newObject: TimelineObject = {
        title: experience.qualification,
        startDate: experience.startDate,
        endDate: experience.endDate,
        organization: experience.institution,
        city: experience.city,
        country: experience.country,
        body: experience.subjects.join(', ')
      }
      return newObject;
    })
  }

}