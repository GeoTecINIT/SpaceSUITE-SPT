import {  CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { concatMap, map, of, take } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';

export const CreateGuard: CanActivateFn = () => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  return firebaseService.logged$.asObservable().pipe(
    take(1),
    concatMap(logged => {
      if (logged) return firebaseService.getUserPortfolio()
      return of(undefined)
    }),
    take(1),
    map(portfolio => {
      if (portfolio) {
        router.navigate(['portfolio']);
        return false;
      } else {
        return true;
      }
    })
  );
};