import {Component, Input} from '@angular/core';
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { WorkExperience } from '../../model/userPortfolio';
import { CommonModule } from '@angular/common';
import { TimelineObject } from '../../model/timelineObject';

@Component({
  standalone: true,
  selector: 'experience-timeline',
  templateUrl: './experienceTimeline.component.html',
  styleUrls: ['./experienceTimeline.component.css'],
  imports: [Timeline, CardModule, CommonModule],
})
export class ExperienceTimelineComponent {
    @Input() title: string = ''
    @Input() events: TimelineObject[] = []

    formatDate(startDate: string, endDate: string) {
       return startDate + ' to ' + (endDate ? endDate : 'Current')
    }
}