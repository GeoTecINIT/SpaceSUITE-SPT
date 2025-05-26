import {ChangeDetectorRef, Component, ElementRef, HostListener, Input, ViewChild} from '@angular/core';
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { TimelineObject } from '../../model/timelineObject';
import { SkillTagComponent } from "../skillTags/skillTags.component";

@Component({
  standalone: true,
  selector: 'experience-timeline',
  templateUrl: './experienceTimeline.component.html',
  styleUrls: ['./experienceTimeline.component.css'],
  imports: [Timeline, CardModule, CommonModule, SkillTagComponent],
})
export class ExperienceTimelineComponent {
  @Input() title: string = ''
  @Input() events: TimelineObject[] = []

  showDetail: boolean[] = [];

  @ViewChild('timeline') containerDiv!: ElementRef;
  private resizeObserver!: ResizeObserver;
  smallScreen: boolean = false;

  
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.showDetail = this.events.map( () => false);
  }

  formatDate(startDate: string, endDate: string) {
      return startDate + (endDate ? ' to ' + endDate : '')
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const newValue = width < 750;
        if (newValue != this.smallScreen) {
          this.smallScreen = newValue;
          this.cdRef.detectChanges();
        }
      }
    });

    if (this.containerDiv?.nativeElement) {
      this.resizeObserver.observe(this.containerDiv.nativeElement);
    }
  }
  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}