import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TaskLog {
  taskId: number;
  userId?: number;
  vehicleId?: number;
  actionType: 'GOREV_AC' | 'GOREV_KAPAT' | 'UZUN_YOL' | 'KADEME_GIRIS' | 'KADEME_CIKIS' | 'KM_GUNCELLEME';
  actionDetails: {
    oldStatus?: string;
    newStatus?: string;
    km?: number;
    driverName?: string;
    routeDescription?: string;
    maintenanceDetails?: any;
    // Add new properties for KM update
    newEndKm?: number;
    reason?: string;
    updatedBy?: string;
  };
  ipAddress?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(private http: HttpClient) {}

  createTaskLog(logData: TaskLog): Observable<any> {
    return this.http.post(`${environment.apiUrl}/logs/task`, logData);
  }

  getTaskLogs(taskId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/logs/task/${taskId}`);
  }

  getAllLogs(filters: { actionType?: string, startDate?: Date, endDate?: Date } = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filters.actionType) {
      params = params.set('actionType', filters.actionType);
    }
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }
    
    return this.http.get(`${environment.apiUrl}/logs`, { params });
  }
}
