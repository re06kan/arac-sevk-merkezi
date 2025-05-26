import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'vehicle-registration',
        loadComponent: () => import('./dashboard/vehicle-registration/vehicle-registration.component').then(m => m.VehicleRegistrationComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'driver-registration',
        loadComponent: () => import('./dashboard/driver-registration/driver-registration.component').then(m => m.DriverRegistrationComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'personnel-management',
        loadComponent: () => import('./dashboard/personnel-management/personnel-management.component').then(m => m.PersonnelManagementComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./dashboard/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'user-management',
        loadComponent: () => import('./dashboard/user-management/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'help-center',
        loadComponent: () => import('./dashboard/help-center/help-center.component').then(m => m.HelpCenterComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'user'] }
      },
      {
        path: 'gorevkayit/:id',
        loadComponent: () => import('./dashboard/gorev-kayit/gorev-kayit.component').then(m => m.GorevKayitComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'user'] }
      }
    ]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
