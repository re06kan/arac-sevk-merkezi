import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    fullname: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenRefreshTimer: any = null;

  constructor(private http: HttpClient) {
    // Servis oluşturulduğunda auth durumunu kontrol et
    this.checkAndRefreshAuth();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          // Giriş başarılı olduğunda token'ı ve kullanıcı bilgilerini localStorage'a kaydedelim
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('isLoggedIn', 'true');
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error('Giriş başarısız. Lütfen kullanıcı adı ve şifrenizi kontrol edin.'));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /**
   * Oturum bilgilerini kontrol et ve token süresi geçmek üzereyse tokenı yenile
   * Bu metod uygulama başlangıcında otomatik çalışacak
   */
  checkAndRefreshAuth(): boolean {
    console.log('Auth durumu kontrol ediliyor');
    
    try {
      // localStorage'a erişim mevcut mu kontrol et
      if (typeof localStorage === 'undefined') {
        console.error('localStorage mevcut değil');
        return false;
      }
      
      const token = localStorage.getItem('token');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const user = localStorage.getItem('user');
      
      console.log('Token mevcut:', !!token);
      console.log('IsLoggedIn değeri:', isLoggedIn);
      console.log('User mevcut:', !!user);
      
      // Token süresi tespiti eklenebilir
      if (token) {
        // Token geçerliliğini kontrolü (isteğe bağlı)
        // this.setupTokenRefresh(token);
      }
      
      return isLoggedIn;
    } catch (error) {
      console.error('Auth durumu kontrol edilirken hata:', error);
      return false;
    }
  }
  
  // Token'ın geçerlilik süresini kontrol edip, süre dolmadan önce yenileme işlemi başlatabilirsiniz
  private setupTokenRefresh(token: string): void {
    // Örnek: Token süresi kontrol edilip, gerekirse refresh işlemi başlatılabilir
    try {
      // Token'ın geçerliliğini kontrol et (örnek)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // milisaniye cinsinden
      const currentTime = Date.now();
      
      // 5 dakika kaldığında token'ı yenile
      const timeToRefresh = expiryTime - currentTime - (5 * 60 * 1000);
      
      if (timeToRefresh > 0) {
        // Zamanlayıcı ayarla
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeToRefresh);
      } else {
        // Token süresi zaten dolmuş, kullanıcıyı logout yap
        this.logout();
      }
    } catch (error) {
      console.error('Token kontrolü sırasında hata:', error);
    }
  }

  // Token yenileme işlemi (backend'de ilgili endpoint'i oluşturmanız gerekecek)
  private refreshToken(): Observable<any> {
    // Backend'te /auth/refresh-token gibi bir endpoint oluşturun
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {
      token: this.getToken()
    }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          this.setupTokenRefresh(response.token);
        }
      })
    );
  }
}
