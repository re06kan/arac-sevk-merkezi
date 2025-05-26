import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id?: number;
  username: string;
  password?: string;
  fullname: string;
  role: string;
  visibility?: number;
  create_date?: string;
  last_login?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching users:', error);
          return throwError(() => error);
        })
      );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user)
      .pipe(
        catchError(error => {
          console.error('Error creating user:', error);
          return throwError(() => error);
        })
      );
  }

  updateUser(id: string, user: User): Observable<User> {
    // Convert user property names to match server expectations
    const serverUser = {
      username: user.username,
      fullname: user.fullname, 
      role: user.role,
      password: user.password
    };
    
    console.log(`Sending PUT request to ${this.apiUrl}/${id} with data:`, serverUser);
    
    return this.http.put<User>(`${this.apiUrl}/${id}`, serverUser)
      .pipe(
        catchError(error => {
          console.error(`Error updating user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  updateUserVisibility(id: string, visibility: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}/visibility`, { visibility })
      .pipe(
        catchError(error => {
          console.error(`Error updating user visibility ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
}
