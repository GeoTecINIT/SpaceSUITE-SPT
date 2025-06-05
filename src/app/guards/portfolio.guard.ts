import {  CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';

export const PortfolioGuard: CanActivateFn = () => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  return firebaseService.getUserPortfolio().pipe(
    take(1),
    map(portfolio => {
      if (portfolio) {
        return true;
      } else {
        router.navigate(['new']);
        return false;
      }
    })
  );
};