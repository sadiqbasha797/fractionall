import { Routes } from '@angular/router';
import { Login } from './login/login';
import { LoginSelection } from './login-selection/login-selection';
import { AdminLogin } from './admin-login/admin-login';
import { SuperAdminLogin } from './superadmin-login/superadmin-login';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { ResetPasswordComponent } from './reset-password/reset-password';
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
import { Settings } from './settings/settings';
import { Layout } from './layout/layout'; // Import the Layout component
import { AuthGuard } from './services/auth.guard';
import { PermissionGuard } from './services/permission.guard';
import { Revenvue } from './revenvue/revenvue';
import { Payments } from './payments/payments';

export const routes: Routes = [
  { path: 'login', component: Login }, // Keep old login for backward compatibility
  { path: 'login-selection', component: LoginSelection },
  { path: 'admin-login', component: AdminLogin },
  { path: 'superadmin-login', component: SuperAdminLogin },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: Layout, // Layout acts as the layout for these routes
    canActivate: [AuthGuard], // Apply AuthGuard to the Layout route
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [PermissionGuard], data: { permission: 'dashboard' } },
      { path: 'amc', component: Amc, canActivate: [PermissionGuard], data: { permission: 'amc' } },
      { path: 'bookings', component: Bookings, canActivate: [PermissionGuard], data: { permission: 'bookings' } },
      { path: 'cars', component: Cars, canActivate: [PermissionGuard], data: { permission: 'cars' } },
      { path: 'contracts', component: Contracts, canActivate: [PermissionGuard], data: { permission: 'contracts' } },
      { path: 'tickets', component: Tickets, canActivate: [PermissionGuard], data: { permission: 'tickets' } },
      { path: 'users', component: Users, canActivate: [PermissionGuard], data: { permission: 'users' } },
      { path: 'waitlist', component: Waitlist },
      { path: 'book-now', component: BookNow },
      { path: 'tokens', component: Tokens, canActivate: [PermissionGuard], data: { permission: 'tokens' } },
      { path: 'contact-forms', component: ContactForms, canActivate: [PermissionGuard], data: { permission: 'contact-forms' } },
      { path: 'notifications', component: Notifications, canActivate: [PermissionGuard], data: { permission: 'notifications' } },
      { path: 'manage-content', component: ManageContent, canActivate: [PermissionGuard], data: { permission: 'manage-content' } },
      { path: 'settings', component: Settings, data: { role: 'superadmin' } },
      { path: 'revenue', component: Revenvue, canActivate: [PermissionGuard], data: { permission: 'revenue' } },
      { path: 'payments', component: Payments, canActivate: [PermissionGuard], data: { permission: 'payments' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // Default route
    ]
  },
  { path: '**', redirectTo: 'login-selection', pathMatch: 'full' } // Redirect any unknown paths to login selection
];
