import { ApplicationConfig } from '@angular/core';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AuthGuard, NotFoundPageComponent, OrganizationPageComponent, UserPageComponent } from '@eo4geo/ngx-bok-utils';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { PortfolioPageComponent } from './app/components/portfolioPage/portfolioPage.component';
import { HomePageComponent } from './app/components/homePage/homePage.component';
import { PortfolioFormComponent } from './app/components/portfolioForm/portfolioForm.component';

const routes: Routes = [
    { path: '', component: HomePageComponent},
    { path: 'portfolio', component: PortfolioPageComponent, canActivate: [AuthGuard]},
    { path: 'new', component: PortfolioFormComponent, canActivate: [AuthGuard]},
    { path: 'profile', component: UserPageComponent, canActivate: [AuthGuard]},
    { path: 'organizations', component: OrganizationPageComponent, canActivate: [AuthGuard]},
    { path: '**', component: NotFoundPageComponent}
];

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideFirebaseApp(() => initializeApp(environment.FIREBASE)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideProtractorTestingSupport(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    prefix: 'p',
                    darkModeSelector: false,
                    cssLayer: false
                }             
            }
        })
    ]
};