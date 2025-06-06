import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { PortfolioItem, UserPortfolio } from '../../model/userPortfolio';
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
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { catchError, of, Subscription, take } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextChipsComponent } from '../textChips/textChips.component';
import { LanguageSelectComponent } from "../languageSelect/languageSelect.component";
import { SelectModule } from 'primeng/select';
import { AccordionModule } from 'primeng/accordion';
import { FormDataService } from '../../services/formData.service';
import { PortfolioItemFormComponent } from "../portfolioItemForm/portfolioItemForm.component";

@Component({
  standalone: true,
  selector: 'portfolio-form',
  templateUrl: './portfolioForm.component.html',
  styleUrls: ['./portfolioForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, CommonModule, SelectModule, AccordionModule,
    StepperModule, ButtonModule, TooltipModule, ToastModule, InputNumberModule, TextChipsComponent, LanguageSelectComponent, PortfolioItemFormComponent],
  providers: [MessageService]
})
export class PortfolioFormComponent {

  private loggedSubscription!: Subscription;
  @Input() pageName: string = '';
  @Input() inputPortfolio?: UserPortfolio;
  portfolio: UserPortfolio = new UserPortfolio();
  errorMap: Map<string, string | undefined> = new Map();
  languageList: string[] = [];

  constructor(private firebaseService: FirebaseService, private router: Router, private messageService: MessageService, private formDataService: FormDataService){
    this.loggedSubscription = this.firebaseService.logged$.asObservable().subscribe( logged => {
      if (!logged) {
        this.returnToHomepage();
      }
    })
  }

  ngOnInit() {
    this.languageList = this.formDataService.getLanguageList();
    if (this.inputPortfolio) this.portfolio = new UserPortfolio(this.inputPortfolio)
  }

  returnToHomepage() {
    this.router.navigate(['']);
  }

  ngOnDestroy() {
    this.loggedSubscription?.unsubscribe();
  }

  addEducationItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.educationAndTraining.push(newItem)
  }

  deleteEducationItem(){
    this.portfolio.educationAndTraining.pop();
  }

  addExperienceItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.workExperience.push(newItem)
  }

  deleteExperienceItem(){
    this.portfolio.workExperience.pop();
  }

  addProjectItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.projects.push(newItem)
  }

  deleteProjectItem(){
    this.portfolio.projects.pop();
  }

  submitForm() {
    this.errorMap = this.formDataService.validate(this.portfolio);
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      this.firebaseService.submitPortfolio(this.portfolio, this.inputPortfolio).pipe(
        take(1),
        catchError( (error) => {
          console.log(error)
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Something went wrong. Try again later or contact the administrator.', 
            life: 3000, 
            closable: true 
          });
          return of(null)
        })
      ).subscribe(() => {
        this.router.navigate(
            ['portfolio'], 
            { 
              queryParams: { 
                submited: true, 
                mode: this.inputPortfolio != undefined ? 'update' : 'create' 
              } 
            }
          );
      });
    }
    else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'There are incomplete mandatory fields. Please review the form and try to submit again.', 
        life: 3000, 
        closable: true 
      });
    }
  }
}