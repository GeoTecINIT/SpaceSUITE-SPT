import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { Timeline } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../services/firebase.service";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { AuthService, SkillTagComponent } from "@eo4geo/ngx-bok-utils";
import { BehaviorSubject, map, of, Subscription, switchMap, tap } from "rxjs";

@Component({
  standalone: true,
  selector: 'home-page',
  templateUrl: './homePage.component.html',
  styleUrls: ['./homePage.component.css'],
  imports: [CommonModule, ButtonModule, Timeline, CardModule, SkillTagComponent, ToastModule],
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
                { label: 'Initiative', variant: 'primary' },
                { label: 'Python', variant: 'secondary' },
                { label: 'Thinking', variant: 'primary' },
                { label: 'RTK', variant: 'secondary' },
                { label: 'Teamwork', variant: 'primary' },
                { label: 'Cloud', variant: 'secondary' },
                { label: 'Communication', variant: 'primary' },
                { label: 'SatCom', variant: 'secondary' },
                { label: 'Adaptability', variant: 'primary' },
                { label: 'Satellite tracking', variant: 'secondary' },
                { label: 'Analysis', variant: 'primary' },
                { label: 'GNSS', variant: 'secondary' },
                { label: 'Detailing', variant: 'primary' },
                { label: 'ArcGIS', variant: 'secondary' },
                { label: 'Leadership', variant: 'primary' },
              ]
    },
    {
      title: 'One Profile. Endless Possibilities',
      subtitle: 'Plan your growth',
      description: ['Your Skill Portfolio isn’t just a record, it’s a living asset in a connected ecosystem.',
                    'Follow your personalized learning path and reach your career goals.'],
      icon: 'pi pi-user',
      skills: [
                { label: 'Creativity', variant: 'primary' },
                { label: 'SQL', variant: 'secondary' },
                { label: 'Focus', variant: 'primary' },
                { label: 'Kubernetes', variant: 'secondary' },
                { label: 'Empathy', variant: 'primary' },
                { label: 'VSAT', variant: 'secondary' },
                { label: 'Curiosity', variant: 'primary' },
                { label: 'PostGIS', variant: 'secondary' },
                { label: 'Decision-making', variant: 'primary' },
                { label: 'CI/CD', variant: 'secondary' },
                { label: 'Collaboration', variant: 'primary' },
                { label: 'NMEA', variant: 'secondary' },
                { label: 'Responsibility', variant: 'primary' },
                { label: 'Remote sensing', variant: 'secondary' },
                { label: 'Problem-solving', variant: 'primary' },
              ]
    },
    {
      title: 'Ready to Unlock Your Potential?',
      subtitle: 'Log in to start building your Skill Portfolio',
      description: ['Your profile stays private, secure, and always in your control.',
                    'Use your portfolio in other applications of our ecosystem by logging in to them.'],
      icon: 'pi pi-sign-in',
      skills: [
          { label: 'Problem analysis', variant: 'primary' },
          { label: 'Carrier-phase', variant: 'secondary' },
          { label: 'Patience', variant: 'primary' },
          { label: 'GeoJSON', variant: 'secondary' },
          { label: 'Precision under pressure', variant: 'primary' },
          { label: 'SatNav algorithms', variant: 'secondary' },
          { label: 'Structured thinking', variant: 'primary' },
          { label: 'Git', variant: 'secondary' },
          { label: 'Mentoring', variant: 'primary' },
          { label: 'QGIS', variant: 'secondary' },
          { label: 'Knowledge sharing', variant: 'primary' },
        ]
    }
  ]

  userStateSubscription$!: Subscription;
  isLogged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  havePortfolio: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);  

  constructor(private cdRef: ChangeDetectorRef, private router: Router, private firebase: FirebaseService, private authService: AuthService,
              private messageService: MessageService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.userStateSubscription$ = this.authService.getUserState().pipe(
      map( state => !!state?.logged),
      tap(isLogged => this.isLogged.next(isLogged)),
      switchMap(isLogged => 
        isLogged
          ? this.firebase.getUserPortfolio().pipe(map(portfolio => !!portfolio))
          : of(false) 
      ),
      tap(havePortfolio => this.havePortfolio.next(havePortfolio))
    ).subscribe();
  }

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
    this.userStateSubscription$.unsubscribe();
  }

  goToPortfolio() {
    if (this.havePortfolio.getValue()) {
      this.router.navigate([''], {onSameUrlNavigation: 'reload'})
    }
    else this.router.navigate(['new'])
  }
}