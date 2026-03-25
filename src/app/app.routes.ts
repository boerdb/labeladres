import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'lijst',
    pathMatch: 'full',
  },
  {
    path: 'lijst',
    loadComponent: () => import('./lijst/lijst.page').then( m => m.LijstPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
];
