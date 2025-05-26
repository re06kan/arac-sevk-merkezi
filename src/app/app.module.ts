import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

// Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App components
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { UserManagementComponent } from './dashboard/user-management/user-management.component';

// Standalone components
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehicleRegistrationComponent } from './dashboard/vehicle-registration/vehicle-registration.component';
import { DriverRegistrationComponent } from './dashboard/driver-registration/driver-registration.component';
import { GorevKayitComponent } from './dashboard/gorev-kayit/gorev-kayit.component';
import { PersonnelManagementComponent } from './dashboard/personnel-management/personnel-management.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';

@NgModule({
  declarations: [
    // Burada standalone bileşenler OLMAMALI
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Material modules
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSnackBarModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTableModule,
    MatTabsModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatDialogModule,
    MatProgressSpinnerModule,

    // Tüm standalone bileşenler imports'a eklenmeli
    AppComponent,
    LoginComponent,
    ReportsComponent,
    UserManagementComponent,

    // Diğer standalone bileşenler
    DashboardComponent,
    VehicleRegistrationComponent,
    DriverRegistrationComponent,
    GorevKayitComponent,
    PersonnelManagementComponent,
    DashboardHomeComponent,

    // Router module (must be last)
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }