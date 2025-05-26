import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DriverService } from '../../services/driver.service';
import { RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import 'moment/locale/tr';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

interface Driver {
  id?: number;
  tc: string;
  name: string;
  phone: string;
  rutbe: string; // status yerine rutbe
  sicil_no: string;
  birthday: Date | null; // null olabilir
  birth_place: string;
  create_date?: Date;
  visibility?: number;
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-driver-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule
  ],
  providers: [
    DriverService,
    {provide: MAT_DATE_LOCALE, useValue: 'tr-TR'},
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
  templateUrl: './driver-registration.component.html',
  styleUrl: './driver-registration.component.scss'
})
export class DriverRegistrationComponent implements OnInit, AfterViewInit {
  driverForm: FormGroup;
  dataSource: MatTableDataSource<Driver>;
  displayedColumns: string[] = ['tc', 'name', 'phone', 'rutbe', 'sicil_no', 'birthday', 'birth_place', 'create_date', 'actions', 'visibility'];
  // status kolonu artık rütbe bilgisini gösterecek
  isEditMode = false;
  selectedDriverId?: number;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private driverService: DriverService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Driver>([]); // Boş dizi ile başlat
    this.driverForm = this.fb.group({
      tc: ['', [
        Validators.required, 
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(11),
        Validators.maxLength(11)
      ]],
      name: ['', [
        Validators.required,
        Validators.maxLength(25) // maksimum 25 karakter
      ]],
      phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      rutbe: ['', [
        Validators.required,
        Validators.maxLength(25) // maksimum 25 karakter
      ]], // status yerine rutbe
      sicil_no: ['', [
        Validators.required,
        Validators.pattern('^[0-9A-Za-z/-]*$'),
        Validators.maxLength(10)
      ]],
      birthday: ['', Validators.required],
      birth_place: ['', [
        Validators.required,
        Validators.pattern('^[A-Za-zğüşıöçĞÜŞİÖÇ ]*$'),
        Validators.maxLength(25)
      ]]
    });
    
    this.loadDrivers();
  }

  ngOnInit() {
    this.dataSource.filterPredicate = (data: Driver, filter: string) => {
      const searchStr = Object.values(data).join(' ').toLowerCase();
      return searchStr.indexOf(filter.toLowerCase()) !== -1;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; // Sort'u ekle
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onSubmit() {
    if (this.driverForm.valid) {
      // Telefon numarasını sadece rakamlarla gönder
      const formData = {
        ...this.driverForm.value,
        phone: this.driverForm.value.phone.replace(/\D/g, '')
      };

      this.driverService.saveDriver(formData).subscribe({
        next: (response) => {
          console.log('Sürücü başarıyla kaydedildi', response);
          this.loadDrivers(); // Tabloyu yenile
          this.driverForm.reset();
          this.snackBar.open('Sürücü başarıyla kaydedildi', '', {
            duration: 2000, // 2 saniye
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Kayıt sırasında hata oluştu', error);
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

  loadDrivers() {
    this.driverService.getDrivers().subscribe({
      next: (drivers) => {
        const formattedDrivers = drivers.map(driver => ({
          ...driver,
          birthday: driver.birthday ? new Date(driver.birthday) : new Date(), // null yerine varsayılan tarih
          phone: this.formatPhoneForDisplay(driver.phone),
          birth_place: driver.birth_place || '' // Ensure birth_place is included
        }));
        this.dataSource.data = formattedDrivers;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Sürücüler yüklenirken hata oluştu', error);
      }
    });
  }

  formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `(${match[1]}) ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phone;
  }

  toUpperCase(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toLocaleUpperCase('tr-TR');
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  formatPhoneNumber(event: any) {
    let phone = event.target.value.replace(/\D/g, '');
    if (phone.length > 0) {
      const match = phone.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
      if (match) {
        event.target.value = `(${match[1]}) ${match[2]} ${match[3]} ${match[4]}`;
      }
    }
  }

  // Harf kontrolü için yeni metod
  onlyLetters(event: KeyboardEvent): boolean {
    const char = String.fromCharCode(event.keyCode);
    if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ ]*$/.test(char)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  editDriver(driver: Driver) {
    console.log('1. Edit başladı:', driver);
    this.isEditMode = true;
    this.selectedDriverId = driver.id;
    
    // Tarihi doğru formatta ayarla
    const birthday = driver.birthday ? new Date(driver.birthday) : null;
    
    // Telefon numarasını orijinal formatında tut
    const phone = driver.phone.replace(/\D/g, '');
    
    this.driverForm.patchValue({
      tc: driver.tc,
      name: driver.name,
      phone: phone,
      rutbe: driver.rutbe,
      sicil_no: driver.sicil_no,
      birthday: birthday,
      birth_place: driver.birth_place
    });
    
    console.log('2. Form değerleri:', this.driverForm.value);
    console.log('3. Seçili sürücü ID:', this.selectedDriverId);
  }

  updateDriver() {
    console.log('4. Update başladı - Form durumu:', {
      valid: this.driverForm.valid,
      selectedId: this.selectedDriverId,
      isEditMode: this.isEditMode,
      formValues: this.driverForm.value
    });

    if (this.driverForm.valid && this.selectedDriverId) {
      const formData = {
        ...this.driverForm.value,
        phone: this.driverForm.value.phone.replace(/\D/g, ''),
      };

      console.log('5. Service çağrısı öncesi data:', {
        id: this.selectedDriverId,
        formData
      });

      this.driverService.updateDriver(this.selectedDriverId, formData).subscribe({
        next: (response) => {
          console.log('6. Güncelleme başarılı:', response);
          this.loadDrivers();
          this.driverForm.reset();
          this.isEditMode = false;
          this.selectedDriverId = undefined;
          this.snackBar.open('Sürücü başarıyla güncellendi', '', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('7. Güncelleme hatası:', error);
          this.snackBar.open(`Güncelleme başarısız: ${error.message}`, '', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      console.log('8. Form geçersiz veya ID yok:', {
        formValid: this.driverForm.valid,
        selectedId: this.selectedDriverId,
        formErrors: this.driverForm.errors
      });
    }
  }

  toggleVisibility(driver: Driver) {
    if (driver.id) {
      const newVisibility = driver.visibility === 0 ? 1 : 0;
      this.driverService.updateVisibility(driver.id, newVisibility).subscribe({
        next: () => {
          this.loadDrivers();
          this.snackBar.open('Görünürlük durumu güncellendi', '', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Güncelleme sırasında hata oluştu', error);
          this.snackBar.open('Güncelleme işlemi başarısız', '', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}