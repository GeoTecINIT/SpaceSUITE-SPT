import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { PortfolioItem, UserPortfolio } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { FirebaseService } from '../../services/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, map, Subscription, take } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  standalone: true,
  selector: 'shared-portfolio-page',
  templateUrl: './sharedPortfolioPage.component.html',
  styleUrls: ['../portfolioPage/portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent, ProgressSpinnerModule],
})
export class SharedPortfolioPageComponent {
  public userPortfolio?: UserPortfolio;

  experienceItems: PortfolioItem[] = []
  projectsItems: PortfolioItem[] = []
  educationItems: PortfolioItem[] = []

  reverseProjects: boolean = false;
  reverseEducation: boolean = false;

  private portfolioSubscription?: Subscription;

  loading = false;

  constructor(private firebaseService: FirebaseService, private router: Router, private route: ActivatedRoute){}

  ngOnInit() {
    this.portfolioSubscription = this.route.paramMap.pipe(
      map((paramMap) => {
        const actionName = paramMap.get('dynamicValue') || '';
        return actionName;
      }),
      concatMap(userId => this.firebaseService.getUserPortfolio(userId).pipe(take(1)))
    )
    .subscribe( portfolio => {
        if (portfolio == undefined || !portfolio.isPublic) {
          this.router.navigate(['not_found']);
        }
        else {
          this.userPortfolio = portfolio;
          
          this.experienceItems.push(...this.userPortfolio.workExperience)
          this.projectsItems.push(...this.userPortfolio.projects)
          this.educationItems.push(...this.userPortfolio.educationAndTraining)

          this.reverseProjects = this.experienceItems.length % 2 != 0
          this.reverseEducation = (this.experienceItems.length + this.projectsItems.length) % 2 != 0

          this.loading = false;
        }
      }
    );
    setTimeout(() => {
      if (!this.userPortfolio) this.loading = true;
    }, 500);
  }

  ngOnDestroy() {
    this.portfolioSubscription?.unsubscribe();
  }
}