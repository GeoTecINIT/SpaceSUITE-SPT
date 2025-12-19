import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { UserInformationComponent } from "../userInformation/userInformation.component";
import { PortfolioItem, UserPortfolio } from '../../model/userPortfolio';
import { DividerModule } from 'primeng/divider';
import { ExperienceTimelineComponent } from "../experienceTimeline/experienceTimeline.component";
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../../services/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '@eo4geo/ngx-bok-utils';
import { PdfService } from '../../services/pdf.service';
import { Popover, PopoverModule } from 'primeng/popover';

@Component({
  standalone: true,
  selector: 'portfolio-page',
  templateUrl: './portfolioPage.component.html',
  styleUrls: ['./portfolioPage.component.css'],
  imports: [CommonModule, UserInformationComponent, DividerModule, ExperienceTimelineComponent, ButtonModule, ToastModule, ProgressSpinnerModule, ConfirmDialogModule, PopoverModule],
  providers: [MessageService, ConfirmationService]
})
export class PortfolioPageComponent {
  public userPortfolio?: UserPortfolio;

  experienceItems: PortfolioItem[] = []
  projectsItems: PortfolioItem[] = []
  educationItems: PortfolioItem[] = []

  reverseProjects: boolean = false;
  reverseEducation: boolean = false;

  private portfolioSubscription?: Subscription;
  private sessionSubscription?: Subscription;

  loading = false;

  @ViewChild('op') op!: Popover;

  constructor(private firebaseService: FirebaseService, private router: Router, private route: ActivatedRoute, private authService: AuthService,
              private messageService: MessageService, private confirmationService: ConfirmationService, private pdfService: PdfService){}

  ngOnInit() {
    this.sessionSubscription = this.authService.getUserState().subscribe ( state => {
      if (!state?.logged) this.router.navigate([''], {onSameUrlNavigation: 'reload'});
    })
    this.portfolioSubscription = this.firebaseService.getUserPortfolio().pipe(take(1)).subscribe( portfolio => {
        if (portfolio == undefined) {
          this.router.navigate([''], {onSameUrlNavigation: 'reload'});
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
    this.portfolioSubscription?.unsubscribe();
    this.sessionSubscription?.unsubscribe();
  }

  editPortfolio() {
    this.router.navigate(['edit']);
  }

  private deletePortfolio() {
    this.firebaseService.deletePortfolio().pipe(take(1)).subscribe( () => {
      this.router.navigate([''], { queryParams: { submited: true, mode: 'delete'}});
    });
  }

  downloadPortfolioPdf() {
    document.body.style.cursor = 'wait';
    this.op.hide();
    this.pdfService.generatePortfolioPdf(new UserPortfolio(this.userPortfolio)).subscribe( pdf => {
      this.downloadURI(pdf.url, pdf.filename);
      document.body.style.cursor = '';
    });
  }

  private downloadURI(uri: string, name: string) {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
  }

  deleteModal(event: Event) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Do you want to delete your portfolio?',
        header: 'Delete Material',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
            label: 'Cancel',
            severity: 'secondary',
        },
        acceptButtonProps: {
            label: 'Delete',
            severity: 'primary',
        },

        accept: () => {
          this.deletePortfolio();
        },
        reject: () => {
        },
    });
  }

}