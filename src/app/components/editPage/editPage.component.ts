import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { UserPortfolio } from "../../model/userPortfolio";
import { PortfolioFormComponent } from "../portfolioForm/portfolioForm.component";
import { FirebaseService } from "../../services/firebase.service";


@Component({
  standalone: true,
  selector: 'edit-page',
  template: '<portfolio-form *ngIf="portfolio" [inputPortfolio]="portfolio">',
  imports: [CommonModule, PortfolioFormComponent],
})
export class EditPageComponent {
  portfolio!: UserPortfolio;

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.firebaseService.getUserPortfolio().subscribe(
      (newPortfolio: UserPortfolio | undefined) => {
        if (newPortfolio) {
          this.portfolio = new UserPortfolio(newPortfolio);
        }
        else this.router.navigate(['not_found']);
      }
    )
  }
}