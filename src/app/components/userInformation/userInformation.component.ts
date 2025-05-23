import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { PersonalInformation } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast'
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { Tag } from '../../model/tag';
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
  @Input() personalInformation: PersonalInformation | undefined;
  @Input() hardSkills: string[] = [];
  @Input() softSkills: string[] = []
  skillChips: Tag[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.hardSkills.forEach( skill => {
      this.skillChips.push({label: skill})
    })
    this.softSkills.forEach( skill => {
      this.skillChips.push({label: skill, variant: 'secondary'})
    })
  }

  copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Info', 
      detail: `You copied ${this.personalInformation?.fullName} ${field} to clipboard!`,
      life: 3000, 
      closable: true 
    });
  }
}