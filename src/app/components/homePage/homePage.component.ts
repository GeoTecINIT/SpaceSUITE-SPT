import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { SkillTagComponent } from "../skillTags/skillTags.component";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../services/firebase.service";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";

@Component({
  standalone: true,
  selector: 'home-page',
  templateUrl: './homePage.component.html',
  styleUrls: ['./homePage.component.css'],
  imports: [CommonModule, ButtonModule, Timeline, CardModule, SkillTagComponent, ToastModule],
  providers: [MessageService]
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
      skills: [
                { label: 'Cybersecurity', variant: 'primary' },
                { label: 'Problem-solving', variant: 'secondary' },
                { label: 'Python', variant: 'primary' },
                { label: 'Thinking', variant: 'secondary' },
                { label: 'RTK', variant: 'primary' },
                { label: 'Teamwork', variant: 'secondary' },
                { label: 'Cloud', variant: 'primary' },
                { label: 'Communication', variant: 'secondary' },
                { label: 'Git', variant: 'primary' },
                { label: 'Mentoring', variant: 'secondary' },
                { label: 'Docker', variant: 'primary' },
                { label: 'Leadership', variant: 'secondary' },
                { label: 'SatCom', variant: 'primary' },
                { label: 'Adaptability', variant: 'secondary' },
                { label: 'QGIS', variant: 'primary' },
                { label: 'Analysis', variant: 'secondary' },
                { label: 'GNSS', variant: 'primary' },
                { label: 'Detailing', variant: 'secondary' },
                { label: 'ArcGIS', variant: 'primary' },
              ]
    },
    {
      title: 'One Profile. Endless Possibilities',
      subtitle: 'Plan your growth',
      description: ['Your Skill Portfolio isn’t just a record, it’s a living asset in a connected ecosystem.',
                    'Follow your personalized learning path and reach your career goals.'],
      icon: 'pi pi-user',
      skills: [
                { label: 'Networking', variant: 'primary' },
                { label: 'Creativity', variant: 'secondary' },
                { label: 'SQL', variant: 'primary' },
                { label: 'Focus', variant: 'secondary' },
                { label: 'Kubernetes', variant: 'primary' },
                { label: 'Empathy', variant: 'secondary' },
                { label: 'VSAT', variant: 'primary' },
                { label: 'Curiosity', variant: 'secondary' },
                { label: 'PostGIS', variant: 'primary' },
                { label: 'Decision-making', variant: 'secondary' },
                { label: 'CI/CD', variant: 'primary' },
                { label: 'Patience', variant: 'secondary' },
                { label: 'GeoJSON', variant: 'primary' },
                { label: 'Collaboration', variant: 'secondary' },
                { label: 'NMEA', variant: 'primary' },
                { label: 'Responsibility', variant: 'secondary' },
                { label: 'Remote sensing', variant: 'primary' },
              ]
    },
    {
      title: 'Ready to Unlock Your Potential?',
      subtitle: 'Log in to start building your Skill Portfolio',
      description: ['Your profile stays private, secure, and always in your control.',
                    'Use your portfolio in other applications of our ecosystem by logging in to them.'],
      icon: 'pi pi-sign-in',
      skills: [
          { label: 'Multi-GNSS', variant: 'primary' },
          { label: 'Problem analysis', variant: 'secondary' },
          { label: 'Carrier-phase', variant: 'primary' },
          { label: 'Accountability', variant: 'secondary' },
          { label: 'Signal acquisition', variant: 'primary' },
          { label: 'Precision under pressure', variant: 'secondary' },
          { label: 'SatNav algorithms', variant: 'primary' },
          { label: 'Structured thinking', variant: 'secondary' },
          { label: 'Downlink systems', variant: 'primary' },
          { label: 'Initiative', variant: 'secondary' },
          { label: 'Satellite tracking', variant: 'primary' },
          { label: 'Knowledge sharing', variant: 'secondary' },
        ]
    }
  ]

  constructor(private cdRef: ChangeDetectorRef, private router: Router, private firebase: FirebaseService, private messageService: MessageService, private route: ActivatedRoute) {}

  ngAfterViewInit(): void {
    this.route.queryParams.subscribe(params => {
      const submited: boolean = params['submited'];
      const mode: string = params['mode'];
      if (submited && mode == 'delete'){
        this.messageService.add({ 
          severity: 'info', 
          summary: 'Info', 
          detail: `Portfolio successfully deleted!`,
          life: 3000, 
          closable: true 
        }); 
      }
    });

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

  goToPortfolio() {
    this.router.navigate(['portfolio'])
  }

  isLogged(): boolean {
    return this.firebase.userId != '';
  }
}