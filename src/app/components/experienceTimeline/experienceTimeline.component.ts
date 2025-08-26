import {ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { PortfolioItem } from '../../model/userPortfolio';
import { Tag, Variant } from '../../model/tag';

@Component({
  standalone: true,
  selector: 'experience-timeline',
  templateUrl: './experienceTimeline.component.html',
  styleUrls: ['./experienceTimeline.component.css'],
  imports: [Timeline, CardModule, CommonModule, SkillTagComponent],
})
export class ExperienceTimelineComponent {
  @Input() title: string = ''
  @Input() icon: string = ''
  @Input() events: PortfolioItem[] = []
  @Input() reverse: boolean = false

  showDetail: boolean[] = [];

  @ViewChild('timeline') containerDiv!: ElementRef;
  private resizeObserver!: ResizeObserver;
  smallScreen: boolean = false;

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.showDetail = this.events.map( () => false);
    this.events.sort((a, b) => {
      const aDate = new Date(a.startDate);
      const bDate = new Date(b.startDate);
      return bDate.getTime() - aDate.getTime()
    });
    if (this.reverse) this.events = [this.events[0], ...this.events]
  }

  formatDate(startDate: Date, endDate: Date) {
    return startDate.toLocaleDateString() + (endDate ? ' to ' + endDate.toLocaleDateString() : '')
  }

  stringToTag(values: string[], variant?: Variant): Tag[] {
    return values.map(skill => new Tag(skill, variant ?? undefined))
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

    if (this.reverse && this.containerDiv?.nativeElement) {
      const firstItem: HTMLElement | null =
        this.containerDiv?.nativeElement.querySelector('.p-timeline-event');
      if (firstItem) firstItem.style.display = 'none';
    }
  }
  
  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}