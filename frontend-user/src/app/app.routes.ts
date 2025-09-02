import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Cars } from './cars/cars';
import { CarDetails } from './car-details/car-details';
import { Profile } from './profile/profile';
import { Register } from './register/register';
import { Login } from './login/login';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'cars', component: Cars },
  { path: 'car-details/:id', component: CarDetails },
  { path: 'profile', component: Profile },
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' } // Wildcard route for any unmatched URL
];
