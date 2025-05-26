import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface Personnel {
  id: number;
  name: string;
  rank: string;
  created_at: string;
  visibility?: number;
}

@Component({
  selector: 'app-personnel-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  templateUrl: './personnel-management.component.html',
  styleUrls: ['./personnel-management.component.scss']
})
export class PersonnelManagementComponent implements OnInit {
  personnelForm: FormGroup;
  displayedColumns: string[] = ['id', 'name', 'rank', 'created_at', 'status', 'actions'];
  dataSource = new MatTableDataSource<Personnel>([]);
  editMode = false;
  currentId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.personnelForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      rank: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    this.loadPersonnel();
    console.log('PersonnelManagement bileşeni başlatıldı');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPersonnel() {
    console.log('Personel listesi yükleniyor...');
    this.http.get<Personnel[]>(`${environment.apiUrl}/personnel`).subscribe({
      next: (data) => {
        console.log('Personel listesi başarıyla yüklendi:', data);
        
        // Tarih formatını kontrol et ve düzenle
        const formattedData = data.map(personnel => {
          // Null veya undefined created_at için kontrol
          if (!personnel.created_at) {
            personnel.created_at = new Date().toISOString();
          } 
          // String tipinde ama Date objesi olarak parse edilemeyen değerleri kontrol et
          else if (typeof personnel.created_at === 'string' && isNaN(Date.parse(personnel.created_at))) {
            personnel.created_at = new Date().toISOString();
          }
          return personnel;
        });
        
        console.log('Formatlanmış data:', formattedData);
        this.dataSource.data = formattedData;
      },
      error: (error) => {
        console.error('Personel listesi yüklenirken hata oluştu:', error);
        this.snackBar.open('Personel listesi yüklenemedi', 'Tamam', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSubmit() {
    if (this.personnelForm.valid) {
      const formData = this.personnelForm.value;

      try {
        if (this.editMode && this.currentId) {
          console.log('Personel güncelleme işlemi başlatılıyor:', {
            id: this.currentId,
            data: formData
          });

          this.http.put<Personnel>(`${environment.apiUrl}/personnel/${this.currentId}`, formData)
            .subscribe({
              next: (response) => {
                console.log('Personel başarıyla güncellendi:', response);
                this.resetForm();
                this.loadPersonnel();
                this.snackBar.open('Personel başarıyla güncellendi', 'Tamam', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
              },
              error: (error) => {
                console.error('Personel güncellenirken hata oluştu:', error);
                this.snackBar.open('Personel güncellenemedi', 'Tamam', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
        } else {
          this.http.post<Personnel>(`${environment.apiUrl}/personnel`, formData)
            .subscribe({
              next: (response) => {
                this.resetForm();
                this.loadPersonnel();
                this.snackBar.open('Personel başarıyla kaydedildi', 'Tamam', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
              },
              error: (error) => {
                console.error('Personel kaydedilirken hata:', error);
                this.snackBar.open('Personel kaydedilemedi', 'Tamam', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
        }
      } catch (error) {
        console.error('İşlem sırasında beklenmedik hata:', error);
      }
    }
  }

  editPersonnel(personnel: Personnel, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('Personel düzenleme başlatılıyor:', personnel);

    try {
      this.editMode = true;
      this.currentId = personnel.id;
      this.personnelForm.patchValue({
        name: personnel.name,
        rank: personnel.rank
      });

      console.log('Form değerleri güncellendi:', this.personnelForm.value);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Düzenleme işleminde hata:', error);
      this.snackBar.open('Düzenleme işlemi başlatılamadı', 'Tamam', {
        duration: 3000
      });
    }
  }

  resetForm() {
    this.editMode = false;
    this.currentId = null;
    this.personnelForm.reset();
  }

  toggleVisibility(personnel: Personnel) {
    const newVisibility = personnel.visibility === 0 ? 1 : 0;

    this.http.put<Personnel>(`${environment.apiUrl}/personnel/${personnel.id}/visibility`, {
      visibility: newVisibility
    }).subscribe({
      next: (response) => {
        const index = this.dataSource.data.findIndex(p => p.id === personnel.id);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = { ...updatedData[index], visibility: newVisibility };
          this.dataSource.data = updatedData;
        }

        const status = newVisibility === 0 ? 'aktif' : 'pasif';
        this.snackBar.open(`Personel durumu ${status} olarak güncellendi`, 'Tamam', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Durum güncellenirken hata:', error);
        this.snackBar.open('Durum güncellenemedi', 'Tamam', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getNameErrorMessage() {
    if (this.personnelForm.get('name')?.hasError('required')) {
      return 'İsim gereklidir';
    }
    return this.personnelForm.get('name')?.hasError('maxlength') ? 'İsim en fazla 100 karakter olabilir' : '';
  }

  getRankErrorMessage() {
    if (this.personnelForm.get('rank')?.hasError('required')) {
      return 'Rütbe/Makam gereklidir';
    }
    return this.personnelForm.get('rank')?.hasError('maxlength') ? 'Rütbe/Makam en fazla 50 karakter olabilir' : '';
  }
}