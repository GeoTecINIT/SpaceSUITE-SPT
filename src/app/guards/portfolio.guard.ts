import {  CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { concatMap, map, of, take } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { AuthService } from '@eo4geo/ngx-bok-utils';

export const PortfolioGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);
  return authService.getUserState().pipe(
    take(1),
    concatMap(state => {
      if (state?.logged) return firebaseService.getUserPortfolio()
      return of(null)
    }),
    take(1),
    map(portfolio => {
      if (portfolio) {
        return true;
      } else return router.createUrlTree(['about']);
    })
  );
};