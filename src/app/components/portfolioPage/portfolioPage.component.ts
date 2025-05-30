import { CommonModule } from '@angular/common';
import {Component} from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { UserPortfolio } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'portfolio-page',
  templateUrl: './portfolioPage.component.html',
  styleUrls: ['./portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent, ButtonModule],
})
export class PortfolioPageComponent {
  public userPlaceholder: UserPortfolio = {
    personalInformation: {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      phone: '+44 7911 123456',
      shortDescription: 'Full-stack developer',
      profileSummary: `Creative and detail-oriented software developer with over 8 years of experience in full-stack development, agile methodologies, and project leadership. Passionate about building inclusive and accessible technology.`,
      image: undefined
    },
    workExperience: [
      {
        title: 'Senior Software Engineer',
        organization: 'TechNova Ltd.',
        startDate: '2020-01-01',
        endDate: undefined,
        city: 'London',
        country: 'UK',
        hardSkills: [
          'React', 'TypeScript', 'JavaScript', 'Git', 'Figma', 'CI/CD'
        ],
        softSkills: [
          'Accessibility auditing', 'Agile methodologies', 'Code reviews',
          'Team leadership', 'Mentoring'
        ],
        bokConcepts: ['WB', 'WB6', 'WB1', 'WB1-3', 'WB7'],
        description: undefined,
        link: undefined
      },
      {
        title: 'Full Stack Developer',
        organization: 'CreativeCoders Inc.',
        startDate: '2016-06-01',
        endDate: '2019-12-01',
        city: 'Manchester',
        country: 'UK',
        hardSkills: [
          'Node.js', 'REST APIs', 'SQL', 'GitHub Actions', 'Docker', 'Git', 'JavaScript', 'CI/CD'
        ],
        softSkills: [
          'Agile methodologies', 'Accessibility auditing', 'Feature definition'
        ],
        bokConcepts: ['WB1', 'WB1-3', 'WB7', 'WB7-2'],
        description: undefined,
        link: undefined
      }
    ],
    educationAndTraining: [
      {
        title: 'BSc in Computer Science',
        organization: 'University of Manchester',
        startDate: '2012-09-01',
        endDate: '2015-06-30',
        city: 'Manchester',
        country: 'UK',
        hardSkills: [
          'Software Engineering', 'JavaScript', 'Artificial Intelligence', 'Git'
        ],
        softSkills: [
          'Agile methodologies', 'UX design', 'Accessibility auditing'
        ],
        bokConcepts: ['WB1', 'WB1-3', 'WB7', 'WB7-2', 'WB7-3', 'GC4', 'GC3', 'GC3-12', 'IP3-4-7', 'DA4'],
        description: undefined,
        link: undefined
      }
    ],
    languageSkills: [
      { language: 'English', level: 'C2' },
      { language: 'Spanish', level: 'B2' }
    ],
    projects: [
      {
        title: 'OpenEdu Platform',
        organization: undefined,
        startDate: '2021-03-01',
        endDate: undefined,
        hardSkills: ['React', 'Firebase', 'Tailwind CSS', 'GitHub Actions', 'CI/CD'],
        softSkills: ['Accessibility auditing'],
        bokConcepts: ['WB1', 'WB1-3', 'WB7', 'WB7-2', 'DA4'],
        description: 'An open-source learning management system for community colleges.',
        link: 'https://github.com/alexmorgan/openedu',
        city: undefined,
        country: undefined
      },
      {
        title: 'Inclusive Design Toolkit',
        organization: undefined,
        startDate: '2022-05-01',
        endDate: undefined,
        hardSkills: ['Vue.js', 'SCSS', 'Storybook'],
        softSkills: ['Accessibility auditing', 'UX design'],
        bokConcepts: ['WB7', 'WB7-3'],
        description: 'A set of tools and components for building accessible UIs.',
        link: 'https://alexmorgan.dev/inclusivedesign',
        city: undefined,
        country: undefined
      }
    ],
    certifications: [
      {
        title: 'Certified Accessibility Specialist',
        organization: 'IAAP',
        startDate: '2023-04-10',
        endDate: undefined,
        city: undefined,
        country: undefined,
        hardSkills: [],
        softSkills: ['Accessibility auditing'],
        bokConcepts: [],
        description: 'Accessibility auditing, Inclusive design',
        link: undefined
      }
    ],
    interests: ['Open source', 'UX design', 'Inclusive education', 'Cycling']
  };

  private loggedSubscription!: Subscription;

  constructor(private firebaseService: FirebaseService, private router: Router){
    this.loggedSubscription = this.firebaseService.logged$.asObservable().subscribe( logged => {
      if (!logged) {
        this.router.navigate(['']);
      }
    })
  }

  ngOnDestroy() {
    this.loggedSubscription?.unsubscribe();
  }

}