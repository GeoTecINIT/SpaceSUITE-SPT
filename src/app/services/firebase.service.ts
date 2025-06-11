import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, collectionData, CollectionReference, deleteDoc, doc, docData, DocumentReference, Firestore, getDocs, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { catchError, concatMap, defaultIfEmpty, forkJoin, from, map, Observable, of, ReplaySubject, switchMap, take } from "rxjs";
import { FirebaseObject, LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { getDownloadURL, ref, uploadBytes, Storage } from "@angular/fire/storage";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private db: Firestore;
  private storage: Storage;
  private portfolioCollection: CollectionReference;

  userId: string = '';
  logged$: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(private bokInfoService: BokInformationService) {
    this.auth = inject(Auth);
    this.db = inject(Firestore);
    this.storage = inject(Storage)
    this.portfolioCollection = collection(this.db, 'Portfolios');
    authState(this.auth).subscribe(user => {
      this.userId = user?.uid ?? '';
      this.logged$.next(user != null);
    });
  }

  public getUserPortfolio(): Observable<UserPortfolio | undefined> {
    const docRef = doc(this.portfolioCollection, this.userId);
    const portfolioObservable = docData(docRef) as Observable<UserPortfolio>;

    return portfolioObservable.pipe(
      concatMap(portfolio => {
        if (!portfolio) return of(undefined);

        const experienceCollection = collection(docRef, 'workExperience');
        const projectsCollection = collection(docRef, 'projects');
        const educationCollection = collection(docRef, 'educationAndTraining');
        const languageCollection = collection(docRef, 'languageSkills');

        const workExperience = collectionData(experienceCollection, {}) as Observable<PortfolioItem[]>;
        const projects = collectionData(projectsCollection) as Observable<PortfolioItem[]>;
        const educationAndTraining = collectionData(educationCollection) as Observable<PortfolioItem[]>;
        const languageSkills = collectionData(languageCollection) as Observable<LanguageSkill[]>;

        return forkJoin({
          workExperience: workExperience.pipe(take(1)),
          projects: projects.pipe(take(1)),
          educationAndTraining: educationAndTraining.pipe(take(1)),
          languageSkills: languageSkills.pipe(take(1)),
        }).pipe(
          map(({ workExperience, projects, educationAndTraining, languageSkills }) => {
            portfolio.workExperience = this.formatPortfolioItems(workExperience);
            portfolio.projects = this.formatPortfolioItems(projects);
            portfolio.educationAndTraining = this.formatPortfolioItems(educationAndTraining);
            portfolio.languageSkills = languageSkills;
            return portfolio;
          })
        );
      })
    );
  }

  private formatPortfolioItems(items: PortfolioItem[]): PortfolioItem[] {
    return items.map( item => {
            item.bokConcepts = this.formatFirestoreConcepts(item.bokConcepts)
            if (item.startDate) item.startDate = item.startDate.toDate();
            if (item.endDate) item.endDate = item.endDate.toDate();
            return item
          });
  }

  public deletePortfolio(): Observable<void> {
    const subcollections = ['workExperience', 'projects', 'educationAndTraining', 'languageSkills'];
    const docRef = doc(this.portfolioCollection, this.userId);
    const deleteOps$ = subcollections.map(subcollectionName => {
      const colRef = collection(docRef, subcollectionName);
      return from(getDocs(colRef)).pipe(
        concatMap(querySnapshot => {
          const deletions = querySnapshot.docs.map(docSnap =>
            from(deleteDoc(docSnap.ref))
          );
          return deletions.length > 0 ? forkJoin(deletions) : from([undefined]);
        })
      );
    });
    return forkJoin(deleteOps$).pipe(map(() => undefined), concatMap( () => from(deleteDoc(docRef))));
  }

  public submitPortfolio(portfolio: UserPortfolio, oldPortfolio?: UserPortfolio): Observable<void> {
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
        if (oldPortfolio) {
          return this.updatePortfolio(newDocRef, newPortfolio);
        }
        return this.createPortfolio(newDocRef, newPortfolio);
      })
    )
  }

  private createPortfolio(docRef: DocumentReference, portfolio: UserPortfolio): Observable<void> {
    const plainPortfolio = portfolio.toFirebase();
    return from(setDoc(docRef, plainPortfolio)).pipe(concatMap( () => {
      const experienceCollection = collection(docRef, 'workExperience');
      const projectsCollection = collection(docRef, 'projects');
      const educationAndTrainingCollection = collection(docRef, 'educationAndTraining');
      const languageSkillsCollection = collection(docRef, 'languageSkills');

      const experienceOps = this.addDocumentToCollection(experienceCollection, portfolio.workExperience);
      const projectOps = this.addDocumentToCollection(projectsCollection, portfolio.projects);
      const educationOps = this.addDocumentToCollection(educationAndTrainingCollection, portfolio.educationAndTraining);
      const languageOps = this.addDocumentToCollection(languageSkillsCollection, portfolio.languageSkills);

      const allOps = [
        ...experienceOps,
        ...projectOps,
        ...educationOps,
        ...languageOps
      ];
      return forkJoin(allOps).pipe(defaultIfEmpty(undefined), map(() => undefined));
    }));
  }

  private addDocumentToCollection(collection: CollectionReference, items: FirebaseObject[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection);
      item._id = docRef.id;
      const plainItem = item.toFirebase();
      return from(setDoc(docRef, plainItem));
    })
  }

  private updatePortfolio(docRef: DocumentReference, portfolio: UserPortfolio): Observable<void> {
    return of();
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

  public updateUserImage(image: File) {
    const path = `Portfolio_Images/${this.userId}`;
    const storageRef = ref(this.storage, path);
    return from(uploadBytes(storageRef, image)).pipe(
      concatMap(() => getDownloadURL(storageRef))
    );
  }

  public getUserImage(): Observable<string> {
    const path = `Portfolio_Images/${this.userId}`;
    const storageRef = ref(this.storage, path);
    return from(getDownloadURL(storageRef)).pipe(catchError( () => of('')));
  }

}