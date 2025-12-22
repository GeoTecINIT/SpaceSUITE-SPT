import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { UserPortfolio } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { Tag } from '../../model/tag';
import { MessageService } from 'primeng/api';
import { UtilsService } from '../../services/utils.service';
import { UpdateImageModalComponent } from "../updateImageModal/updateImageModal.component";
import { FirebaseService } from '../../services/firebase.service';
import { map, Observable, of, take } from 'rxjs';
import { FormDataService } from '../../services/formData.service';

@Component({
  standalone: true,
  selector: 'user-information',
  templateUrl: './userInformation.component.html',
  styleUrls: ['./userInformation.component.css'],
  imports: [CommonModule, ButtonModule, SkillTagComponent, TooltipModule, UpdateImageModalComponent, SkeletonModule],
  providers: [MessageService]
})
export class UserInformationComponent {
  @Input() userPortfolio: UserPortfolio | undefined;
  @Input() sharedPortfolio: boolean = false;

  bokConcepts: Tag[] = [];
  hardSkills: Tag[] = [];
  softSkills: Tag[] = [];
  languages: Tag[] = [];

  showModal: boolean = false;
  userImage: string | undefined = undefined;

  phoneNumber: string = ''
  email: string = ''

  constructor(private messageService: MessageService, private utilsService: UtilsService, private firebaseService: FirebaseService, private formDataService: FormDataService) {}

  ngOnInit() {
    const imageId: string | undefined = this.sharedPortfolio ? this.userPortfolio?._id : undefined;
    this.firebaseService.getUserImage(imageId).pipe(take(1)).subscribe(url => this.userImage = url);

    const hardSkillsSet = new Set<string>();
    const softSkillsSet = new Set<string>();
    const bokConceptsSet= new Set<string>();

    this.userPortfolio?.educationAndTraining.forEach( education => {
      education.hardSkills?.forEach( value => hardSkillsSet.add(value));
      education.softSkills?.forEach( value => softSkillsSet.add(value));
      education.bokConcepts?.forEach( value => bokConceptsSet.add(value));
    })
    this.userPortfolio?.projects.forEach( project => {
      project.hardSkills?.forEach( value => hardSkillsSet.add(value));
      project.softSkills?.forEach( value => softSkillsSet.add(value));
      project.bokConcepts?.forEach( value => bokConceptsSet.add(value));
    })
    this.userPortfolio?.workExperience.forEach( experience => {
      experience.hardSkills?.forEach( value => hardSkillsSet.add(value));
      experience.softSkills?.forEach( value => softSkillsSet.add(value));
      experience.bokConcepts?.forEach( value => bokConceptsSet.add(value));
    })
    this.bokConcepts = this.utilsService.stringToTag(Array.from(bokConceptsSet).sort(), 'bok');
    this.hardSkills = this.utilsService.stringToTag(Array.from(hardSkillsSet).sort(), 'secondary');
    this.softSkills = this.utilsService.stringToTag(Array.from(softSkillsSet).sort());
    if (this.userPortfolio?.nativeLanguage) {
      this.languages.push(new Tag(this.userPortfolio?.nativeLanguage + ': Native'));
    }
    this.languages = this.languages.concat(this.utilsService.stringToTag((this.userPortfolio?.languageSkills ?? []).map(value => `${value.language}: ${value.level}`)));

    this.getPhoneNumber().pipe(take(1)).subscribe(value => this.phoneNumber = value);
    this.email = this.userPortfolio?.email || '';
  }

  copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied ${this.userPortfolio?.fullName} ${field} to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }

  updateUserImage(url: string) {
    this.userImage = url;
  }

  private getPhoneNumber(): Observable<string> {
    if (this.userPortfolio?.phoneCountryCode) {
      return this.formDataService.getCountry(this.userPortfolio?.phoneCountryCode).pipe(
        map(value => {
          const countryCode = value ? value.phoneCode : '';
          const phone = this.userPortfolio?.phone;
          if (!countryCode && !phone) return '';
          return [countryCode, phone].filter(Boolean).join(' ');
        })
      )
    }
    else return of(this.userPortfolio?.phone || '')
  }
}