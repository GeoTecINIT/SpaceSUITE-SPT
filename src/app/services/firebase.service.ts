import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  userId: string = '';
  logged$: Subject<boolean> = new Subject();

  constructor() {
    this.auth = inject(Auth);
    authState(this.auth).subscribe(user => {
      this.userId = user?.uid ?? '';
      this.logged$.next(user != null);
    });
  }
}