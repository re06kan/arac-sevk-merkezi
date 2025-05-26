import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('AuthGuard çalıştı - URL:', state.url);
    console.log('localStorage kontrolü:', {
      token: !!localStorage.getItem('token'),
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      user: !!localStorage.getItem('user')
    });
    
    // Auth durumunu her seferinde kontrol et ve yenile
    this.authService.checkAndRefreshAuth();
    
    if (this.authService.isLoggedIn()) {
      console.log('Kullanıcı giriş yapmış');
      
      // Sadece admin'in erişebileceği rotaları kontrol edelim (isteğe bağlı)
      const requiredRole = route.data['role'];
      if (requiredRole && this.authService.getUserRole() !== requiredRole) {
        console.log('Kullanıcı rolü yetersiz:', this.authService.getUserRole());
        this.router.navigate(['/dashboard']);
        return false;
      }
      
      return true;
    }
    
    console.log('Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor');
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
