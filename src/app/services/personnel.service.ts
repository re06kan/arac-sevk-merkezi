import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Personnel {
  id?: number;
  name: string;
  rank: string;
  visibility?: number;
  create_date?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private apiUrl = 'http://localhost:3000/api/personnel';

  constructor(private http: HttpClient) {}

  savePersonnel(personnel: Personnel): Observable<Personnel> {
    return this.http.post<Personnel>(this.apiUrl, {
      name: personnel.name,
      rank: personnel.rank
    }).pipe(
      catchError((error) => {
        console.error('Save Error:', error);
        return throwError(() => new Error('Kayıt sırasında bir hata oluştu'));
      })
    );
  }

  getPersonnel(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  
  toggleVisibility(id: number, newVisibility: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/visibility`, { visibility: newVisibility }).pipe(
      catchError((error) => {
        console.error('Visibility Update Error:', error);
        return throwError(() => new Error('Görünürlük güncellenirken hata oluştu'));
      })
    );
  }

  updateVisibility(id: number, visibility: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/visibility`, { visibility });
  }

  updatePersonnel(id: number, personnel: Personnel): Observable<Personnel> {
    return this.http.put<Personnel>(`${this.apiUrl}/${id}`, personnel).pipe(
      catchError((error) => {
        console.error('Update Error:', error);
        return throwError(() => new Error('Güncelleme sırasında bir hata oluştu'));
      })
    );
  }

  checkExisting(name: string, rank: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check?name=${name}&rank=${rank}`).pipe(
      catchError((error) => {
        console.error('Check Error:', error);
        return throwError(() => new Error('Kontrol sırasında bir hata oluştu'));
      })
    );
  }
}
