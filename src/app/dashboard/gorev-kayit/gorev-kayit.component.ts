import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { VehicleService } from '../../services/vehicle.service';
import { DriverService } from '../../services/driver.service';
import { PersonnelService } from '../../services/personnel.service';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { Task } from '../../interfaces/task.interface';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { KademeGirisModalComponent } from '../../shared/modals/kademe-giris-modal/kademe-giris-modal.component';
import { KademeCikisModalComponent } from '../../shared/modals/kademe-cikis-modal/kademe-cikis-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MaintenanceDetailsModalComponent } from '../../shared/modals/maintenance-details-modal/maintenance-details-modal.component';
import { LogService, TaskLog } from '../../services/log.service';
import { AuthService } from '../../services/auth.service';
import { KmEditModalComponent } from '../../shared/modals/km-edit-modal/km-edit-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';

export enum GorevDurumu {
  KAPALI = 'KAPALI',
  ACIK = 'ACIK',
  KADEMEDE = 'KADEMEDE',
  UZUN_YOL = 'UZUN_YOL'
}

@Component({
  selector: 'app-gorev-kayit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSnackBarModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './gorev-kayit.component.html',
  styleUrls: ['./gorev-kayit.component.scss']
})
export class GorevKayitComponent implements OnInit, OnDestroy {
  protected GorevDurumu = GorevDurumu;
  vehicleId: string | null = null;
  vehicle: any = null;
  gorevForm: FormGroup;
  drivers: any[] = [];
  personnel: any[] = [];
  gorevDurumu: keyof typeof GorevDurumu = 'KAPALI';
  hasError = false;
  errorMessage = '';
  taskHistory: Task[] = [];
  activeTask: Task | null = null;
  displayedColumns: string[] = [
    'created_at',
    'task_status',
    'driver_info',
    'authority_info',
    'task_info',
    'return_message',
    'km_info',
    'end_date',
    'maintenance_details',
    'actions'
  ];

  driverSearchControl = new FormControl('');
  personnelSearchControl = new FormControl('');
  filteredDrivers$: Observable<any[]>;
  filteredPersonnel$: Observable<any[]>;
  private destroy$ = new Subject<void>();
  private wheelHandler: () => void = () => {};
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private personnelService: PersonnelService,
    private taskService: TaskService,
    private dialog: MatDialog,
    private logService: LogService,
    private authService: AuthService
  ) {
    this.gorevForm = this.fb.group({
      aracPlakasi: [{value: '', disabled: true}],
      surucu: [{value: '', disabled: false}, Validators.required],
      tahsisliMakam: [{value: '', disabled: false}, Validators.required],
      emirVeren: [{value: '', disabled: false}, Validators.required],
      donusMesaji: [{value: '', disabled: false}, [Validators.maxLength(200)]],
      cikisKm: [{value: '', disabled: false}, [Validators.required, Validators.min(0)]],
      gelisKm: [{value: '', disabled: false}, [Validators.min(0)]],
      gorevKagitNo: [{value: '', disabled: false}, [
        Validators.required, 
        Validators.maxLength(15)
      ]],
      gidilenGuzergah: [{value: '', disabled: false}, [Validators.required, Validators.maxLength(25)]],
      baslangicTarihi: [{value: '', disabled: true}],
      bitisTarihi: [{value: '', disabled: false}],
      gorevDurumu: [{value: 'KAPALI', disabled: true}]
    });

    this.loadDrivers();
    this.loadPersonnel();

    this.filteredDrivers$ = this.driverSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      map(value => this._filterDrivers(value || ''))
    );

    this.filteredPersonnel$ = this.personnelSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      map(value => this._filterPersonnel(value || ''))
    );

    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';
  }

  private _filterDrivers(value: any): any[] {
    if (!value || typeof value === 'object') {
      return this.drivers;
    }
    const filterValue = value.toLowerCase();
    return this.drivers.filter(driver =>
      driver?.name?.toLowerCase().includes(filterValue) ||
      driver?.rutbe?.toLowerCase().includes(filterValue)
    );
  }

  private _filterPersonnel(value: any): any[] {
    if (!value || typeof value === 'object') {
      return this.personnel;
    }
    const filterValue = value.toLowerCase();
    return this.personnel.filter(person =>
      person?.name?.toLowerCase().includes(filterValue) ||
      person?.rank?.toLowerCase().includes(filterValue)
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.wheelHandler) {
      document.removeEventListener('wheel', this.wheelHandler);
    }
  }

  private initializeFormControls() {
    this.gorevForm = this.fb.group({
      aracPlakasi: [{value: '', disabled: true}],
      surucu: ['', Validators.required],
      tahsisliMakam: ['', Validators.required],
      emirVeren: ['', Validators.required],
      donusMesaji: [''],
      cikisKm: ['', [Validators.required, Validators.min(0)]],
      gelisKm: ['', [Validators.min(0)]],
      gorevKagitNo: ['', Validators.required],
      gidilenGuzergah: ['', Validators.required],
      baslangicTarihi: [{value: '', disabled: true}],
      bitisTarihi: [''],
      gorevDurumu: [{value: 'KAPALI', disabled: true}]
    });

    this.driverSearchControl = new FormControl('');
    this.personnelSearchControl = new FormControl('');

    this.driverSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      map(value => this._filterDrivers(value || ''))
    ).subscribe(filtered => {
      this.filteredDrivers$ = new Observable(observer => observer.next(filtered));
    });

    this.personnelSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      map(value => this._filterPersonnel(value || ''))
    ).subscribe(filtered => {
      this.filteredPersonnel$ = new Observable(observer => observer.next(filtered));
    });

    this.loadDrivers();
    this.loadPersonnel();
  }

  onDriverKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.filteredDrivers$) {
      this.filteredDrivers$.subscribe(drivers => {
        if (drivers.length === 1) {
          this.gorevForm.patchValue({ surucu: drivers[0].id });
          const tahsisliMakamInput = document.querySelector('input[formControlName="tahsisliMakam"]');
          if (tahsisliMakamInput) {
            (tahsisliMakamInput as HTMLElement).focus();
          }
        }
      });
    }
  }

  onPersonnelKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.filteredPersonnel$) {
      this.filteredPersonnel$.subscribe(personnel => {
        if (personnel.length === 1) {
          this.gorevForm.patchValue({ tahsisliMakam: personnel[0].id });
          const emirVerenInput = document.querySelector('input[formControlName="emirVeren"]');
          if (emirVerenInput) {
            (emirVerenInput as HTMLElement).focus();
          }
        }
      });
    }
  }

  private updateFormControlsState() {
    if (this.isKademeMode()) {
      this.driverSearchControl.disable();
      this.personnelSearchControl.disable();
      this.gorevForm.disable();
    } else if (this.activeTask) {
      this.gorevForm.get('aracPlakasi')?.disable();
      this.gorevForm.get('surucu')?.disable();
      this.gorevForm.get('tahsisliMakam')?.disable();
      this.gorevForm.get('emirVeren')?.disable();
      this.gorevForm.get('cikisKm')?.disable();
      this.gorevForm.get('gorevKagitNo')?.disable();
      this.gorevForm.get('gidilenGuzergah')?.disable();
      this.gorevForm.get('baslangicTarihi')?.disable();
      
      this.driverSearchControl.disable();
      this.personnelSearchControl.disable();
    } else {
      this.gorevForm.enable();
      this.driverSearchControl.enable();
      this.personnelSearchControl.enable();
      
      this.gorevForm.get('aracPlakasi')?.disable();
      this.gorevForm.get('baslangicTarihi')?.disable();
      this.gorevForm.get('gorevDurumu')?.disable();
    }
  }

  isKademeMode(): boolean {
    return this.gorevDurumu === GorevDurumu.KADEMEDE;
  }

  ngOnInit() {
    document.addEventListener('wheel', this.wheelHandler, { passive: true });
    
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    if (this.vehicleId) {
      this.loadVehicleDetails(this.vehicleId);
      this.loadTaskHistory();
    }
  }

  loadTaskHistory() {
    if (this.vehicleId) {
      this.taskService.getAllTasksByVehicleId(Number(this.vehicleId)).subscribe({
        next: async (tasks: Task[]) => {
          console.log('Yüklenen tüm görevler:', tasks);
          this.taskHistory = tasks;
          
          this.activeTask = tasks.find((task: Task) => 
            [GorevDurumu.ACIK, GorevDurumu.KADEMEDE, GorevDurumu.UZUN_YOL].includes(task.task_status as GorevDurumu)
          ) || null;

          if (this.activeTask) {
            await Promise.all([
              new Promise<void>((resolve) => {
                this.driverService.getDrivers().subscribe(drivers => {
                  this.drivers = drivers;
                  resolve();
                });
              }),
              new Promise<void>((resolve) => {
                this.personnelService.getPersonnel().subscribe(personnel => {
                  this.personnel = personnel;
                  resolve();
                });
              })
            ]);

            const activeDriver = this.drivers.find(d => d.id === this.activeTask?.driver_id);
            const activePersonnel = this.personnel.find(p => p.id === this.activeTask?.assigned_authority_id);

            if (activeDriver) {
              this.driverSearchControl.setValue(activeDriver);
              this.gorevForm.patchValue({ surucu: activeDriver.id });
            }

            if (activePersonnel) {
              this.personnelSearchControl.setValue(activePersonnel);
              this.gorevForm.patchValue({ tahsisliMakam: activePersonnel.id });
            }

            this.gorevForm.patchValue({
              emirVeren: this.activeTask?.ordered_by,
              cikisKm: this.activeTask?.start_km,
              gorevKagitNo: this.activeTask?.task_paper_no,
              gidilenGuzergah: this.activeTask?.route_description,
              donusMesaji: this.activeTask?.return_message || '',
              gelisKm: this.activeTask?.end_km || ''
            });

            this.gorevForm.get('surucu')?.disable();
            this.gorevForm.get('tahsisliMakam')?.disable();
            this.gorevForm.get('emirVeren')?.disable();
            this.gorevForm.get('cikisKm')?.disable();
            this.gorevForm.get('gorevKagitNo')?.disable();
            this.gorevForm.get('gidilenGuzergah')?.disable();

            this.gorevDurumu = this.activeTask.task_status as keyof typeof GorevDurumu;

            this.updateFormControlsState();
          }

          const lastCompletedTask = tasks.find(task => task.task_status === GorevDurumu.KAPALI);
          if (lastCompletedTask && !this.activeTask) {
            this.gorevForm.patchValue({
              cikisKm: lastCompletedTask.end_km,
            });
            this.gorevForm.get('cikisKm')?.disable();
          }
          
          console.log('Görev geçmişi yüklendi:', tasks);
          console.log('Aktif görev:', this.activeTask);
        },
        error: (error) => {
          console.error('Görev geçmişi yüklenirken hata:', error);
          this.snackBar.open(
            'Görev geçmişi yüklenirken hata oluştu',
            'Kapat',
            {
              duration: 3000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  loadVehicleDetails(id: string) {
    this.vehicleService.getVehicleById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.handleError('Araç bulunamadı');
          return;
        }
        console.log('Gelen araç detayları:', data);
        
        this.vehicle = {
          ...data,
          militaryPlate: data.military_plate,
          civilianPlate: data.civilian_plate
        };
        
        this.gorevForm.patchValue({
          aracPlakasi: data.military_plate
        });
        
        this.hasError = false;
      },
      error: (error) => {
        console.error('Araç detay hatası:', error);
        this.handleError(error.message || 'Araç detayları yüklenirken hata oluştu');
      }
    });
  }

  loadDrivers() {
    this.driverService.getDrivers().subscribe({
      next: (drivers) => {
        this.drivers = drivers.filter(driver => driver.visibility === 0);
      },
      error: (error) => {
        console.error('Sürücüler yüklenirken hata:', error);
      }
    });
  }

  loadPersonnel() {
    this.personnelService.getPersonnel().subscribe({
      next: (personnel) => {
        this.personnel = personnel.filter(person => person.visibility === 0);
      },
      error: (error) => {
        console.error('Personel yüklenirken hata:', error);
      }
    });
  }

  private getVehicleId(): number {
    return this.vehicleId ? parseInt(this.vehicleId, 10) : 0;
  }

  private getActiveTaskId(): number {
    return this.activeTask?.id || 0;
  }

  private createTaskLog(logData: Partial<TaskLog>) {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      console.error('Kullanıcı ID bulunamadı');
      return;
    }

    const vehicleId = this.getVehicleId();
    if (!vehicleId) {
      console.error('Araç ID bulunamadı');
      return;
    }

    const completeLogData: TaskLog = {
      ...logData,
      userId,
      vehicleId,
      actionDetails: {
        ...logData.actionDetails,
        oldStatus: this.activeTask?.task_status || 'KAPALI',
      }
    } as TaskLog;

    this.logService.createTaskLog(completeLogData).subscribe({
      next: () => console.log('Log kaydı oluşturuldu'),
      error: (err) => console.error('Log kaydı oluşturulurken hata:', err)
    });
  }

  gorevAc() {
    if (this.gorevForm.valid) {
      this.gorevForm.get('gelisKm')?.disable();
      
      const formData = this.gorevForm.getRawValue();
      const now = new Date();

      const taskData = {
        vehicle_id: Number(this.vehicleId),
        driver_id: formData.surucu,
        assigned_authority_id: formData.tahsisliMakam,
        ordered_by: formData.emirVeren,
        start_km: formData.cikisKm,
        task_paper_no: formData.gorevKagitNo,
        route_description: formData.gidilenGuzergah,
        return_message: formData.donusMesaji || null,
        start_date: now,
        task_status: 1
      };

      this.taskService.createTask(taskData).subscribe({
        next: (response) => {
          this.createTaskLog({
            taskId: response.id,
            actionType: 'GOREV_AC',
            actionDetails: {
              newStatus: 'ACIK',
              km: taskData.start_km,
              driverName: this.drivers.find(d => d.id === taskData.driver_id)?.name,
              routeDescription: taskData.route_description
            }
          });
          this.taskService.startTask(response.id).subscribe({
            next: (startedTask) => {
              console.log('Görev başlatıldı:', startedTask);
              this.gorevDurumu = 'ACIK';
              this.activeTask = startedTask;
              this.loadTaskHistory();

              this.snackBar.open(startedTask.message || 'Görev başarıyla başlatıldı', 'Kapat', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 2000);
            },
            error: (error) => {
              console.error('Görev başlatma hatası:', error);
              const errorMessage = error.error?.error || 'Görev başlatılırken hata oluştu';
              
              this.snackBar.open(errorMessage, 'Kapat', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });

              if (error.status !== 400) {
                this.loadTaskHistory();
              }
            }
          });
        },
        error: (error) => {
          console.error('Görev oluşturma hatası:', error);
          this.snackBar.open('Görev oluşturulurken hata oluştu', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      const invalidFields = Object.keys(this.gorevForm.controls)
        .filter(key => this.gorevForm.get(key)?.invalid)
        .join(', ');

      console.log('Eksik/hatalı alanlar:', invalidFields);
      
      this.snackBar.open(`Lütfen zorunlu alanları doldurun: ${invalidFields}`, 'Kapat', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  gorevKapat() {
    if (!this.activeTask?.id) {
      this.snackBar.open('Aktif görev bulunamadı', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
  
    this.gorevForm.get('gelisKm')?.enable();
  
    const gelisKm = this.gorevForm.get('gelisKm')?.value;
    const cikisKm = this.gorevForm.get('cikisKm')?.value;
    const donusMesaji = this.gorevForm.get('donusMesaji')?.value || '';
  
    if (!gelisKm) {
      this.snackBar.open('Lütfen geliş KM bilgisini giriniz', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
  
    if (gelisKm <= cikisKm) {
      this.snackBar.open('Geliş KM, çıkış KM\'den büyük olmalıdır', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
  
    this.taskService.endTask(this.activeTask.id, {
      end_km: gelisKm,
      return_message: donusMesaji
    }).subscribe({
      next: (response) => {
        this.createTaskLog({
          taskId: this.getActiveTaskId(),
          actionType: 'GOREV_KAPAT',
          actionDetails: {
            newStatus: 'KAPALI',
            km: gelisKm
          }
        });
        this.snackBar.open('Görev başarıyla kapatıldı', 'Kapat', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.gorevDurumu = 'KAPALI';
        this.activeTask = null;
        this.loadTaskHistory();
  
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Görev kapatma hatası:', error);
        this.snackBar.open(
          error.error?.error || 'Görev kapatılırken bir hata oluştu',
          'Kapat',
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  kademeGiris() {
    if (this.taskHistory.length === 0) {
      this.snackBar.open(
        'Bu araç için henüz hiç görev kaydı bulunmamaktadır. KM bilgisi olmadığından kademe girişi yapılamaz.', 
        'Kapat', 
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    
    if (this.drivers.length === 0) {
      this.snackBar.open('Kayıtlı sürücü bulunamadı. Lütfen önce bir sürücü kaydı yapın.', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const lastTask = this.taskHistory.find(t => t.task_status === 'KAPALI');
    const startKm = lastTask?.end_km || 0;
    
    const defaultDriver = this.drivers.find(d => d.visibility === 0) || this.drivers[0];
    if (!defaultDriver) {
      this.snackBar.open('Geçerli bir sürücü bulunamadı!', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const defaultAuthority = this.personnel.find(p => p.visibility === 0) || this.personnel[0];
    if (!defaultAuthority) {
      this.snackBar.open('Geçerli bir yetkili personel bulunamadı!', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const dialogRef = this.dialog.open(KademeGirisModalComponent, {
      width: '1200px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: true,
      ariaLabel: 'Kademe Giriş Modalı',
      role: 'dialog',
      hasBackdrop: true,
      disableClose: false,
      panelClass: ['kademe-giris-dialog', 'cdk-overlay-pane-no-pointer-events'],
      data: {
        vehicle: this.vehicle,
        currentTask: this.activeTask,
        teknisyenler: []
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Kademe kayıt verileri:', result);
        
        if (!this.activeTask) {
          const taskData = {
            vehicle_id: Number(this.vehicleId),
            driver_id: defaultDriver.id,
            assigned_authority_id: defaultAuthority.id,
            ordered_by: 'Kademe İşlemi',
            start_km: startKm,
            task_paper_no: 'KDM-'+new Date().getTime(),
            route_description: 'Kademe işlemi',
            return_message: result.notlar || null,
            task_status: 1
          };
          
          console.log('Oluşturulacak görev verileri:', taskData);
          
          this.taskService.createTask(taskData).subscribe({
            next: (response) => {
              this.activeTask = response;
              this.createTaskLog({
                taskId: response.id,
                actionType: 'KADEME_GIRIS',
                actionDetails: {
                  newStatus: 'KADEMEDE',
                  maintenanceDetails: result
                }
              });
              this.kademeKaydet(response.id, result);
            },
            error: (error) => {
              console.error('Görev oluşturma hatası:', error);
              const errorMessage = error.error?.details || error.error?.message || error.error?.error || 'Bilinmeyen hata';
              this.snackBar.open(
                'Görev oluşturulurken hata: ' + errorMessage,
                'Kapat', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
            }
          });
        } else {
          this.kademeKaydet(this.activeTask.id, result);
        }
      }
    });
  }
  
  private kademeKaydet(taskId: number, formData: any) {
    console.log('Kademe kaydı için gönderilen veri:', {taskId, formData});
    
    this.taskService.startMaintenance(taskId, formData).subscribe({
      next: (response) => {
        console.log('Kademe kaydı yanıtı:', response);
        if (response.success) {
          this.createTaskLog({
            taskId: taskId,
            actionType: 'KADEME_GIRIS',
            actionDetails: {
              newStatus: 'KADEMEDE',
              maintenanceDetails: formData
            }
          });
          this.snackBar.open('Kademe kaydı başarıyla oluşturuldu', 'Kapat', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.gorevDurumu = 'KADEMEDE'; 
          this.loadTaskHistory();
          
          this.updateFormControlsState();
        } else {
          this.snackBar.open('Kademe kaydı oluşturuldu ancak durum güncellenemedi', 'Kapat', {
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Kademe kaydı hatası:', error);
        this.snackBar.open(
          'Kademe kaydı oluşturulurken hata: ' + 
          (error.error?.message || error.error?.error || error.message || 'Bilinmeyen hata'),
          'Kapat',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  kademeCikis() {
    console.log('Kademe çıkış butonuna basıldı');
    console.log('Aktif görev:', this.activeTask);
    
    if (!this.activeTask?.id || !this.activeTask?.maintenance_id) {
      this.snackBar.open('Bu araç için aktif kademe kaydı bulunamadı', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
  
    const dialogRef = this.dialog.open(KademeCikisModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'full-width-dialog',
      data: {
        vehicle: this.vehicle,
        activeTask: this.activeTask
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog sonucu:', result);
      if (result && this.activeTask?.id) {
        const maintenanceId = this.activeTask.maintenance_id || 0;
        
        this.taskService.endMaintenance(this.activeTask.id, maintenanceId, result).subscribe({
          next: (response) => {
            this.createTaskLog({
              taskId: this.getActiveTaskId(),
              actionType: 'KADEME_CIKIS',
              actionDetails: {
                newStatus: response.new_status,
                maintenanceDetails: result
              }
            });
            this.snackBar.open('Kademe çıkışı yapıldı', 'Kapat', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.gorevDurumu = 'KAPALI'; 
            this.activeTask = null;
            this.loadTaskHistory();
            
            this.updateFormControlsState();
          },
          error: (error) => {
            console.error('Kademe çıkış hatası:', error);
            this.snackBar.open('Kademe çıkışı yapılırken hata oluştu', 'Kapat', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  uzunYol() {
    if (this.gorevForm.valid) {
      this.gorevForm.get('gelisKm')?.disable();
      
      if (!this.gorevForm.valid) {
        const invalidFields = Object.keys(this.gorevForm.controls)
          .filter(key => this.gorevForm.get(key)?.invalid)
          .join(', ');
  
        this.snackBar.open(`Lütfen zorunlu alanları doldurun: ${invalidFields}`, 'Kapat', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
        return;
      }
    
      const formData = this.gorevForm.getRawValue();
      const taskData = {
        vehicle_id: Number(this.vehicleId),
        driver_id: formData.surucu,
        assigned_authority_id: formData.tahsisliMakam,
        ordered_by: formData.emirVeren,
        start_km: formData.cikisKm,
        task_paper_no: formData.gorevKagitNo,
        route_description: formData.gidilenGuzergah,
        task_status: 3
      };
    
      this.taskService.createTask(taskData).subscribe({
        next: (response) => {
          this.createTaskLog({
            taskId: response.id,
            actionType: 'UZUN_YOL',
            actionDetails: {
              newStatus: 'UZUN_YOL',
              km: taskData.start_km,
              driverName: this.drivers.find(d => d.id === taskData.driver_id)?.name,
              routeDescription: taskData.route_description
            }
          });
          this.taskService.startTask(response.id).subscribe({
            next: (startedTask) => {
              this.snackBar.open('Uzun yol görevi başarıyla başlatıldı', 'Kapat', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              this.gorevDurumu = 'UZUN_YOL';
              this.activeTask = startedTask;
  
              this.loadTaskHistory();
              
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 2000);
            },
            error: (error) => {
              this.loadTaskHistory();
              
              this.snackBar.open('Uzun yol görevi oluşturuldu fakat başlatılamadı. Sayfa yenileniyor...', 'Kapat', {
                duration: 3000,
                panelClass: ['warning-snackbar']
              });
            }
          });
        },
        error: (error) => {
          console.error('Uzun yol görevi oluşturma hatası:', error);
          this.snackBar.open(
            error.error?.error || 'Uzun yol görevi oluşturulurken hata oluştu',
            'Kapat',
            {
              duration: 3000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  onSubmit() {
    if (this.gorevForm.valid && this.vehicleId) {
      const formData = this.gorevForm.getRawValue();
      
      const taskData = {
        vehicle_id: Number(this.vehicleId),
        driver_id: formData.surucu,
        assigned_authority_id: formData.tahsisliMakam,
        ordered_by: formData.emirVeren,
        start_km: formData.cikisKm,
        end_km: formData.gelisKm || null,
        task_paper_no: formData.gorevKagitNo,
        route_description: formData.gidilenGuzergah,
        return_message: formData.donusMesaji || null,
        task_status: 0
      };

      console.log('Gönderilen görev verileri:', taskData);

      this.taskService.createTask(taskData).subscribe({
        next: (response) => {
          this.snackBar.open('Görev başarıyla kaydedildi', 'Kapat', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.gorevDurumu === 'ACIK') {
            this.taskService.startTask(response.id).subscribe({
              next: () => {
                console.log('Görev başlatıldı');
              },
              error: (error) => {
                console.error('Görev başlatma hatası:', error);
              }
            });
          }

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 3000);
        },
        error: (error) => {
          console.error('Görev kaydetme hatası:', error);
          const errorMessage = error.error?.message || error.error?.details || error.error?.error || error.message;
          
          this.snackBar.open(
            'Görev kaydedilirken bir hata oluştu: ' + errorMessage,
            'Kapat',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    } else {
      this.snackBar.open('Lütfen tüm zorunlu alanları doldurun', 'Kapat', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
    }
  }

  private handleError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.snackBar.open(message, 'Kapat', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    });
  }

  toUpperCase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.toLocaleUpperCase('tr-TR');
    input.setSelectionRange(start, end);
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const pattern = /[a-zA-ZğüşıöçĞÜŞİÖÇ\s]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  displayDriverFn(driver: any): string {
    if (!driver) return '';
    if (typeof driver === 'string') return driver;
    return driver.rutbe && driver.name ? `${driver.rutbe} - ${driver.name}` : '';
  }

  displayPersonnelFn(person: any): string {
    if (!person) return '';
    if (typeof person === 'string') return person;
    return person.rank && person.name ? `${person.rank} - ${person.name}` : '';
  }

  onDriverSelected(event: MatAutocompleteSelectedEvent): void {
    const driver = event.option.value;
    this.gorevForm.patchValue({ surucu: driver.id });
  }

  onPersonnelSelected(event: MatAutocompleteSelectedEvent): void {
    const person = event.option.value;
    this.gorevForm.patchValue({ tahsisliMakam: person.id });
  }

  calculateTaskDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let duration = '';
    if (days > 0) duration += `${days} gün `;
    if (hours > 0) duration += `${hours} saat `;
    if (minutes > 0) duration += `${minutes} dakika`;
    
    return duration.trim() || '1 dakikadan az';
  }

  isGorevDurumu(durum: GorevDurumu): boolean {
    return this.gorevDurumu === durum;
  }

  isUzunYolClosed(task: Task): boolean {
    return task.task_status === GorevDurumu.KAPALI && 
           task.task_type === 'UZUN_YOL';
  }

  getStatusColor(): string {
    switch (this.gorevDurumu) {
      case 'UZUN_YOL':
        return '#1976d2';
      case 'ACIK':
        return '#f44336';
      case 'KADEMEDE':
        return '#ff9800';
      case 'KAPALI':
      default:
        return '#4caf50';
    }
  }

  showMaintenanceDetails(task: Task) {
    if (!task.maintenance_id) {
      this.snackBar.open('Bu göreve ait bakım detayı bulunamadı', 'Kapat', {
        duration: 3000
      });
      return;
    }
  
    event?.stopPropagation();
    event?.preventDefault();
  
    console.log('Bakım detayları görüntüleniyor, taskId:', task.id, 'maintenanceId:', task.maintenance_id);
    
    this.taskService.getMaintenanceDetails(task.id, task.maintenance_id).subscribe({
      next: (maintenance) => {
        this.dialog.open(MaintenanceDetailsModalComponent, {
          width: '800px',
          maxWidth: '95vw',
          panelClass: ['maintenance-detail-dialog', 'no-scroll-dialog'],
          data: {
            maintenance: maintenance,
            vehicle: this.vehicle,
            task: task
          },
          disableClose: false,
          autoFocus: false,
          closeOnNavigation: true,
          restoreFocus: true
        });
      },
      error: (error) => {
        console.error('Bakım detayları alınırken hata:', error);
        this.snackBar.open('Bakım detayları alınamadı', 'Kapat', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  
    return false;
  }

  canEnterMaintenance(): boolean {
    if (this.gorevDurumu === GorevDurumu.KADEMEDE) {
      return false;
    }
    
    if (this.gorevDurumu === GorevDurumu.ACIK) {
      return false;
    }

    return this.gorevDurumu === GorevDurumu.KAPALI;
  }

  // Add method to check if vehicle is currently available (not on any task)
  isVehicleAvailable(): boolean {
    // Check if there's an active task for this vehicle
    const activeTaskExists = this.taskHistory.some(task => 
      task.task_status === 'ACIK' || 
      task.task_status === 'KADEMEDE' || 
      task.task_status === 'UZUN_YOL'
    );
    
    return !activeTaskExists;
  }

  // Add method to check if a task is the last closed task
  isLastClosedTask(task: Task): boolean {
    if (task.task_status !== 'KAPALI') return false;
    
    // Get all closed tasks
    const closedTasks = this.taskHistory.filter(t => t.task_status === 'KAPALI');
    if (closedTasks.length === 0) return false;
    
    // Sort by end_date or created_at descending to get the most recent one
    const sortedByDate = [...closedTasks].sort((a, b) => {
      const dateA = new Date(a.end_date || a.created_at);
      const dateB = new Date(b.end_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Return true if this task is the most recent closed task
    return sortedByDate[0].id === task.id;
  }

  // Update the openKmEditDialog method to check vehicle availability
  openKmEditDialog(task: Task): void {
    if (!this.isAdmin) {
      this.snackBar.open('Bu işlem için yönetici yetkisi gerekiyor', 'Tamam', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    if (task.task_status !== 'KAPALI') {
      this.snackBar.open('Sadece kapalı görevlerde KM güncellemesi yapılabilir', 'Tamam', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    if (!this.isVehicleAvailable()) {
      this.snackBar.open('Araç şu anda aktif bir görevde olduğu için KM güncellemesi yapılamaz', 'Tamam', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    if (!this.isLastClosedTask(task)) {
      this.snackBar.open('Sadece en son kapatılan görevde KM güncellemesi yapılabilir', 'Tamam', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    const dialogRef = this.dialog.open(KmEditModalComponent, {
      width: '500px',
      data: {
        task: task,
        vehicle: this.vehicle
      },
      disableClose: false,
      ariaLabelledBy: 'km-edit-dialog-title',
      autoFocus: true,
      restoreFocus: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTaskKm(result.taskId, result.endKm, result.reason);
      }
    });
  }

  updateTaskKm(taskId: number, endKm: number, reason: string): void {
    this.taskService.updateTaskEndKm(taskId, endKm, reason).subscribe({
      next: (response) => {
        this.snackBar.open('KM bilgisi başarıyla güncellendi', 'Tamam', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });
        
        // Create log for the update with correct property names
        this.createTaskLog({
          taskId: taskId,
          actionType: 'KM_GUNCELLEME',
          actionDetails: {
            km: endKm, // Use the existing km property
            reason: reason, // This is already allowed in our updated interface
            updatedBy: this.authService.getCurrentUser()?.username
          }
        });
        
        // Refresh task history
        this.loadTaskHistory();
      },
      error: (error) => {
        console.error('KM güncelleme hatası:', error);
        this.snackBar.open(
          'KM bilgisi güncellenirken bir hata oluştu: ' + 
          (error.error?.message || error.message || 'Bilinmeyen hata'),
          'Tamam',
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }
}
