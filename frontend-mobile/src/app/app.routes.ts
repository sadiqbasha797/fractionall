import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Cars } from './cars/cars';
import { CarDetails } from './car-details/car-details';
import { Profile } from './profile/profile';
import { Register } from './register/register';
import { Login } from './login/login';
import { Bookings } from './bookings/bookings';
import { About } from './about/about';
import { ContactUs } from './contact-us/contact-us';
import { NotificationsComponent } from './notifications/notifications.component';
import { OurStoryComponent } from './our-story/our-story';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes (no authentication required)
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  
  // Protected routes (authentication required)
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'cars', component: Cars, canActivate: [AuthGuard] },
  { path: 'car-details/:id', component: CarDetails, canActivate: [AuthGuard] },
  { path: 'profile', component: Profile, canActivate: [AuthGuard] },
  { path: 'bookings', component: Bookings, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'about', component: About, canActivate: [AuthGuard] },
  { path: 'our-story', component: OurStoryComponent, canActivate: [AuthGuard] },
  { path: 'contact-us', component: ContactUs, canActivate: [AuthGuard] },
  
  // Default redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } // Wildcard route redirects to login
];
