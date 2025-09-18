import {  CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { AuthService } from '@eo4geo/ngx-bok-utils';

export const HomepageGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getUserState().pipe(
    take(1),
    map(state => {
      if (state?.logged) return router.createUrlTree(['portfolio']);
      return true
    })
  );
};