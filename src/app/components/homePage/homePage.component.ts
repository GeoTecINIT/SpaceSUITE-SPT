import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { SkillTagComponent } from "../skillTags/skillTags.component";

@Component({
  standalone: true,
  selector: 'home-page',
  templateUrl: './homePage.component.html',
  styleUrls: ['./homePage.component.css'],
  imports: [CommonModule, ButtonModule, Timeline, CardModule, SkillTagComponent],
})
export class HomePageComponent {
  @ViewChild('timeline') containerDiv!: ElementRef;
  private resizeObserver!: ResizeObserver;
  smallScreen: boolean = false;

  timelineContent = [
    {
      title: 'Build a Smarter Portfolio',
      subtitle: 'Go beyond job titles and diplomas',
      description: ['Traditional resumes often hide your true potential.',
                    'With our tool, recruiters and partners see exactly what you bring to the table, skill by skill.'],
      icon: 'pi pi-info-circle',
      skills: []
    },
    {
      title: 'One Profile. Endless Possibilities',
      subtitle: 'Plan your growth',
      description: ['Your Skill Portfolio isn’t just a record, it’s a living asset in a connected ecosystem.',
                    'Everything stays in sync as you grow, ensuring your profile evolves with your career goals.'],
      icon: 'pi pi-user',
      skills: []
    },
    {
      title: 'Ready to Unlock Your Potential?',
      subtitle: 'Log in to start building your Skill Portfolio',
      description: ['Your profile stays private, secure, and always in your control.',
                    'Already have an account? Great, just log in and pick up where you left off.',
                    'New here? Sign up and take the first step toward a smarter, skill-based future.'],
      icon: 'pi pi-sign-in',
      skills: []
    }
  ]

  constructor(private cdRef: ChangeDetectorRef) {}

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