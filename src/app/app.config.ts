import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withHashLocation, withNavigationErrorHandler } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

// Navigasyon hata işleyici
const handleNavigationError = (error: any) => {
  console.error('Navigasyon hatası:', error);
  const router = inject(Router);

  // Eski işleyiciyi değiştiriyoruz - hata durumunda login sayfasına değil dashboarda yönlendir
  try {
    const authService = inject(AuthService);
    if (authService.isLoggedIn()) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/login']);
    }
  } catch (err) {
    router.navigate(['/login']);
  }
};

// Auth durumunu başlangıçta kontrol etmek için APP_INITIALIZER
function initAuth(authService: AuthService) {
  return () => {
    console.log('APP_INITIALIZER - Auth durumu kontrol ediliyor');
    const isLoggedIn = authService.checkAndRefreshAuth();
    console.log('APP_INITIALIZER - Oturum durumu:', isLoggedIn);
    return isLoggedIn;
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation(),
      withNavigationErrorHandler(handleNavigationError)
    ),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // APP_INITIALIZER ekledik
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => initAuth(authService),
      deps: [AuthService],
      multi: true
    }
  ]
};
