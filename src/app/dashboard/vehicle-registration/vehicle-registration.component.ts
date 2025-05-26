import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { HttpClientModule } from '@angular/common/http';
import { VehicleService } from '../../services/vehicle.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon'; // Yeni import
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';  // Yeni import
import { MatSelectModule } from '@angular/material/select'; // Yeni import ekle
import { MatSort, MatSortModule } from '@angular/material/sort'; // Yeni import ekle

interface Vehicle {
  id?: number;  // ID alanı eklendi
  militaryPlate: string;
  civilianPlate: string;
  chassisNumber: string;
  engineNumber: string;
  brand: string;
  model: string;
  type: string;
  assignedAuthority: string;
  visibility?: number; // Görünürlük durumu için yeni alan
  create_date?: Date;
}

@Component({
  selector: 'app-vehicle-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    HttpClientModule,
    MatSnackBarModule,
    MatIconModule, // MatIconModule'ü ekle
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
  ],
  templateUrl: './vehicle-registration.component.html',
  styleUrl: './vehicle-registration.component.scss',
  providers: [VehicleService]
})
export class VehicleRegistrationComponent implements OnInit, AfterViewInit {
  vehicleForm: FormGroup;
  vehicles: Vehicle[] = [
    {
      militaryPlate: "TSK-2023-001",
      civilianPlate: "06 ABC 123",
      chassisNumber: "WBAJC5109KBX47382",
      engineNumber: "N57D30S1-89562341",
      brand: "BMW",
      model: "520d",
      type: "Binek",
      assignedAuthority: "Tugay Komutanlığı"
    },
    {
      militaryPlate: "TSK-2023-002",
      civilianPlate: "06 DEF 456",
      chassisNumber: "WDDUF6HB8FA123456",
      engineNumber: "M276DE30LA-78901234",
      brand: "Mercedes-Benz",
      model: "E200",
      type: "Binek",
      assignedAuthority: "Garnizon Komutanlığı"
    }];
  displayedColumns: string[] = [
    'militaryPlate',
    'civilianPlate',
    'chassisNumber',
    'engineNumber',
    'brand',
    'model',
    'type',
    'assignedAuthority',
    'create_date',
    'actions',  // Sıra değişti
    'visibility'
  ];
  dataSource: MatTableDataSource<Vehicle>;
  isEditMode = false;
  selectedVehicleId?: number;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Araç tipleri - İkonlar kaldırıldı
  vehicleTypes: {value: string, label: string}[] = [
    { value: 'SEDAN', label: 'Sedan / Binek' },
    { value: 'SUV', label: 'SUV / Arazi Aracı' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'STATION', label: 'Station' },
    { value: 'MINIBUS', label: 'Minibüs' },
    { value: 'BUS', label: 'Otobüs' },
    { value: 'TRUCK', label: 'Kamyon' },
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'VAN', label: 'Van / Panel Van' },
    { value: 'TRAKTÖR', label: 'Traktör' },
    { value: 'AMBULANS', label: 'Ambulans' },
    { value: 'İTFAİYE', label: 'İtfaiye' },
    { value: 'İŞ_MAKİNASI', label: 'İş Makinası' },
    { value: 'KEPÇE', label: 'Kepçe' },
    { value: 'DOZER', label: 'Dozer' },
    { value: 'GREYDER', label: 'Greyder' },
    { value: 'EKSKAVATÖR', label: 'Ekskavatör' },
    { value: 'FORKLIFT', label: 'Forklift' },
    { value: 'ZİRAİ_ARAÇ', label: 'Zirai Araç' },
    { value: 'ASKERİ_ARAÇ', label: 'Askeri Araç' },
    { value: 'MOTOSİKLET', label: 'Motosiklet' },
    { value: 'OTHER', label: 'Diğer' }
  ];

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Vehicle>([]);
    this.vehicleForm = this.fb.group({
      militaryPlate: ['', [
        Validators.required,
        Validators.maxLength(15)
      ]],
      civilianPlate: ['', [
        Validators.required,
        Validators.maxLength(15)
      ]],
      chassisNumber: ['', [
        Validators.required,
        Validators.maxLength(20)
      ]],
      engineNumber: ['', [
        Validators.required,
        Validators.maxLength(20)
      ]],
      brand: ['', [
        Validators.required,
        Validators.maxLength(25)
      ]],
      model: ['', [
        Validators.required,
        Validators.maxLength(25)
      ]],
      type: ['', Validators.required],
      assignedAuthority: ['', [
        Validators.required,
        Validators.maxLength(25)
      ]]
    });
  }

  ngOnInit() {
    this.loadVehicles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; // Sort ekle
  }

  loadVehicles() {
    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        const formattedVehicles = vehicles.map(vehicle => ({
          ...vehicle,
          militaryPlate: vehicle.military_plate,
          civilianPlate: vehicle.civilian_plate,
          chassisNumber: vehicle.chassis_number,
          engineNumber: vehicle.engine_number,
          assignedAuthority: vehicle.assigned_authority,
          create_date: new Date(vehicle.create_date)
        }));
        console.log('Formatlanmış araçlar:', formattedVehicles);
        // Debug için araç tiplerini logla
        formattedVehicles.forEach(v => console.log(`Araç: ${v.militaryPlate}, Tip: ${v.type}`));
        this.dataSource.data = formattedVehicles;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Araçlar yüklenirken hata oluştu:', error);
        this.snackBar.open('Araçlar yüklenirken hata oluştu', '', {
          duration: 2000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit() {
    if (this.vehicleForm.valid) {
      this.vehicleService.saveVehicle(this.vehicleForm.value).subscribe({
        next: (response) => {
          this.loadVehicles();
          this.vehicleForm.reset();
          this.snackBar.open('Araç başarıyla kaydedildi', '', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Kayıt sırasında hata oluştu:', error);
          this.snackBar.open(error.message || 'Kayıt sırasında hata oluştu', 'Kapat', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Otomatik büyük harfe çevirme metodu ekle
  toUpperCase(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.vehicleForm.get(controlName)?.setValue(input.value, {emitEvent: false});
    }
  }

  // Sadece harf, rakam ve boşluk için kontrol metodu
  onlyAlphanumericAndSpace(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.keyCode);
    if (/^[a-zA-Z0-9 ]$/.test(char)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  toggleVisibility(vehicle: Vehicle) {
    if (vehicle.id) {
      const newVisibility = vehicle.visibility === 0 ? 1 : 0;
      this.vehicleService.updateVisibility(vehicle.id, newVisibility).subscribe({
        next: () => {
          this.loadVehicles();
          this.snackBar.open('Görünürlük durumu güncellendi', '', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Güncelleme hatası:', error);
          this.snackBar.open('Güncelleme başarısız', '', {
            duration: 2000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  editVehicle(vehicle: Vehicle) {
    // Form alanını seç
    const formElement = document.getElementById('vehicleForm');
    
    // Form varsa yumuşak kaydırma yap
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  
    // Form bilgilerini doldur
    this.isEditMode = true;
    this.selectedVehicleId = vehicle.id;
    
    this.vehicleForm.patchValue({
      militaryPlate: vehicle.militaryPlate,
      civilianPlate: vehicle.civilianPlate,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      type: vehicle.type,
      assignedAuthority: vehicle.assignedAuthority
    });
  }

  updateVehicle() {
    if (this.vehicleForm.valid && this.selectedVehicleId) {
      this.vehicleService.updateVehicle(this.selectedVehicleId, this.vehicleForm.value).subscribe({
        next: (response) => {
          console.log('Update successful:', response);
          this.loadVehicles();
          this.vehicleForm.reset();
          this.isEditMode = false;
          this.selectedVehicleId = undefined;
          this.snackBar.open('Araç başarıyla güncellendi', '', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Güncelleme hatası:', error);
          this.snackBar.open('Güncelleme başarısız', '', {
            duration: 2000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.selectedVehicleId = undefined;
    this.vehicleForm.reset();
  }

  // Yardımcı metodlar ekleyin
  getVehicleTypeLabel(type: string): string {
    if (!type) return 'Belirsiz';
    const foundType = this.vehicleTypes.find(t => t.value === type.toUpperCase());
    return foundType ? foundType.label : type;
  }
}