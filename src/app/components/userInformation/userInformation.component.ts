import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { LanguageSkill, PersonalInformation, UserPortfolio } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast'
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { Tag, Variant } from '../../model/tag';
import { MessageService } from 'primeng/api';

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


  constructor(private messageService: MessageService) {}

  copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied ${this.userPortfolio?.personalInformation.fullName} ${field} to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }

  stringToTag(values: string[], variant?: Variant): Tag[] {
    return values.map(skill => new Tag(skill, variant ?? undefined))
  }

  languageTags(skills: LanguageSkill[]): Tag[] {
    return this.stringToTag(skills.map(value => `${value.language}: ${value.level}`));
  }
}