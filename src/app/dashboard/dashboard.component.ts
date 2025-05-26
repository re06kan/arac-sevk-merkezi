import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../services/vehicle.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { NgModule } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators'; // Add this import for the filter operator

interface Task {
  id: number;
  task_status: string;
  task_type: string;
  route_description?: string;
}

interface Vehicle {
  id: number;
  military_plate: string;
  civilian_plate: string;
  brand: string;
  model: string;
  task_status?: string;
  task_type?: string;
  current_task?: Task;
}

// Define a type for task status values
type TaskStatus = 'GÖREVDE' | 'ACIK' | 'UZUN_YOL' | 'KADEMEDE' | 'MÜSAİT' | 'KAPALI';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatPaginatorModule,
    MatCardModule,
    MatChipsModule,
    MatButtonToggleModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isHomePage = false;
  isGorevKayit = false;
  activeFilter = 'all';
  vehicles: any[] = [];
  filteredVehicles: any[] = [];
  userRole: string | null = null;
  isAdmin: boolean = false;
  isUser = false; // Added for normal user role check
  isGhm = false;  // Added for GHM role check
  sidenavOpened: boolean = true;
  currentUserFullName: string = '';
  currentUserRole: string = '';
  currentUserInitials: string = '';

  constructor(
    private vehicleService: VehicleService,
    private taskService: TaskService,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url === '/dashboard' || event.url === '/dashboard/home') {
          this.loadVehicles();
        }
        this.isGorevKayit = event.url.includes('gorevkayit');
        this.isHomePage = event.url === '/dashboard/home' || event.url === '/dashboard';
      }
    });
  }

  ngOnInit() {
    this.loadVehicles();
    this.activeFilter = 'all';
    // Kullanıcı rolünü al
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.userRole === 'admin';

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        // Reset the scroll position when route changes
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
        }
      });
    
    // Get current user and check role
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isAdmin = currentUser.role === 'admin';
      this.isUser = currentUser.role === 'user';
      this.isGhm = currentUser.role === 'ghm';
      
      // Set user display information
      this.currentUserFullName = currentUser.fullname || '';
      this.currentUserRole = this.getRoleDisplayName(currentUser.role);
      this.currentUserInitials = this.getInitials(currentUser.fullname);
    }

    // Check if user preference for sidenav is stored
    const savedState = localStorage.getItem('sidenavOpened');
    if (savedState !== null) {
      this.sidenavOpened = savedState === 'true';
    }
  }

  loadVehicles() {
    this.vehicleService.getVehicles().subscribe((vehicles: Vehicle[]) => {
      const updates = vehicles.map(vehicle =>
        this.taskService.getAllTasksByVehicleId(vehicle.id).toPromise()
          .then((tasks: Task[]) => {
            const activeTask = tasks?.find(t =>
              ['ACIK', 'KADEMEDE', 'UZUN_YOL'].includes(t.task_status)
            );

            let status = 'MÜSAİT';
            if (activeTask) {
              if (activeTask.task_status === 'ACIK') {
                status = 'GÖREVDE';
              } else {
                status = activeTask.task_status;
              }
            }

            return {
              ...vehicle,
              task_status: status,
              task_type: activeTask ? activeTask.task_type : null,
              current_task: activeTask
            };
          })
      );

      Promise.all(updates).then(updatedVehicles => {
        this.vehicles = updatedVehicles;
        this.filteredVehicles = [...this.vehicles];
        this.sortVehiclesByTaskStatus();
      });
    });
  }

  private applyFilters() {
    if (this.activeFilter === 'all') {
      this.filteredVehicles = this.vehicles;
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle =>
        vehicle.status === this.activeFilter
      );
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (filterValue) {
      this.filteredVehicles = this.vehicles.filter(vehicle =>
        vehicle.military_plate?.toLowerCase().includes(filterValue) ||
        vehicle.civilian_plate?.toLowerCase().includes(filterValue) ||
        vehicle.brand?.toLowerCase().includes(filterValue) ||
        vehicle.model?.toLowerCase().includes(filterValue)
      );

      if (event instanceof KeyboardEvent && event.key === 'Enter' && this.filteredVehicles.length === 1) {
        this.navigateToVehicleDetail(this.filteredVehicles[0].id);
        return;
      }
    } else {
      this.filteredVehicles = [...this.vehicles];
    }

    this.sortVehiclesByTaskStatus();
  }

  sortVehiclesByTaskStatus() {
    const taskStatusPriority: Record<TaskStatus, number> = {
      'GÖREVDE': 1,
      'ACIK': 1,
      'UZUN_YOL': 2,
      'KADEMEDE': 3,
      'MÜSAİT': 4,
      'KAPALI': 4
    };

    this.filteredVehicles.sort((a, b) => {
      const statusA = (a.task_status as TaskStatus) || 'MÜSAİT';
      const statusB = (b.task_status as TaskStatus) || 'MÜSAİT';

      const priorityA = taskStatusPriority[statusA] || 4;
      const priorityB = taskStatusPriority[statusB] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.military_plate?.localeCompare(b.military_plate || '') || 0;
    });
  }

  filterVehicles() {
    console.log('Aktif filtre:', this.activeFilter);

    switch (this.activeFilter) {
      case 'available':
        this.filteredVehicles = this.vehicles.filter(v => v.numeric_status === 0 || !v.numeric_status);
        break;
      case 'assigned':
        this.filteredVehicles = this.vehicles.filter(v => v.numeric_status === 1);
        break;
      case 'maintenance':
        this.filteredVehicles = this.vehicles.filter(v => v.numeric_status === 2);
        break;
      default:
        this.filteredVehicles = [...this.vehicles];
    }

    console.log('Filtreleme sonrası araçlar:', this.filteredVehicles);
  }

  navigateToVehicleDetail(vehicleId: number) {
    this.router.navigate(['/dashboard/gorevkayit', vehicleId]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusStyle(status: string) {
    switch (status) {
      case 'ACIK':
        return { backgroundColor: '#f44336', color: 'white' };
      case 'KADEMEDE':
        return { backgroundColor: '#ff9800', color: 'white' };
      case 'KAPALI':
        return { backgroundColor: '#4caf50', color: 'white' };
      default:
        return { backgroundColor: '#4caf50', color: 'white' };
    }
  }

  getStatusCount(status: string): number {
    if (status === 'GÖREVDE') {
      return this.vehicles.filter(v =>
        v.task_status === 'GÖREVDE' ||
        v.task_status === 'ACIK'
      ).length;
    } else if (status === 'UZUN_YOL') {
      return this.vehicles.filter(v => v.task_type === 'UZUN_YOL').length;
    } else {
      return this.vehicles.filter(v => v.task_status === status).length;
    }
  }

  logHelpCenterClick(event: MouseEvent) {
    console.log('Yardım merkezi menüsüne tıklandı', {
      time: new Date().toISOString(),
      isLoggedIn: this.authService.isLoggedIn(),
      userRole: this.authService.getUserRole(),
      token: !!this.authService.getToken(),
      currentUser: this.authService.getCurrentUser()
    });
    
    // Rota geçişini engellemeden önce durumu kontrol etmek için setTimeout kullanabiliriz
    // event.preventDefault(); // Yönlendirmeyi tamamen engellemek için
  }

  openChangePasswordDialog(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.snackBar.open('Kullanıcı bilgilerine erişilemedi', 'Tamam', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      data: {
        userId: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullname
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Şifreniz başarıyla değiştirildi', 'Tamam', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else if (result?.error) {
        this.snackBar.open(result.error, 'Tamam', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
    // Save user preference
    localStorage.setItem('sidenavOpened', String(this.sidenavOpened));
  }

  // Get user initials from full name
  getInitials(fullName: string): string {
    if (!fullName) return '';
    
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  
  // Get friendly display name for user role
  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'user': return 'Kullanıcı';
      case 'ghm': return 'GHM';
      default: return role;
    }
  }
}