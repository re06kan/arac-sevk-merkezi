import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Get the roles allowed for this route
    const allowedRoles = route.data['roles'] as Array<string>;
    
    // Get current user
    const currentUser = this.authService.getCurrentUser();
    
    // If no user or no roles defined, redirect to login
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // If user's role is allowed for this route
    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }
    
    // Access denied - redirect to dashboard and show message
    this.snackBar.open('Bu sayfaya erişim yetkiniz bulunmamaktadır', 'Tamam', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    
    this.router.navigate(['/dashboard']);
    return false;
  }
}
