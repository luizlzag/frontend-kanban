import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'auth/callback', loadComponent: () => import('./auth/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent) },
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
