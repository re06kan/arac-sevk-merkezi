import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Driver } from '../models/driver.entity';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = 'http://localhost:3000/api/drivers';

  constructor(private http: HttpClient) {}

  saveDriver(driver: Driver): Observable<Driver> {
    return this.http.post<Driver>(this.apiUrl, driver).pipe(
      catchError((error) => {
        let errorMessage = 'Bir hata oluştu';
        if (error.status === 400) {
          switch(error.error.field) {
            case 'TC Kimlik No':
              errorMessage = 'Bu TC Kimlik No ile kayıtlı bir sürücü bulunmaktadır';
              break;
            case 'Telefon numarası':
              errorMessage = 'Bu telefon numarası ile kayıtlı bir sürücü bulunmaktadır';
              break;
            case 'Sicil numarası':
              errorMessage = 'Bu sicil numarası ile kayıtlı bir sürücü bulunmaktadır';
              break;
            default:
              errorMessage = 'Bu bilgilere sahip bir sürücü zaten kayıtlı';
          }
        }
        throw new Error(errorMessage);
      })
    );
  }

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(this.apiUrl);
  }

  updateVisibility(id: number, visibility: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/visibility`, { visibility });
  }

  updateDriver(id: number, driver: Driver): Observable<Driver> {
    console.log('Service - updateDriver called with:', { id, driver });
    return this.http.put<Driver>(`${this.apiUrl}/${id}`, driver);
  }
}
