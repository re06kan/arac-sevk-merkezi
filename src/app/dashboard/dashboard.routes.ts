import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { HelpCenterComponent } from './help-center/help-center.component';
import { AuthGuard } from '../guards/auth.guard';

// Diğer component'ları doğrudan import ediyoruz
import { VehicleRegistrationComponent } from './vehicle-registration/vehicle-registration.component';
import { DriverRegistrationComponent } from './driver-registration/driver-registration.component';
import { PersonnelManagementComponent } from './personnel-management/personnel-management.component';
import { ReportsComponent } from './reports/reports.component';
import { UserManagementComponent } from './user-management/user-management.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: DashboardHomeComponent
      },
      {
        path: 'vehicle-registration',
        component: VehicleRegistrationComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'driver-registration',
        component: DriverRegistrationComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'personnel-management',
        component: PersonnelManagementComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'help-center',
        component: HelpCenterComponent,
        canActivate: [AuthGuard]
      },
      // Diğer tüm rotalar için de AuthGuard ekleyelim
      {
        path: 'gorevkayit/:id',
        loadComponent: () => import('./gorev-kayit/gorev-kayit.component').then(c => c.GorevKayitComponent),
        canActivate: [AuthGuard]
      }
    ]
  }
];
