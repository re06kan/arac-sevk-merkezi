import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';  // Yeni import
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  createTask(taskData: any): Observable<any> {
    console.log('Görev oluşturma isteği:', taskData);
    
    // task_status değeri yoksa varsayılan değer atayalım
    if (taskData.task_status === undefined || taskData.task_status === null) {
      taskData.task_status = 0; // KAPALI için varsayılan değer
    }
    
    return this.http.post(this.apiUrl, taskData).pipe(
      tap(response => console.log('Görev oluşturma yanıtı:', response)),
      catchError(error => {
        console.error('Görev oluşturma hatası:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  updateTask(taskId: number, taskData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}`, taskData);
  }

  getTaskById(taskId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${taskId}`);
  }

  getTasksByVehicle(vehicleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehicle/${vehicleId}`);
  }

  getAllTasksByVehicleId(vehicleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehicle/${vehicleId}/all`).pipe(
      tap(response => console.log('Tasks fetched:', response)),
      catchError(error => {
        console.error('Error fetching tasks:', error);
        throw error;
      })
    );
  }

  getActiveTaskByVehicleId(vehicleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/active/${vehicleId}`);
  }

  startTask(taskId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}/start`, {});
  }

  endTask(taskId: number, data: { end_km: number; return_message: string }): Observable<any> {
    console.log(`Görev kapatma isteği: ID=${taskId}, Data=`, data);
    return this.http.put(`${this.apiUrl}/${taskId}/end`, data).pipe(
      tap((response: any) => console.log('Görev kapatma yanıtı:', response)),
      catchError((error: any) => {
        console.error('Görev kapatma hatası:', error);
        throw error;
      })
    );
  }

  startMaintenance(taskId: number, maintenanceData: any): Observable<any> {
    console.log('Kademe giriş isteği oluşturuluyor:', {
      taskId,
      maintenanceData
    });
    
    return this.http.post(`${this.apiUrl}/${taskId}/maintenance/start`, maintenanceData).pipe(
      tap(response => {
        console.log('Kademe giriş yanıtı:', response);
      }),
      catchError(error => {
        console.error('Kademe giriş hatası:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  endMaintenance(taskId: number, maintenanceId: number, endData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}/maintenance/${maintenanceId}/end`, endData).pipe(
      tap(response => {
        console.log('Kademe çıkış yanıtı:', response);
      }),
      catchError(error => {
        console.error('Kademe çıkış hatası:', error);
        throw error;
      })
    );
  }

  getMaintenanceDetails(taskId: number, maintenanceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${taskId}/maintenance/${maintenanceId}`).pipe(
      tap(response => console.log('Bakım detayları:', response)),
      catchError(error => {
        console.error('Bakım detayları alma hatası:', error);
        throw error;
      })
    );
  }

  // Tüm görevleri getir
  getAllTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }
  
  // Tüm bakımları getir
  getAllMaintenances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/maintenances/all`);
  }
  
  // Görev istatistiklerini getir
  getTaskStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  // Görev tiplerini getiren yeni metod
  getDistinctTaskTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  // Rapor verisi getiren metot
  getTaskReport(filters: {
    vehicles?: number[],
    vehicleTypes?: string[],
    drivers?: number[],  // YENİ: Sürücü filtresi eklendi
    assignedAuthority?: number[], // YENİ: Tahsisli makam filtresi eklendi
    taskTypes?: string[],
    startDate?: Date,
    endDate?: Date
  }): Observable<any[]> {
    // Tarihleri ISO formatına dönüştür
    let formattedStartDate = null;
    let formattedEndDate = null;
    
    if (filters.startDate) {
      formattedStartDate = filters.startDate.toISOString().split('T')[0];
    }
    
    if (filters.endDate) {
      formattedEndDate = filters.endDate.toISOString().split('T')[0];
    }
    
    return this.http.post<any[]>(`${this.apiUrl}/report`, {
      vehicleIds: filters.vehicles,
      vehicleTypes: filters.vehicleTypes,
      driverIds: filters.drivers,  // YENİ: Sürücü ID'leri
      assignedAuthorityIds: filters.assignedAuthority, // YENİ: Tahsisli makam ID'leri
      taskTypes: filters.taskTypes,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }).pipe(
      tap(response => console.log('Rapor verisi alındı:', response)),
      catchError(error => {
        console.error('Rapor verisi alırken hata:', error);
        throw error;
      })
    );
  }

  // Add new method to update task end KM
  updateTaskEndKm(taskId: number, endKm: number, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${taskId}/end-km`, { 
      end_km: endKm, 
      reason: reason
    });
  }
}
