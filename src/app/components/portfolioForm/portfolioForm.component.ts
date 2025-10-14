import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { Country, PortfolioItem, UserPortfolio } from '../../model/userPortfolio';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguageSelectComponent } from "../languageSelect/languageSelect.component";
import { SelectModule } from 'primeng/select';
import { AccordionModule } from 'primeng/accordion';
import { FormDataService } from '../../services/formData.service';
import { PortfolioItemFormComponent } from "../portfolioItemForm/portfolioItemForm.component";
import { AuthService, ExitWithoutSavingService } from '@eo4geo/ngx-bok-utils';
import { ConfirmDialog } from "primeng/confirmdialog";
import { UploadCVModalComponent } from '../uploadCVModal/uploadCVModal.component';

@Component({
  standalone: true,
  selector: 'portfolio-form',
  templateUrl: './portfolioForm.component.html',
  styleUrls: ['./portfolioForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, CommonModule, SelectModule, AccordionModule,
    StepperModule, ButtonModule, TooltipModule, ToastModule, InputNumberModule, LanguageSelectComponent, PortfolioItemFormComponent, ConfirmDialog, UploadCVModalComponent],
  providers: [MessageService, ConfirmationService]
})
export class PortfolioFormComponent {

  @Input() pageName: string = '';
  @Input() inputPortfolio?: UserPortfolio;
  portfolio: UserPortfolio = new UserPortfolio();
  errorMap: Map<string, string | undefined> = new Map();
  languageList: string[] = [];
  countryList: Country[] = [];
  loadingCountries: boolean = true;

  loading: boolean = false;

  showNewPortfolioModal: boolean = false;

  private sessionSubscription?: Subscription;

  constructor(private firebaseService: FirebaseService, private router: Router, private messageService: MessageService, private confirmationService: ConfirmationService,
              private exitWithoutSavingService: ExitWithoutSavingService, private formDataService: FormDataService, private authService: AuthService){}

  ngOnInit() {
    this.sessionSubscription = this.authService.getUserState().subscribe ( state => {
      if (!state?.logged) {
        this.exitWithoutSavingService.bypassGuard.next(true);
        this.router.navigate(['']);
      }
    })
    this.languageList = this.formDataService.getLanguageList();
    this.formDataService.getCountries().pipe(take(1)).subscribe( countries => {
      this.countryList = countries;
      this.loadingCountries = false;
    });
    if (this.inputPortfolio) this.portfolio = new UserPortfolio(this.inputPortfolio)
    this.exitWithoutSavingService.showModalSubject.subscribe(value => {
      if (value) this.confirmExitWithoutSaving()
    });
    this.showNewPortfolioModal = this.router.url == '/new';
  }

  ngOnDestroy() {
    this.sessionSubscription?.unsubscribe();
  }

  onPortfolioModalChange(newPortfolio: UserPortfolio) {
    this.portfolio = newPortfolio;
  }

  returnToHomepage() {
    this.router.navigate(['']);

  }

  addEducationItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.educationAndTraining.push(newItem);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  deleteEducationItem(index: number){
    this.portfolio.educationAndTraining.splice(index, 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  addExperienceItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.workExperience.push(newItem);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  deleteExperienceItem(index: number){
    this.portfolio.workExperience.splice(index, 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  addProjectItem() {
    const newItem = new PortfolioItem();
    newItem.startDate = new Date(Date.now());
    this.portfolio.projects.push(newItem);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  deleteProjectItem(index: number){
    this.portfolio.projects.splice(index, 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
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
            [''], 
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
    this.errorMap = this.formDataService.validate(this.portfolio);
    const allValid: boolean = Array.from(this.errorMap.values()).every(value => value === undefined);
    if (allValid) {
      callback(index);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'There are incomplete mandatory fields. Please review the form and try again.', 
        life: 3000, 
        closable: true 
      });
    }
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