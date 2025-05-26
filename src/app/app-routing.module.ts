import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehicleRegistrationComponent } from './dashboard/vehicle-registration/vehicle-registration.component';
import { DriverRegistrationComponent } from './dashboard/driver-registration/driver-registration.component';
import { GorevKayitComponent } from './dashboard/gorev-kayit/gorev-kayit.component';
import { PersonnelManagementComponent } from './dashboard/personnel-management/personnel-management.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { UserManagementComponent } from './dashboard/user-management/user-management.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'home', component: DashboardHomeComponent },
      { path: 'vehicle-registration', component: VehicleRegistrationComponent },
      { path: 'driver-registration', component: DriverRegistrationComponent },
      { path: 'gorevkayit/:id', component: GorevKayitComponent },
      { path: 'personnel-management', component: PersonnelManagementComponent },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'reports', component: ReportsComponent } // Yeni rota eklendi
    ]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
