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
  public userPlaceholder: UserPortfolio = new UserPortfolio();

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

  editPortfolio() {
    this.router.navigate(['new']);
  }

}