import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, CollectionReference, deleteDoc, doc, docData, Firestore, serverTimestamp, setDoc, updateDoc } from "@angular/fire/firestore";
import { forkJoin, from, map, Observable, of, ReplaySubject, Subject, switchMap, take } from "rxjs";
import { LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { FormDataService } from "./formData.service";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { R } from "@angular/core/event_dispatcher.d-pVP0-wST";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private db: Firestore;
  private portfolioCollection: CollectionReference;
  userId: string = '';
  logged$: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(private formDataService: FormDataService, private bokInfoService: BokInformationService) {
    this.auth = inject(Auth);
    this.db = inject(Firestore);
    this.portfolioCollection = collection(this.db, 'Portfolios');
    authState(this.auth).subscribe(user => {
      this.userId = user?.uid ?? '';
      this.logged$.next(user != null);
    });
  }

  public getUserPortfolio(): Observable<UserPortfolio | undefined> {
    const docRef = doc(this.portfolioCollection, this.userId);
    const portfolioObservable = docData(docRef) as Observable<UserPortfolio>;
    return portfolioObservable.pipe(map( portfolio => {
      if (!portfolio) return undefined;
      const formatedPortfolio = portfolio;
      formatedPortfolio.educationAndTraining.forEach( (item, index) => {
        formatedPortfolio.educationAndTraining[index].bokConcepts = this.formatFirestoreConcepts(item.bokConcepts)
        if (item.startDate) formatedPortfolio.educationAndTraining[index].startDate = item.startDate.toDate();
        if (item.endDate) formatedPortfolio.educationAndTraining[index].endDate = item.endDate.toDate();
      });
      formatedPortfolio.workExperience.forEach( (item, index) => {
        formatedPortfolio.workExperience[index].bokConcepts = this.formatFirestoreConcepts(item.bokConcepts)
        if (item.startDate) formatedPortfolio.workExperience[index].startDate = item.startDate.toDate();
        if (item.endDate) formatedPortfolio.workExperience[index].endDate = item.endDate.toDate();
      });
      formatedPortfolio.projects.forEach( (item, index) => {
        formatedPortfolio.projects[index].bokConcepts = this.formatFirestoreConcepts(item.bokConcepts)
        if (item.startDate) formatedPortfolio.projects[index].startDate = item.startDate.toDate();
        if (item.endDate) formatedPortfolio.projects[index].endDate = item.endDate.toDate();
      });
      return formatedPortfolio;
    }))
  }

  public deletePortfolio(): Observable<void> {
    const docRef = doc(this.portfolioCollection, this.userId);
    return from(deleteDoc(docRef));
  }

  public submitPortfolio(portfolio: UserPortfolio, update: boolean = false): Observable<void> {
    const newPortfolio = new UserPortfolio(portfolio);
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
        //if (update) return from(updateDoc(newDocRef, newPortfolio.toFirestore()));
        return from(setDoc(newDocRef, newPortfolio.toFirestore()));
      })
    )
  }

  private formatFirestoreConcepts(concepts: string[]){
    const regex = /\[(.*?)\]/;
    return concepts.map(concept => concept.match(regex)?.[1])
    .filter(Boolean) as string[];
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