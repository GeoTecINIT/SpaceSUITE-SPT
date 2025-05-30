import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  userId: string = '';

  constructor() {
    this.auth = inject(Auth);
    authState(this.auth).subscribe(user => this.userId = user?.uid ?? '');
  }
}