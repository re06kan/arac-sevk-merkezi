import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private apiUrl = 'http://localhost:3000/api/vehicles';

  constructor(private http: HttpClient) {}

  saveVehicle(vehicle: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, vehicle).pipe(
      catchError((error) => {
        let errorMessage = 'Bir hata oluştu';
        if (error.status === 400) {
          switch(error.error.field) {
            case 'Askeri Plaka':
              errorMessage = 'Bu Askeri Plaka ile kayıtlı bir araç bulunmaktadır';
              break;
            case 'Sivil Plaka':
              errorMessage = 'Bu Sivil Plaka ile kayıtlı bir araç bulunmaktadır';
              break;
            case 'Şasi Numarası':
              errorMessage = 'Bu Şasi Numarası ile kayıtlı bir araç bulunmaktadır';
              break;
            case 'Motor Numarası':
              errorMessage = 'Bu Motor Numarası ile kayıtlı bir araç bulunmaktadır';
              break;
            default:
              errorMessage = 'Bu bilgilere sahip bir araç zaten kayıtlı';
          }
        }
        throw new Error(errorMessage);
      })
    );
  }

  getVehicles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getVehiclesWithKm(date?: Date): Observable<any[]> {
    let url = `${this.apiUrl}/with-km`;

    // Tarih parametresi varsa ekle
    if (date) {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD formatına çevir
      url += `?date=${formattedDate}`;
    }

    return this.http.get<any[]>(url).pipe(
      tap(vehicles => console.log('Vehicles with KM fetched:', vehicles.length)),
      catchError(error => {
        console.error('Error fetching vehicles with KM:', error);
        return throwError(() => error);
      })
    );
  }

  getVehicleById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Vehicle fetch error:', error);
        if (error.status === 404) {
          return throwError(() => new Error('Araç bulunamadı'));
        }
        return throwError(() => new Error('Araç detayları alınırken hata oluştu'));
      })
    );
  }

  updateVehicle(id: number, vehicle: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, vehicle);
  }

  updateVisibility(id: number, visibility: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/visibility`, { visibility });
  }
}
