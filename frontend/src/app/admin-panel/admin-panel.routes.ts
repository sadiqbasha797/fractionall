import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Amc } from './amc/amc';
import { Bookings } from './bookings/bookings';
import { Cars } from './cars/cars';
import { Tickets } from './tickets/tickets';
import { Users } from './users/users';
import { Waitlist } from './waitlist/waitlist';
import { ContactForms } from './contact-forms/contact-forms';
import { AdminPanel } from './admin-panel'; // Import the AdminPanel component
import { AuthGuard } from '../services/auth.guard';

export const adminPanelRoutes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: AdminPanel, // AdminPanel acts as the layout for these routes
    canActivate: [AuthGuard], // Apply AuthGuard to the AdminPanel route
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'amc', component: Amc },
      { path: 'bookings', component: Bookings },
      { path: 'cars', component: Cars },
      { path: 'tickets', component: Tickets },
      { path: 'users', component: Users },
      { path: 'waitlist', component: Waitlist },
      { path: 'contact-forms', component: ContactForms },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // Default route for AdminPanel
    ]
  },
  { path: '**', redirectTo: 'login', pathMatch: 'full' } // Redirect any unknown admin paths to login
];