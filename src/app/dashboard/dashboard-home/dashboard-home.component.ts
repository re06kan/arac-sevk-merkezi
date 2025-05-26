import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit, AfterViewInit {
  vehicles: any[] = [];
  filteredVehicles: any[] = [];
  displayedVehicles: any[] = []; // Ekranda gösterilecek araçlar için yeni dizi
  selectedStatusFilter: string = 'ALL'; // Yeni property
  isGhmUser: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private vehicleService: VehicleService,
    private taskService: TaskService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is GHM
    const currentUser = this.authService.getCurrentUser();
    this.isGhmUser = currentUser?.role === 'ghm';

    // For GHM users, automatically set filter to show only vehicles on duty
    if (this.isGhmUser) {
      this.selectedStatusFilter = 'GÖREVDE';
    }

    this.loadVehicles();
  }

  ngAfterViewInit() {
    // Paginator değişikliklerini dinle
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        this.updateDisplayedVehicles();
      });
    }
  }

  loadVehicles() {
    this.vehicleService.getVehicles().subscribe((vehicles: any[]) => {
      // Önce visibility = 0 olan araçları filtrele
      const visibleVehicles = vehicles.filter(vehicle => vehicle.visibility === 0);
      
      const updates = visibleVehicles.map((vehicle: any) =>
        this.taskService.getAllTasksByVehicleId(vehicle.id).toPromise()
          .then((tasks: any[]) => {
            const activeTask = tasks?.find((t: any) =>
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
              current_task: activeTask,
              driver_name: activeTask?.driver_name || null,
              authority_name: activeTask?.authority_name || null
            };
          })
      );

      Promise.all(updates).then(updatedVehicles => {
        this.vehicles = updatedVehicles;
        
        // For GHM users, only show vehicles that are on duty
        if (this.isGhmUser) {
          this.vehicles = this.vehicles.filter(vehicle => 
            vehicle.task_status === 'GÖREVDE' || 
            vehicle.task_status === 'ACIK' || 
            vehicle.task_status === 'UZUN_YOL' ||
            vehicle.task_status === 'KADEMEDE'
          );
        }

        this.filteredVehicles = [...this.vehicles];
        this.sortVehiclesByTaskStatus();
        // Sayfalama için araçları güncelle
        this.updateDisplayedVehicles();
      });
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase().trim();

    // Önce status filtresini uygula
    this.filterByStatus(this.selectedStatusFilter);

    // Sonra arama filtresini uygula
    if (filterValue) {
      // For GHM users, search only in vehicles that are on duty
      const vehiclesToSearch = this.isGhmUser ? 
        this.vehicles : this.filteredVehicles;

      this.filteredVehicles = vehiclesToSearch.filter((vehicle: any) =>
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
    // Filtre değiştiğinde ilk sayfaya dön ve görüntülenen araçları güncelle
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updateDisplayedVehicles();
  }

  filterByStatus(status: string) {
    // GHM users can only see vehicles on duty
    if (this.isGhmUser && status !== 'GÖREVDE') {
      return;
    }

    this.selectedStatusFilter = status;

    if (status === 'ALL') {
      this.filteredVehicles = [...this.vehicles];
    } else if (status === 'GÖREVDE') {
      this.filteredVehicles = this.vehicles.filter(v =>
        v.task_status === 'GÖREVDE' || v.task_status === 'ACIK'
      );
    } else if (status === 'UZUN_YOL') {
      this.filteredVehicles = this.vehicles.filter(v =>
        v.task_type === 'UZUN_YOL'
      );
    } else {
      this.filteredVehicles = this.vehicles.filter(v =>
        v.task_status === status
      );
    }

    this.sortVehiclesByTaskStatus();
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updateDisplayedVehicles();
  }

  sortVehiclesByTaskStatus() {
    const taskStatusPriority: Record<string, number> = {
      'GÖREVDE': 1,
      'ACIK': 1,
      'UZUN_YOL': 2,
      'KADEMEDE': 3,
      'MÜSAİT': 4
    };

    this.filteredVehicles.sort((a: any, b: any) => {
      const statusA = a.task_status || 'MÜSAİT';
      const statusB = b.task_status || 'MÜSAİT';

      const priorityA = taskStatusPriority[statusA] || 4;
      const priorityB = taskStatusPriority[statusB] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.military_plate?.localeCompare(b.military_plate || '') || 0;
    });
  }

  // Yeni metod: Ekranda gösterilecek araçları günceller
  updateDisplayedVehicles() {
    if (!this.paginator) return;

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    this.displayedVehicles = this.filteredVehicles.slice(startIndex, endIndex);
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

  navigateToVehicleDetail(vehicleId: number) {
    // Prevent navigation for GHM users
    if (this.isGhmUser) {
      return;
    }
    
    this.router.navigate(['/dashboard/gorevkayit', vehicleId]);
  }
}
