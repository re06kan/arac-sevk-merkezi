import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PasswordDialogData {
  userId: string;
  username: string;
  fullName: string;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  constructor(
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordDialogData,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(12),
        this.passwordComplexityValidator()
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // Form seviyesinde şifre eşleşme validatoru
  }

  ngOnInit(): void {}

  private passwordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
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
  }

  private passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      this.http.post(`${environment.apiUrl}/auth/change-password`, {
        userId: this.data.userId,
        currentPassword,
        newPassword
      }).subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          // Eğer API'den hata gelirse, form seviyesinde bir hata göster
          if (error.error?.message === 'current_password_incorrect') {
            this.passwordForm.get('currentPassword')?.setErrors({ incorrect: true });
          } else {
            this.dialogRef.close({ 
              success: false, 
              error: error.error?.message || 'Şifre değiştirme işlemi başarısız oldu.' 
            });
          }
        }
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close({ success: false, canceled: true });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.hideCurrentPassword = !this.hideCurrentPassword;
    if (field === 'new') this.hideNewPassword = !this.hideNewPassword;
    if (field === 'confirm') this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  getNewPasswordErrorMessage(): string {
    const control = this.passwordForm.get('newPassword');
    if (control?.hasError('required')) return 'Yeni şifre gereklidir';
    if (control?.hasError('minlength')) return 'Şifre en az 12 karakter olmalıdır';
    if (control?.hasError('passwordComplexity')) {
      const errors = control.getError('passwordComplexity');
      if (!errors.hasUpperCase) return 'Şifre en az bir büyük harf içermelidir';
      if (!errors.hasNumber) return 'Şifre en az bir rakam içermelidir';
      if (!errors.hasSpecialChar) return 'Şifre en az bir özel karakter içermelidir';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.passwordForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Şifre tekrarı gereklidir';
    if (this.passwordForm.hasError('passwordMismatch')) return 'Şifreler eşleşmiyor';
    return '';
  }
}
