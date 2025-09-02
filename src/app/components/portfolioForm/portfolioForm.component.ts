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
import { catchError, of, take } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguageSelectComponent } from "../languageSelect/languageSelect.component";
import { SelectModule } from 'primeng/select';
import { AccordionModule } from 'primeng/accordion';
import { FormDataService } from '../../services/formData.service';
import { PortfolioItemFormComponent } from "../portfolioItemForm/portfolioItemForm.component";
import { ExitWithoutSavingService } from '@eo4geo/ngx-bok-utils';
import { ConfirmDialog } from "primeng/confirmdialog";

@Component({
  standalone: true,
  selector: 'portfolio-form',
  templateUrl: './portfolioForm.component.html',
  styleUrls: ['./portfolioForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, CommonModule, SelectModule, AccordionModule,
    StepperModule, ButtonModule, TooltipModule, ToastModule, InputNumberModule, LanguageSelectComponent, PortfolioItemFormComponent, ConfirmDialog],
  providers: [MessageService, ConfirmationService]
})
export class PortfolioFormComponent {

  @Input() pageName: string = '';
  @Input() inputPortfolio?: UserPortfolio;
  portfolio: UserPortfolio = new UserPortfolio();
  errorMap: Map<string, string | undefined> = new Map();
  languageList: string[] = [];

  loading: boolean = false;

  constructor(private firebaseService: FirebaseService, private router: Router, private messageService: MessageService, private confirmationService: ConfirmationService,
              private exitWithoutSavingService: ExitWithoutSavingService, private formDataService: FormDataService){}

  ngOnInit() {
    this.languageList = this.formDataService.getLanguageList();
    if (this.inputPortfolio) this.portfolio = new UserPortfolio(this.inputPortfolio)
    this.exitWithoutSavingService.showModalSubject.subscribe(value => {
      if (value) this.confirmExitWithoutSaving()
    })
  }

  returnToHomepage() {
    if (this.inputPortfolio) this.router.navigate(['portfolio']);
    else this.router.navigate(['']);
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
    this.loading = true;
    this.exitWithoutSavingService.bypassGuard.next(true);
    this.errorMap = this.formDataService.validate(this.portfolio);
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      this.firebaseService.submitPortfolio(this.portfolio, this.inputPortfolio).pipe(
        take(1),
        catchError( () => {
          this.loading = false;
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
        this.loading = false;
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
      this.loading = false;
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'There are incomplete mandatory fields. Please review the form and try to submit again.', 
        life: 3000, 
        closable: true 
      });
    }
  }

  goToNextStep(callback: (nextStepValue: number) => void, index: number) {
    callback(index);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  confirmExitWithoutSaving() {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to exit without saving?',
      header: 'Exit Without Saving',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
      },
      acceptButtonProps: {
        label: 'Exit',
        severity: 'primary',
      },
      accept: () => this.exitWithoutSavingService.exitSubject.next(true),
      reject: () => this.exitWithoutSavingService.exitSubject.next(false),
    });
  }
}