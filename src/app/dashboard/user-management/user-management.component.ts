import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  userForm: FormGroup;
  userRoles = ['admin', 'user'];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = ['username', 'fullName', 'role', 'status', 'actions'];
  isEditMode = false;
  selectedUserId: string | null = null;
  hidePassword = true;
  changePassword: boolean = false; // Şifre değiştirme checkbox'ı için yeni değişken

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef,
    private userService: UserService
  ) {
    const onlyNumbersValidator: ValidatorFn = (control: AbstractControl) => {
      const value = control.value;
      const valid = /^\d+$/.test(value);
      return valid ? null : { onlyNumbers: true };
    };

    const onlyLettersValidator: ValidatorFn = (control: AbstractControl) => {
      const value = control.value;
      const valid = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(value);
      return valid ? null : { onlyLetters: true };
    };

    this.userForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(11),
        Validators.maxLength(11),
        onlyNumbersValidator
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(12),
        this.passwordComplexityValidator
      ]],
      fullName: ['', [
        Validators.required,
        Validators.maxLength(30),
        onlyLettersValidator
      ]],
      role: ['user', Validators.required]
    });
  }

  private passwordComplexityValidator: ValidatorFn = (control: AbstractControl) => {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    const valid = hasUpperCase && hasNumber && hasSpecialChar;
    
    return valid ? null : { 
      passwordComplexity: {
        hasUpperCase,
        hasNumber,
        hasSpecialChar
      }
    };
  };

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullname,
          role: user.role,
          status: user.visibility === 0 ? 'active' : 'inactive'
        }));
        
        console.log('Kullanıcılar yüklendi:', users);
      },
      error: (error) => {
        console.error('Kullanıcıları yükleme hatası:', error);
        this.snackBar.open('Kullanıcılar yüklenirken hata oluştu', 'Tamam', { 
          duration: 3000,
          panelClass: ['error-snackbar']  // Hata mesajı için kırmızı arka plan
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      
      // Make sure userData has expected form before sending to server
      console.log('Form submission data:', userData);
      
      const user: User = {
        username: userData.username,
        fullname: userData.fullName.toUpperCase(),
        role: userData.role
      };
      
      if (!this.isEditMode) {
        user.password = userData.password;
        
        this.userService.createUser(user).subscribe({
          next: (response) => {
            console.log('Kullanıcı eklendi:', response);
            this.snackBar.open('Kullanıcı başarıyla eklendi', 'Tamam', { 
              duration: 3000,
              panelClass: ['success-snackbar']  // Başarılı mesaj için yeşil arka plan
            });
            this.userForm.reset({ role: 'user' });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Kullanıcı eklenirken hata:', error);
            let errorMessage = 'Kullanıcı eklenirken bir hata oluştu';
            if (error.error?.error) {
              errorMessage = error.error.error;
            }
            this.snackBar.open(errorMessage, 'Tamam', { 
              duration: 5000,
              panelClass: ['error-snackbar']  // Hata mesajı için kırmızı arka plan
            });
          }
        });
      } else {
        if (this.changePassword && userData.password) {
          user.password = userData.password;
        }
        
        console.log('Updating user with ID:', this.selectedUserId, 'Data:', user);
        
        this.userService.updateUser(this.selectedUserId!, user).subscribe({
          next: (response) => {
            console.log('Kullanıcı güncellendi:', response);
            this.snackBar.open('Kullanıcı başarıyla güncellendi', 'Tamam', { 
              duration: 3000,
              panelClass: ['success-snackbar']  // Başarılı mesaj için yeşil arka plan
            });
            this.cancelEdit();
            this.loadUsers();
          },
          error: (error) => {
            console.error('Kullanıcı güncellenirken hata:', error);
            let errorMessage = 'Kullanıcı güncellenirken bir hata oluştu';
            if (error.error?.details) {
              errorMessage = `${errorMessage}: ${error.error.details}`;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            }
            this.snackBar.open(errorMessage, 'Tamam', { 
              duration: 5000,
              panelClass: ['error-snackbar']  // Hata mesajı için kırmızı arka plan
            });
          }
        });
      }
    }
  }

  editUser(user: any) {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.changePassword = false; // Her düzenleme başlangıcında false olarak ayarla
    
    this.userForm.patchValue({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      password: '' // Şifreyi temizle
    });
    
    // Şifre alanını opsiyonel yap
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  toggleChangePassword(): void {
    this.changePassword = !this.changePassword;
    
    const passwordControl = this.userForm.get('password');
    
    if (this.changePassword) {
      passwordControl?.setValidators([
        Validators.required, 
        Validators.minLength(12),
        this.passwordComplexityValidator
      ]);
    } else {
      passwordControl?.clearValidators();
      passwordControl?.setValue(''); // Şifre alanını temizle
    }
    
    passwordControl?.updateValueAndValidity();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.userForm.reset({ role: 'user' });
    
    this.userForm.get('password')?.setValidators([
      Validators.required, 
      Validators.minLength(12),
      this.passwordComplexityValidator
    ]);
    
    this.userForm.get('password')?.updateValueAndValidity();
  }

  toggleStatus(user: any) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const visibility = newStatus === 'active' ? 0 : 1;
    
    this.userService.updateUserVisibility(user.id, visibility).subscribe({
      next: (response) => {
        const updatedData = this.dataSource.data.map(item => {
          if (item.id === user.id) {
            return { ...item, status: newStatus };
          }
          return item;
        });
        
        this.dataSource.data = updatedData;
        
        const statusText = newStatus === 'active' ? 'aktif' : 'pasif';
        this.snackBar.open(`Kullanıcı durumu ${statusText} olarak değiştirildi`, 'Tamam', { 
          duration: 3000,
          panelClass: ['success-snackbar']  // Başarılı mesaj için yeşil arka plan
        });
      },
      error: (error) => {
        console.error('Kullanıcı durumu güncellenirken hata:', error);
        this.snackBar.open('Kullanıcı durumu değiştirilemedi', 'Tamam', { 
          duration: 3000,
          panelClass: ['error-snackbar']  // Hata mesajı için kırmızı arka plan
        });
      }
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  getUsernameErrorMessage(): string {
    const control = this.userForm.get('username');
    if (control?.hasError('required')) return 'Kullanıcı adı gerekli';
    if (control?.hasError('minlength') || control?.hasError('maxLength')) return 'Kullanıcı adı 11 karakter olmalıdır';
    if (control?.hasError('onlyNumbers')) return 'Kullanıcı adı sadece rakam içermelidir';
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.userForm.get('password');
    if (control?.hasError('required')) return 'Şifre gerekli';
    if (control?.hasError('minlength')) return 'Şifre en az 12 karakter olmalıdır';
    if (control?.hasError('passwordComplexity')) {
      const errors = control.getError('passwordComplexity');
      if (!errors.hasUpperCase) return 'Şifre en az bir büyük harf içermelidir';
      if (!errors.hasNumber) return 'Şifre en az bir rakam içermelidir';
      if (!errors.hasSpecialChar) return 'Şifre en az bir özel karakter içermelidir (!.@#$%^ vb.)';
    }
    return '';
  }

  getFullNameErrorMessage(): string {
    const control = this.userForm.get('fullName');
    if (control?.hasError('required')) return 'Ad soyad gerekli';
    if (control?.hasError('maxlength')) return 'Ad soyad en fazla 30 karakter olmalıdır';
    if (control?.hasError('onlyLetters')) return 'Ad soyad sadece harf içermelidir';
    return '';
  }

  getRoleName(role: string): string {
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'user':
        return 'Kullanıcı';
      case 'ghm':
        return 'GHM';
      default:
        return role;
    }
  }

  scrollToForm(): void {
    setTimeout(() => {
      const formElement = this.elementRef.nativeElement.querySelector('#userForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  toUpperCase(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    
    this.userForm.get('fullName')?.setValue(input.value, {emitEvent: false});
  }

  private addUser(userData: any) {
    const maxId = Math.max(...this.dataSource.data.map(item => parseInt(item.id) || 0), 0);
    const newId = (maxId + 1).toString();
    
    const newUser = {
      id: newId,
      username: userData.username,
      fullName: userData.fullName.toUpperCase(),
      role: userData.role,
      status: 'active'
    };
    this.dataSource.data = [...this.dataSource.data, newUser];
  }

  private updateUser(userData: any) {
    const updatedData = this.dataSource.data.map(user => {
      if (user.id === this.selectedUserId) {
        return {
          ...user,
          username: user.username,
          fullName: user.fullName.toUpperCase(),
          role: user.role
        };
      }
      return user;
    });
    this.dataSource.data = updatedData;
  }
}
