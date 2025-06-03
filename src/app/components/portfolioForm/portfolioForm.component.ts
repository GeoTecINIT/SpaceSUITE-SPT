import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { UserPortfolio } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { InputNumberModule } from 'primeng/inputnumber';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TextareaModule } from 'primeng/textarea';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from "primeng/tooltip";
import { DatePickerModule } from 'primeng/datepicker';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextChipsComponent } from '../textChips/textChips.component';
import { LanguageSelectComponent } from "../languageSelect/languageSelect.component";
import { SelectModule } from 'primeng/select';
import { LanguageService } from '../../services/language.service';

@Component({
  standalone: true,
  selector: 'portfolio-form',
  templateUrl: './portfolioForm.component.html',
  styleUrls: ['./portfolioForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, CommonModule, SelectModule,
    StepperModule, ButtonModule, DatePickerModule, TooltipModule, ToastModule, InputNumberModule, TextChipsComponent, LanguageSelectComponent],
  providers: [MessageService]
})
export class PortfolioFormComponent {

  private loggedSubscription!: Subscription;
  @Input() pageName: string = '';
  @Input() portfolio: UserPortfolio = new UserPortfolio();
  errorMap: Map<string, string | undefined> = new Map();
  languageList: string[] = [];

  constructor(private firebaseService: FirebaseService, private router: Router, private messageService: MessageService, private languageService: LanguageService){
    this.loggedSubscription = this.firebaseService.logged$.asObservable().subscribe( logged => {
      if (!logged) {
        this.returnToHomepage();
      }
    })
  }

  ngOnInit() {
    this.languageList = this.languageService.getLanguageList();
  }

  returnToHomepage() {
    this.router.navigate(['']);
  }

  ngOnDestroy() {
    this.loggedSubscription?.unsubscribe();
  }

}