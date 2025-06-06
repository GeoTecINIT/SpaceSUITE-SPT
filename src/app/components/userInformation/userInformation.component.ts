import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { LanguageSkill, UserPortfolio } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast'
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { Tag, Variant } from '../../model/tag';
import { MessageService } from 'primeng/api';
import { UtilsService } from '../../services/utils.service';

@Component({
  standalone: true,
  selector: 'user-information',
  templateUrl: './userInformation.component.html',
  styleUrls: ['./userInformation.component.css'],
  imports: [CommonModule, ButtonModule, SkillTagComponent, TooltipModule, ToastModule],
  providers: [MessageService]
})
export class UserInformationComponent {
  @Input() userPortfolio: UserPortfolio | undefined;

  bokConcepts: Tag[] = [];
  hardSkills: Tag[] = [];
  softSkills: Tag[] = [];
  languages: Tag[] = [];
  interests: Tag[] = [];

  constructor(private messageService: MessageService, private utilsService: UtilsService) {}

  ngOnInit() {
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
    this.hardSkills = this.utilsService.stringToTag(Array.from(hardSkillsSet));
    this.softSkills = this.utilsService.stringToTag(Array.from(softSkillsSet), 'secondary');
    if (this.userPortfolio?.personalInformation.nativeLanguage) {
      this.languages.push(new Tag(this.userPortfolio?.personalInformation.nativeLanguage + ': Native'));
    }
    this.languages = this.languages.concat(this.utilsService.stringToTag((this.userPortfolio?.languageSkills ?? []).map(value => `${value.language}: ${value.level}`)));
    this.interests = this.utilsService.stringToTag((this.userPortfolio?.interests ?? []), 'secondary');
  }

  copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText('+' + value);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied ${this.userPortfolio?.personalInformation.fullName} ${field} to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }
}