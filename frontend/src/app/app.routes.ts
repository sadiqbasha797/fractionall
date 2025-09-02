import { Routes } from '@angular/router';
import { adminPanelRoutes } from './admin-panel/admin-panel.routes';

export const routes: Routes = [
  { path: 'admin', children: adminPanelRoutes },
  { path: '', redirectTo: '/admin/login', pathMatch: 'full' }
];
