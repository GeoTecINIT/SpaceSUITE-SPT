import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';

export const EmptyPortfolioGuard: CanMatchFn = () => {
  const firebaseService = inject(FirebaseService);
  return firebaseService.getUserPortfolio().pipe(
    take(1),
    map(portfolio => portfolio === undefined)
  );
};