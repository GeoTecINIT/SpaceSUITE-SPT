import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { PortfolioItem, UserPortfolio } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../../services/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { pipe, Subscription, take } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  standalone: true,
  selector: 'portfolio-page',
  templateUrl: './portfolioPage.component.html',
  styleUrls: ['./portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent, ButtonModule, ToastModule, ProgressSpinnerModule],
  providers: [MessageService]
})
export class PortfolioPageComponent {
  public userPortfolio?: UserPortfolio;

  experienceItems: PortfolioItem[] = []
  projectsItems: PortfolioItem[] = []
  educationItems: PortfolioItem[] = []

  reverseProjects: boolean = false;
  reverseEducation: boolean = false;

  private loggedSubscription?: Subscription;
  private portfolioSubscription?: Subscription;

  loading = false;

  constructor(private firebaseService: FirebaseService, private router: Router, private route: ActivatedRoute, private messageService: MessageService){}

  ngOnInit() {
    this.loggedSubscription = this.firebaseService.logged$.asObservable().subscribe( logged => {
      if (!logged) {
        this.router.navigate(['']);
      }
    });
    this.portfolioSubscription = this.firebaseService.getUserPortfolio().pipe(take(1)).subscribe( portfolio => {
        if (!portfolio) this.router.navigate(['']);
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
    }, 500)
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited){
        switch (mode){
          case 'update':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Portfolio successfully updated!`,
              life: 3000, 
              closable: true 
            }); 
            break
          case 'create':
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Info', 
              detail: `Portfolio successfully created!`,
              life: 3000, 
              closable: true 
            }); 
            break
        }
      }
    });
  }

  ngOnDestroy() {
    this.loggedSubscription?.unsubscribe();
    this.portfolioSubscription?.unsubscribe();
  }

  editPortfolio() {
    this.router.navigate(['edit']);
  }

  deletePortfolio() {
    this.firebaseService.deletePortfolio().pipe(take(1)).subscribe( () => {
      this.router.navigate([''], { queryParams: { submited: true, mode: 'delete'}});
    });
  }

}