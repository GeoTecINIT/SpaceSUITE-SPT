import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, CollectionReference, doc, docData, Firestore, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { forkJoin, from, map, Observable, of, Subject, switchMap, take } from "rxjs";
import { LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { FormDataService } from "./formData.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private db: Firestore;
  private portfolioCollection: CollectionReference;
  userId: string = '';
  logged$: Subject<boolean> = new Subject();

  constructor(private formDataService: FormDataService, private bokInfoService: BokInformationService) {
    this.auth = inject(Auth);
    this.db = inject(Firestore);
    this.portfolioCollection = collection(this.db, 'Portfolios');
    authState(this.auth).subscribe(user => {
      this.userId = user?.uid ?? '';
      this.logged$.next(user != null);
    });
  }

  public getUserPortfolio(): Observable<UserPortfolio> {
    const docRef = doc(this.portfolioCollection, this.userId);
    return docData(docRef) as Observable<UserPortfolio>;
  }

  public submitPortfolio(newPortfolio: UserPortfolio): Observable<void> {
    newPortfolio.personalInformation.nativeLanguage = this.formDataService.getIsoCode(newPortfolio.personalInformation.nativeLanguage!).toUpperCase();
    newPortfolio.languageSkills =  newPortfolio.languageSkills.map(skill =>{
      let formatedLanguage = new LanguageSkill();
      formatedLanguage.language = this.formDataService.getIsoCode(skill.language!).toUpperCase();
      formatedLanguage.level = skill.level;
      return formatedLanguage;
    });
    const experienceObservables = this.formatBokConcepts(newPortfolio.educationAndTraining);
    const workObservables = this.formatBokConcepts(newPortfolio.workExperience);
    const projectObservables = this.formatBokConcepts(newPortfolio.projects);
    return forkJoin([experienceObservables, workObservables, projectObservables]).pipe(
      switchMap( results => {
        results[0].forEach((concepts, index) => {
          newPortfolio.educationAndTraining[index].bokConcepts = concepts;
        })
        results[1].forEach((concepts, index) => {
          newPortfolio.workExperience[index].bokConcepts = concepts;
        })
        results[2].forEach((concepts, index) => {
          newPortfolio.projects[index].bokConcepts = concepts;
        })
        const newDocRef = doc(this.portfolioCollection, this.userId);
        const timestamp = serverTimestamp();
        newPortfolio.updatedAt = timestamp;
        newPortfolio._id = this.userId;
        return from(setDoc(newDocRef, newPortfolio.toPlain()));
      })
    )
  }

  private formatBokConcepts(portfolioItems: PortfolioItem[]): Observable<string[][]> {
    return portfolioItems.length > 0 ? 
      forkJoin(
        portfolioItems.map(item => item.bokConcepts.length > 0 ? 
          forkJoin(item.bokConcepts.map(concept =>
            this.bokInfoService.getConceptName(concept).pipe(
              take(1),
              map(conceptName => `[${concept}] ${conceptName}`)
            )
          ))
          : of([])
        ) 
      )
    : of([]);
  }
}