import { inject, Injectable } from "@angular/core";
import { collection, collectionData, CollectionReference, deleteDoc, doc, docData, DocumentReference, Firestore, getDocs, serverTimestamp, setDoc, updateDoc } from "@angular/fire/firestore";
import { catchError, concatMap, defaultIfEmpty, filter, forkJoin, from, map, Observable, of, ReplaySubject, switchMap, take } from "rxjs";
import { FirebaseObject, LanguageSkill, PortfolioItem, UserPortfolio } from "../model/userPortfolio";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { getDownloadURL, ref, uploadBytes, Storage, deleteObject } from "@angular/fire/storage";
import { AuthService } from "@eo4geo/ngx-bok-utils";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private db: Firestore;
  private storage: Storage;
  private portfolioCollection: CollectionReference;

  private userId: ReplaySubject<string> = new ReplaySubject<string>(1);

  constructor(private bokInfoService: BokInformationService, private authService: AuthService) {
    this.db = inject(Firestore);
    this.storage = inject(Storage)
    this.portfolioCollection = collection(this.db, 'Portfolios');
    this.authService.getUserState().pipe(filter(state => state != undefined)).subscribe(state => this.userId.next(state.uid));
  }

  public getUserPortfolio(): Observable<UserPortfolio | undefined> {
    return this.userId.asObservable().pipe(
      concatMap(uid => {
        const docRef = doc(this.portfolioCollection, uid);
        return docData(docRef).pipe(
          map(portfolio => ({ portfolio: portfolio as UserPortfolio, docRef }))
        );
      }),
      concatMap(({ portfolio, docRef }) => {
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
    return this.userId.asObservable().pipe(
      take(1),
      concatMap(uid => {
        const subcollections = ['workExperience', 'projects', 'educationAndTraining', 'languageSkills'];
        const docRef = doc(this.portfolioCollection, uid);
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
      })
    );
  }

  public submitPortfolio(portfolio: UserPortfolio, oldPortfolio?: UserPortfolio): Observable<void> {
    const newPortfolio = new UserPortfolio(portfolio);
    const experienceObservables = this.formatBokConcepts(newPortfolio.educationAndTraining);
    const workObservables = this.formatBokConcepts(newPortfolio.workExperience);
    const projectObservables = this.formatBokConcepts(newPortfolio.projects);
    const uidObservable = this.userId.asObservable().pipe(take(1));
    return forkJoin([experienceObservables, workObservables, projectObservables, uidObservable]).pipe(
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
        const newDocRef = doc(this.portfolioCollection, results[3]);
        const timestamp = serverTimestamp();
        newPortfolio.updatedAt = timestamp;
        newPortfolio._id = results[3];
        if (oldPortfolio) {
          return this.updatePortfolio(newDocRef, newPortfolio, oldPortfolio);
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

      const experienceOps = this.addDocumentsToCollection(experienceCollection, portfolio.workExperience);
      const projectOps = this.addDocumentsToCollection(projectsCollection, portfolio.projects);
      const educationOps = this.addDocumentsToCollection(educationAndTrainingCollection, portfolio.educationAndTraining);
      const languageOps = this.addDocumentsToCollection(languageSkillsCollection, portfolio.languageSkills);

      const allOps = [
        ...experienceOps,
        ...projectOps,
        ...educationOps,
        ...languageOps
      ];
      return forkJoin(allOps).pipe(defaultIfEmpty(undefined), map(() => undefined));
    }));
  }

  private addDocumentsToCollection(collection: CollectionReference, items: FirebaseObject[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection);
      item._id = docRef.id;
      const plainItem = item.toFirebase();
      return from(setDoc(docRef, plainItem));
    })
  }

  private updateDocumentsFromCollection(collection: CollectionReference, items:  Array<{ _id: string; [key: string]: any }>): Observable<void>[] {
    return items.map( ({ _id, ...data }) => {
      const docRef = doc(collection, _id);
      if (Object.keys(data).length > 0) {
        return from(updateDoc(docRef, data))
      }
      return of(void 0)
    })
  }

  private deleteDocumentsFromCollection(collection: CollectionReference, items: FirebaseObject[]): Observable<void>[] {
    return items.map( item => {
      const docRef = doc(collection, item._id);
      return from(deleteDoc(docRef));
    })
  }

  private updatePortfolio(docRef: DocumentReference, portfolio: UserPortfolio, oldPortfolio: UserPortfolio): Observable<void> {
    // Define subcollection references
    const experienceCollection = collection(docRef, 'workExperience');
    const projectsCollection = collection(docRef, 'projects');
    const educationAndTrainingCollection = collection(docRef, 'educationAndTraining');
    const languageSkillsCollection = collection(docRef, 'languageSkills');

    // Define allOps Array

    const allOps = [];

    // Update new portfolio items
    const newExperienceArray: PortfolioItem[] = portfolio.workExperience.filter( exp => exp._id == '');
    const newEducationArray: PortfolioItem[] = portfolio.educationAndTraining.filter( exp => exp._id == '');
    const newProjectsArray: PortfolioItem[] = portfolio.projects.filter( exp => exp._id == '');
    const newLanguageArray: LanguageSkill[] = portfolio.languageSkills.filter( exp => exp._id == '');

    const experienceOps = this.addDocumentsToCollection(experienceCollection, newExperienceArray);
    const projectOps = this.addDocumentsToCollection(projectsCollection, newProjectsArray);
    const educationOps = this.addDocumentsToCollection(educationAndTrainingCollection, newEducationArray);
    const languageOps = this.addDocumentsToCollection(languageSkillsCollection, newLanguageArray);

    allOps.push([
      ...experienceOps,
      ...projectOps,
      ...educationOps,
      ...languageOps
    ]);

    // Update current portfolio Items

    const updateExperienceArray = portfolio.workExperience.flatMap(exp =>
      oldPortfolio.workExperience
        .filter(oldExp => exp._id === oldExp._id)
        .map(oldExp => {
          const plainExp = exp.toFirebase();
          const plainOldExp = oldExp.toFirebase();
          const updateObject = this.createUpdateObject(plainExp, plainOldExp, '', ['updatedAt', 'startDate', 'endDate'], false);
          updateObject['_id'] = exp._id
          return updateObject
        })
    );
    const updateEducationArray: PortfolioItem[] = portfolio.educationAndTraining.flatMap(exp =>
      oldPortfolio.educationAndTraining
        .filter(oldExp => exp._id === oldExp._id)
        .map(oldExp => {
          const plainExp = exp.toFirebase();
          const plainOldExp = oldExp.toFirebase();
          const updateObject = this.createUpdateObject(plainExp, plainOldExp, '', ['updatedAt', 'startDate', 'endDate'], false)
          updateObject['_id'] = exp._id
          return updateObject
        })
    );
    const updateProjectsArray: PortfolioItem[] = portfolio.projects.flatMap(exp =>
      oldPortfolio.projects
        .filter(oldExp => exp._id === oldExp._id)
        .map(oldExp => {
          const plainExp = exp.toFirebase();
          const plainOldExp = oldExp.toFirebase();
          const updateObject = this.createUpdateObject(plainExp, plainOldExp, '', ['updatedAt', 'startDate', 'endDate'], false)
          updateObject['_id'] = exp._id
          return updateObject
        })
    );
    const updateLanguageArray: LanguageSkill[] = portfolio.languageSkills.flatMap(exp =>
      oldPortfolio.languageSkills
        .filter(oldExp => exp._id === oldExp._id)
        .map(oldExp => {
          const plainExp = exp.toFirebase();
          const plainOldExp = oldExp.toFirebase();
          const updateObject = this.createUpdateObject(plainExp, plainOldExp, '', ['updatedAt', 'startDate', 'endDate'], false)
          updateObject['_id'] = exp._id
          return updateObject
        })
    );

    const updateExperienceOps = this.updateDocumentsFromCollection(experienceCollection, updateExperienceArray);
    const updateProjectOps = this.updateDocumentsFromCollection(projectsCollection, updateProjectsArray);
    const updateEducationOps = this.updateDocumentsFromCollection(educationAndTrainingCollection, updateEducationArray);
    const updateLanguageOps = this.updateDocumentsFromCollection(languageSkillsCollection, updateLanguageArray);

    allOps.push([
      ...updateExperienceOps,
      ...updateProjectOps,
      ...updateEducationOps,
      ...updateLanguageOps
    ]);

    // Delete old portfolio items

    const deleteExperienceArray: PortfolioItem[] = oldPortfolio.workExperience.filter( oldExp => !portfolio.workExperience.some(exp => exp._id == oldExp._id));
    const deleteEducationArray: PortfolioItem[] = oldPortfolio.educationAndTraining.filter( oldExp => !portfolio.educationAndTraining.some(exp => exp._id == oldExp._id));
    const deleteProjectsArray: PortfolioItem[] = oldPortfolio.projects.filter( oldExp => !portfolio.projects.some(exp => exp._id == oldExp._id));
    const deleteLanguageArray: LanguageSkill[] = oldPortfolio.languageSkills.filter( oldExp => !portfolio.languageSkills.some(exp => exp._id == oldExp._id));

    const deleteExperienceOps = this.deleteDocumentsFromCollection(experienceCollection, deleteExperienceArray);
    const deleteProjectOps = this.deleteDocumentsFromCollection(projectsCollection, deleteProjectsArray);
    const deleteEducationOps = this.deleteDocumentsFromCollection(educationAndTrainingCollection, deleteEducationArray);
    const deleteLanguageOps = this.deleteDocumentsFromCollection(languageSkillsCollection, deleteLanguageArray);

    allOps.push([
      ...deleteExperienceOps,
      ...deleteProjectOps,
      ...deleteEducationOps,
      ...deleteLanguageOps
    ]);

    // Update basic portfolio information

    const basicInfoUpdate: { [key: string]: any } = this.createUpdateObject(portfolio, oldPortfolio, '', ['updatedAt', 'startDate', 'endDate']);

    if (Object.keys(basicInfoUpdate).length > 0) {
      allOps.push(from(updateDoc(docRef, basicInfoUpdate)))
    }

    return forkJoin(allOps).pipe(defaultIfEmpty(undefined), map(() => undefined));
  }

  private compareElements<T>(objectA: T, objectB: T): boolean {
    if (Array.isArray(objectA) && Array.isArray(objectB)) {
      if (objectA === objectB) return true;
      if (objectA.length != objectB.length) return false;
      for (var i = 0; i < objectA.length; ++i) {
        if (!this.compareElements(objectA[i], objectB[i])) return false;
      }
      return true;
    }
    if (typeof objectA === 'object' && objectA != null &&
        typeof objectB === "object" && objectB != null) {
      for (const key of Object.keys(objectA) as Array<keyof T>) {
        const aValue = objectA[key];
        const bValue = objectB[key];
        if (!this.compareElements(aValue, bValue)) return false;
      }
      return true;
    }
    return objectA === objectB;
  }

  private createUpdateObject<T extends object>(newObject: T, oldObject: T, prefix: string = '', specialObjects: string[] = [], ignoreArrays: boolean = true): any {
    const updateObject: { [key: string]: any } = {}
    if (newObject != null) {
      for (const key of Object.keys(newObject) as Array<keyof T>) {
        const newValue = newObject[key];
        const oldValue = oldObject != null ? oldObject[key] : null;
        const fullKey = `${prefix}${key as string}`;
        if ((ignoreArrays && Array.isArray(newValue)) || this.compareElements(newValue, oldValue)) continue
        if (typeof newValue == 'object') {
          if (specialObjects.includes(key as string) || Array.isArray(newValue)) updateObject[fullKey] = newValue;
          else {
            const subObject = this.createUpdateObject(newValue as object, oldValue as object, key as string + '.', specialObjects);
            for (const subKey of Object.keys(subObject)) {
              const fullSubKey = `${prefix}${subKey as string}`;
              updateObject[fullSubKey] = subObject[subKey];
            }
          }
        }
        else updateObject[fullKey] = newValue;
      }
    }
    else {
      if (prefix != '') {
        updateObject[prefix.slice(0, -1)] = null;
      }
    }
    return updateObject;
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
    return this.userId.asObservable().pipe(
      take(1),
      concatMap(uid => {
        const path = `Portfolio_Images/${uid}`;
        const storageRef = ref(this.storage, path);
        return from(uploadBytes(storageRef, image)).pipe(
          concatMap(() => getDownloadURL(storageRef))
        );
      })
    );
  }

  public getUserImage(): Observable<string> {
    return this.userId.asObservable().pipe(
      take(1),
      concatMap(uid => {
        const path = `Portfolio_Images/${uid}`;
        const storageRef = ref(this.storage, path);
        return from(getDownloadURL(storageRef)).pipe(catchError( () => of('')));
      })
    );
  }

  public deleteUserImage() {
    return this.userId.asObservable().pipe(
      take(1),
      concatMap(uid => {
        const path = `Portfolio_Images/${uid}`;
        const storageRef = ref(this.storage, path);
        return from(deleteObject(storageRef));
      })
    );
  }

}