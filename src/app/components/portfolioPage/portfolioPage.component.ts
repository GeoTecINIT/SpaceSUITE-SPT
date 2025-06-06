import { CommonModule } from '@angular/common';
import {Component} from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { UserPortfolio } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../../services/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  standalone: true,
  selector: 'portfolio-page',
  templateUrl: './portfolioPage.component.html',
  styleUrls: ['./portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent, ButtonModule, ToastModule],
  providers: [MessageService]
})
export class PortfolioPageComponent {
  public userPortfolio?: UserPortfolio;

  private loggedSubscription?: Subscription;
  private portfolioSubscription?: Subscription;

  constructor(private firebaseService: FirebaseService, private router: Router, private route: ActivatedRoute, private messageService: MessageService){}

  ngOnInit() {
    this.loggedSubscription = this.firebaseService.logged$.asObservable().subscribe( logged => {
      if (!logged) {
        this.router.navigate(['']);
      }
    });
    this.portfolioSubscription = this.firebaseService.getUserPortfolio().subscribe( portfolio => {
        if (!portfolio) this.router.navigate(['']);
        else this.userPortfolio = portfolio;
      }
    );
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
    this.firebaseService.deletePortfolio();
    this.router.navigate(['']);
  }

}