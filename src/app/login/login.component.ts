import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword: boolean = true; // Şifre görünürlük kontrolü için eklendi

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/), // Sadece rakam
        Validators.minLength(11),
        Validators.maxLength(11)
      ]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      
      // Login işlemini AuthService üzerinden yapıyoruz
      this.authService.login(username, password).subscribe({
        next: (response) => {
          console.log('Giriş başarılı:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Giriş hatası:', error);
          this.snackBar.open(
            error.message || 'Kullanıcı adı veya şifre hatalı', 
            'Tamam', 
            { 
              duration: 3000, 
              panelClass: ['error-snackbar']  // Hata mesajları için hep aynı sınıfı kullanalım
            }
          );
        }
      });
    }
  }
}