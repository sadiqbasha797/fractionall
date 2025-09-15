import { Routes } from '@angular/router';
import { Login } from './login/login';
import { LoginSelection } from './login-selection/login-selection';
import { AdminLogin } from './admin-login/admin-login';
import { SuperAdminLogin } from './superadmin-login/superadmin-login';
import { Dashboard } from './dashboard/dashboard';
import { Amc } from './amc/amc';
import { Bookings } from './bookings/bookings';
import { Cars } from './cars/cars';
import { Contracts } from './contracts/contracts';
import { Tickets } from './tickets/tickets';
import { Users } from './users/users';
import { Waitlist } from './waitlist/waitlist';
import { BookNow } from './book-now/book-now';
import { Tokens } from './tokens/tokens';
import { ContactForms } from './contact-forms/contact-forms';
import { Notifications } from './notifications/notifications';
import { ManageContent } from './manage-content/manage-content';
import { Layout } from './layout/layout'; // Import the Layout component
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login }, // Keep old login for backward compatibility
  { path: 'login-selection', component: LoginSelection },
  { path: 'admin-login', component: AdminLogin },
  { path: 'superadmin-login', component: SuperAdminLogin },
  {
    path: '',
    component: Layout, // Layout acts as the layout for these routes
    canActivate: [AuthGuard], // Apply AuthGuard to the Layout route
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'amc', component: Amc },
      { path: 'bookings', component: Bookings },
      { path: 'cars', component: Cars },
      { path: 'contracts', component: Contracts },
      { path: 'tickets', component: Tickets },
      { path: 'users', component: Users },
      { path: 'waitlist', component: Waitlist },
      { path: 'book-now', component: BookNow },
      { path: 'tokens', component: Tokens },
      { path: 'contact-forms', component: ContactForms },
      { path: 'notifications', component: Notifications },
      { path: 'manage-content', component: ManageContent },
      { path: '', redirectTo: 'cars', pathMatch: 'full' } // Default route
    ]
  },
  { path: '**', redirectTo: 'login-selection', pathMatch: 'full' } // Redirect any unknown paths to login selection
];