import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { PersonalInformation } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { Tag } from '../../model/tag';

@Component({
  standalone: true,
  selector: 'user-information',
  templateUrl: './userInformation.component.html',
  styleUrls: ['./userInformation.component.css'],
  imports: [CommonModule, ButtonModule, SkillTagComponent],
})
export class UserInformationComponent {
  @Input() personalInformation: PersonalInformation | undefined;
  @Input() hardSkills: string[] = [];
  @Input() softSkills: string[] = []
  skillChips: Tag[] = [];

  ngOnInit() {
    this.hardSkills.forEach( skill => {
      this.skillChips.push({label: skill})
    })
    this.softSkills.forEach( skill => {
      this.skillChips.push({label: skill, variant: 'secondary'})
    })
  }
}